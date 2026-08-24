import 'server-only';

import type { Prisma } from '@prisma/client';
import { db } from '../db';
import { AppError } from '../api';
import { FRAUD_FLAGS, type FraudFlag } from '../enums';
import { addDays, parseJson } from '../utils';
import { credit, reverseCredit } from './wallet';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  REFERRAL ENGINE
 * ════════════════════════════════════════════════════════════════════════
 *  Lifecycle:
 *
 *   signup    attachReferral()      → Referral(status=signed_up) + fraud flags
 *                                     + signup coupon issued to the referee
 *   payment   processOrderCommission() → picks the rule for the referrer's tier,
 *                                     creates ReferralCommission(status=held)
 *                                     and a PENDING wallet credit that matures
 *                                     after rule.holdDays
 *   maturity  wallet.maturePendingCredits() → held → unlocked, money becomes
 *                                     spendable and withdrawable
 *   refund    reverseCommissionForOrder() → claws the credit back if the order
 *                                     is cancelled or returned in the window
 *
 *  Commission is never credited as immediately-withdrawable. Paying out a
 *  commission on an order that is later returned means real money is gone, so
 *  the hold window is the whole point of the design.
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
  'yopmail.com', 'trashmail.com', 'sharklasers.com', 'throwawaymail.com',
  'temp-mail.org', 'getnada.com', 'dispostable.com', 'maildrop.cc',
]);

/** Signups from one referrer inside this window that trip the velocity flag. */
const VELOCITY_WINDOW_HOURS = 24;
const VELOCITY_THRESHOLD = 5;

const RISK_WEIGHTS: Record<FraudFlag, number> = {
  self_referral: 100,
  same_device: 45,
  same_ip: 30,
  disposable_email: 25,
  referrer_velocity: 20,
  below_min_order: 10,
};

export function riskScoreFor(flags: FraudFlag[]): number {
  return Math.min(100, flags.reduce((s, f) => s + (RISK_WEIGHTS[f] ?? 0), 0));
}

// ── Rule resolution ───────────────────────────────────────────────────

/**
 * Picks the rule that applies to a referrer right now.
 *
 * Tiers are expressed as `tierMinConversions`: a referrer with 12 conversions
 * matches every rule whose threshold is ≤ 12, and we take the highest such
 * threshold — so high performers automatically graduate onto better slabs
 * without anyone editing their account. `priority` breaks ties.
 */
export async function resolveRule(referrerId: string, tx: Prisma.TransactionClient | typeof db = db) {
  const conversions = await tx.referral.count({
    where: { referrerId, status: 'converted', isBlocked: false },
  });

  const rules = await tx.referralRule.findMany({
    where: { isActive: true, tierMinConversions: { lte: conversions } },
    orderBy: [{ tierMinConversions: 'desc' }, { priority: 'desc' }],
    take: 1,
  });

  return { rule: rules[0] ?? null, conversions };
}

export function computeCommission(
  rule: { commissionType: string; commissionValue: number; maxCommissionPaise: number | null },
  orderValuePaise: number,
): number {
  const raw =
    rule.commissionType === 'percent'
      ? Math.round((orderValuePaise * rule.commissionValue) / 100)
      : rule.commissionValue;
  const capped = rule.maxCommissionPaise ? Math.min(raw, rule.maxCommissionPaise) : raw;
  return Math.max(0, capped);
}

// ── Signup attribution ────────────────────────────────────────────────

export type AttachResult =
  | { attached: true; referrerName: string | null; couponCode: string | null; flags: FraudFlag[] }
  | { attached: false; reason: string };

/**
 * Links a brand-new user to the owner of `code`, records fraud signals and
 * issues the referee's signup coupon.
 *
 * Runs inside the signup transaction: if anything here throws, the account is
 * not created either, so we never end up with an unattributed referred user.
 */
export async function attachReferral(
  tx: Prisma.TransactionClient,
  newUser: { id: string; email: string | null; phone: string | null; name: string | null },
  code: string,
  meta: { ip?: string | null; device?: string | null },
): Promise<AttachResult> {
  const referrer = await tx.user.findUnique({
    where: { referralCode: code.trim().toUpperCase() },
    select: { id: true, name: true, email: true, phone: true, signupIp: true, signupDevice: true, status: true },
  });

  if (!referrer) return { attached: false, reason: 'That referral code is not recognised.' };
  if (referrer.status !== 'active') {
    return { attached: false, reason: 'That referral code is no longer active.' };
  }

  const flags: FraudFlag[] = [];

  // Self-referral: same account, or the same contact details on a second account.
  const sameContact =
    (!!newUser.email && newUser.email === referrer.email) ||
    (!!newUser.phone && newUser.phone === referrer.phone);
  if (referrer.id === newUser.id || sameContact) {
    return { attached: false, reason: 'You cannot refer yourself.' };
  }

  if (meta.ip && referrer.signupIp && meta.ip === referrer.signupIp) flags.push(FRAUD_FLAGS.SAME_IP);
  if (meta.device && referrer.signupDevice && meta.device === referrer.signupDevice) {
    flags.push(FRAUD_FLAGS.SAME_DEVICE);
  }

  const domain = newUser.email?.split('@')[1]?.toLowerCase();
  if (domain && DISPOSABLE_DOMAINS.has(domain)) flags.push(FRAUD_FLAGS.DISPOSABLE_EMAIL);

  const recent = await tx.referral.count({
    where: {
      referrerId: referrer.id,
      signedUpAt: { gte: new Date(Date.now() - VELOCITY_WINDOW_HOURS * 3600_000) },
    },
  });
  if (recent >= VELOCITY_THRESHOLD) flags.push(FRAUD_FLAGS.VELOCITY);

  const risk = riskScoreFor(flags);
  // Same device AND same IP together is near-certainly one person farming
  // codes — hold it for review rather than paying out silently.
  const autoBlock =
    flags.includes(FRAUD_FLAGS.SAME_DEVICE) && flags.includes(FRAUD_FLAGS.SAME_IP);

  await tx.user.update({
    where: { id: newUser.id },
    data: { referredById: referrer.id },
  });

  await tx.referral.create({
    data: {
      referrerId: referrer.id,
      refereeId: newUser.id,
      code: code.trim().toUpperCase(),
      status: 'signed_up',
      signupIp: meta.ip ?? null,
      signupDevice: meta.device ?? null,
      fraudFlags: JSON.stringify(flags),
      riskScore: risk,
      isBlocked: autoBlock,
      blockReason: autoBlock ? 'Same device and IP as the referrer — held for review.' : null,
    },
  });

  // The referee's welcome offer. Configured by admin as a coupon flagged
  // `isSignupCoupon`; absent one, the referee simply gets no discount.
  const { rule } = await resolveRule(referrer.id, tx);
  let couponCode: string | null = rule?.refereeCouponCode ?? null;
  if (!couponCode) {
    const fallback = await tx.coupon.findFirst({
      where: { isSignupCoupon: true, isActive: true },
      select: { code: true },
    });
    couponCode = fallback?.code ?? null;
  }

  return { attached: true, referrerName: referrer.name, couponCode, flags };
}

// ── Conversion & commission ───────────────────────────────────────────

export type CommissionOutcome =
  | { credited: true; commissionPaise: number; unlockAt: Date; ruleName: string }
  | { credited: false; reason: string };

/**
 * Credits the referrer for a paid order. Idempotent on two levels:
 * `Order.referralProcessedAt` and the unique (orderId, referrerId) index — a
 * duplicated webhook cannot pay a commission twice.
 */
export async function processOrderCommission(orderId: string): Promise<CommissionOutcome> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        totalPaise: true,
        subtotalPaise: true,
        walletAppliedPaise: true,
        paymentStatus: true,
        status: true,
        referralProcessedAt: true,
      },
    });
    if (!order) throw new AppError('Order not found.', 404);
    if (order.referralProcessedAt) {
      return { credited: false, reason: 'Commission already processed for this order.' };
    }
    if (order.paymentStatus !== 'paid') {
      return { credited: false, reason: 'Order is not fully paid yet.' };
    }

    const referral = await tx.referral.findUnique({
      where: { refereeId: order.userId },
      select: {
        id: true,
        referrerId: true,
        refereeId: true,
        status: true,
        isBlocked: true,
        firstOrderId: true,
        fraudFlags: true,
      },
    });

    // Stamp the guard regardless, so a non-referred order isn't re-checked forever.
    const stamp = () =>
      tx.order.update({ where: { id: order.id }, data: { referralProcessedAt: new Date() } });

    if (!referral) {
      await stamp();
      return { credited: false, reason: 'This customer was not referred.' };
    }
    if (referral.isBlocked) {
      await stamp();
      return { credited: false, reason: 'Referral is blocked pending fraud review.' };
    }

    const { rule } = await resolveRule(referral.referrerId, tx);
    if (!rule) {
      await stamp();
      return { credited: false, reason: 'No active commission rule applies.' };
    }

    if (rule.appliesTo === 'first_order_only' && referral.firstOrderId) {
      await stamp();
      return { credited: false, reason: 'Rule pays on the first order only.' };
    }

    /**
     * Commission is computed on what the customer actually paid us, excluding
     * wallet money — otherwise commission could be paid on commission, letting
     * a chain mint balance out of nothing.
     */
    const commissionableValue = Math.max(0, order.totalPaise - order.walletAppliedPaise);

    if (commissionableValue < rule.minOrderPaise) {
      const flags = parseJson<FraudFlag[]>(referral.fraudFlags, []);
      if (!flags.includes(FRAUD_FLAGS.BELOW_MIN_ORDER)) {
        flags.push(FRAUD_FLAGS.BELOW_MIN_ORDER);
        await tx.referral.update({
          where: { id: referral.id },
          data: { fraudFlags: JSON.stringify(flags) },
        });
      }
      await stamp();
      return {
        credited: false,
        reason: `Order value is below the ₹${rule.minOrderPaise / 100} minimum for commission.`,
      };
    }

    const commissionPaise = computeCommission(rule, commissionableValue);
    if (commissionPaise <= 0) {
      await stamp();
      return { credited: false, reason: 'Computed commission is zero.' };
    }

    const unlockAt = addDays(new Date(), rule.holdDays);

    // Held credit — spendable only after the return window closes.
    const txn = await credit(
      {
        userId: referral.referrerId,
        type: 'referral_commission',
        amountPaise: commissionPaise,
        description: `Referral commission — order ${orderId.slice(-6).toUpperCase()}`,
        status: 'pending',
        availableAt: unlockAt,
        referenceType: 'referral',
        referenceId: referral.id,
        orderId: order.id,
      },
      tx,
    );

    await tx.referralCommission.create({
      data: {
        referralId: referral.id,
        referrerId: referral.referrerId,
        refereeId: referral.refereeId,
        orderId: order.id,
        ruleId: rule.id,
        orderValuePaise: commissionableValue,
        commissionPaise,
        status: 'held',
        unlockAt,
        walletTxnId: txn.id,
      },
    });

    if (referral.status !== 'converted') {
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'converted',
          convertedAt: new Date(),
          firstOrderId: referral.firstOrderId ?? order.id,
        },
      });
    }

    await stamp();

    return { credited: true, commissionPaise, unlockAt, ruleName: rule.name };
  });
}

/**
 * Reverses commissions tied to an order that was cancelled or returned.
 * Held money is simply removed; already-matured money is clawed back from the
 * spendable balance and any shortfall is recorded for finance to chase.
 */
export async function reverseCommissionForOrder(
  orderId: string,
  reason: string,
): Promise<{ reversed: number; shortfallPaise: number }> {
  return db.$transaction(async (tx) => {
    const commissions = await tx.referralCommission.findMany({
      where: { orderId, status: { in: ['held', 'unlocked', 'pending'] } },
    });

    let shortfallTotal = 0;
    for (const c of commissions) {
      if (c.walletTxnId) {
        const res = await reverseCredit(c.walletTxnId, `Reversed — ${reason}`, tx);
        shortfallTotal += res.shortfallPaise;
      }
      await tx.referralCommission.update({
        where: { id: c.id },
        data: { status: 'reversed', reversedReason: reason },
      });
    }

    return { reversed: commissions.length, shortfallPaise: shortfallTotal };
  });
}

// ── Admin adjustments ─────────────────────────────────────────────────

/** Manual override. Keeps the original amount for audit and moves the money. */
export async function adjustCommission(
  commissionId: string,
  newAmountPaise: number,
  adminId: string,
  note: string,
) {
  return db.$transaction(async (tx) => {
    const c = await tx.referralCommission.findUnique({ where: { id: commissionId } });
    if (!c) throw new AppError('Commission not found.', 404);
    if (c.status === 'paid') throw new AppError('This commission has already been paid out.', 409);
    if (c.status === 'reversed') throw new AppError('This commission was reversed.', 409);
    if (newAmountPaise < 0) throw new AppError('Amount cannot be negative.');

    const delta = newAmountPaise - c.commissionPaise;

    if (delta !== 0 && c.walletTxnId) {
      const original = await tx.walletTransaction.findUnique({ where: { id: c.walletTxnId } });
      if (original) {
        const isPending = original.status === 'pending';
        const wallet = await tx.wallet.update({
          where: { id: original.walletId },
          data: isPending
            ? { pendingPaise: { increment: delta } }
            : { balancePaise: { increment: delta } },
        });
        await tx.walletTransaction.update({
          where: { id: original.id },
          data: {
            amountPaise: newAmountPaise,
            balanceAfterPaise: wallet.balancePaise,
            description: `${original.description} · adjusted by admin`,
          },
        });
      }
    }

    return tx.referralCommission.update({
      where: { id: commissionId },
      data: {
        commissionPaise: newAmountPaise,
        originalPaise: c.originalPaise ?? c.commissionPaise,
        isAdminAdjusted: true,
        adminNote: note,
        adjustedById: adminId,
      },
    });
  });
}

export async function setReferralBlocked(
  referralId: string,
  blocked: boolean,
  reason: string | null,
) {
  return db.referral.update({
    where: { id: referralId },
    data: { isBlocked: blocked, blockReason: blocked ? reason : null },
  });
}

// ── Dashboards ────────────────────────────────────────────────────────

export async function getReferralDashboard(userId: string) {
  const [user, referrals, commissionGroups, ruleInfo, allRules] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, name: true },
    }),
    db.referral.findMany({
      where: { referrerId: userId },
      orderBy: { signedUpAt: 'desc' },
      include: {
        referee: { select: { name: true, email: true, phone: true, createdAt: true } },
        commissions: { select: { commissionPaise: true, status: true } },
      },
    }),
    db.referralCommission.groupBy({
      by: ['status'],
      where: { referrerId: userId },
      _sum: { commissionPaise: true },
      _count: true,
    }),
    resolveRule(userId),
    db.referralRule.findMany({
      where: { isActive: true },
      orderBy: { tierMinConversions: 'asc' },
      select: {
        id: true,
        name: true,
        tierMinConversions: true,
        tierLabel: true,
        commissionType: true,
        commissionValue: true,
        maxCommissionPaise: true,
        holdDays: true,
        minOrderPaise: true,
        appliesTo: true,
      },
    }),
  ]);

  const byStatus = (s: string) =>
    commissionGroups.find((g) => g.status === s)?._sum.commissionPaise ?? 0;

  const invited = referrals.filter((r) => r.status === 'signed_up' && !r.isBlocked).length;
  const converted = referrals.filter((r) => r.status === 'converted').length;
  const flagged = referrals.filter((r) => r.isBlocked || r.riskScore >= 45).length;

  const heldPaise = byStatus('held') + byStatus('pending');
  const unlockedPaise = byStatus('unlocked');
  const paidPaise = byStatus('paid');

  const nextTier = allRules.find((r) => r.tierMinConversions > ruleInfo.conversions) ?? null;

  return {
    referralCode: user?.referralCode ?? '',
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/signup?ref=${user?.referralCode ?? ''}`,
    counts: {
      total: referrals.length,
      invited,
      converted,
      flagged,
    },
    earnings: {
      heldPaise,
      unlockedPaise,
      paidPaise,
      reversedPaise: byStatus('reversed'),
      lifetimePaise: heldPaise + unlockedPaise + paidPaise,
    },
    currentRule: ruleInfo.rule,
    conversions: ruleInfo.conversions,
    nextTier,
    tiers: allRules,
    referrals: referrals.map((r) => ({
      id: r.id,
      status: r.status,
      isBlocked: r.isBlocked,
      riskScore: r.riskScore,
      fraudFlags: parseJson<FraudFlag[]>(r.fraudFlags, []),
      signedUpAt: r.signedUpAt,
      convertedAt: r.convertedAt,
      // Referred users are other people — never expose full contact details.
      name: r.referee.name,
      maskedEmail: r.referee.email
        ? `${r.referee.email.slice(0, 2)}•••@${r.referee.email.split('@')[1] ?? ''}`
        : null,
      earnedPaise: r.commissions
        .filter((c) => c.status !== 'reversed' && c.status !== 'rejected')
        .reduce((s, c) => s + c.commissionPaise, 0),
    })),
  };
}

/** Full chain view for admin: who referred whom, with money attached. */
export async function getReferralChains(opts: { take?: number; skip?: number; flaggedOnly?: boolean } = {}) {
  const where: Prisma.ReferralWhereInput = opts.flaggedOnly
    ? { OR: [{ isBlocked: true }, { riskScore: { gte: 45 } }] }
    : {};

  const [rows, total] = await Promise.all([
    db.referral.findMany({
      where,
      orderBy: { signedUpAt: 'desc' },
      take: opts.take ?? 30,
      skip: opts.skip ?? 0,
      include: {
        referrer: { select: { id: true, name: true, email: true, referralCode: true } },
        referee: { select: { id: true, name: true, email: true, createdAt: true } },
        commissions: {
          select: { id: true, commissionPaise: true, status: true, orderId: true, unlockAt: true },
        },
      },
    }),
    db.referral.count({ where }),
  ]);

  return {
    total,
    rows: rows.map((r) => ({
      ...r,
      fraudFlagList: parseJson<FraudFlag[]>(r.fraudFlags, []),
      earnedPaise: r.commissions
        .filter((c) => c.status !== 'reversed')
        .reduce((s, c) => s + c.commissionPaise, 0),
    })),
  };
}

export async function getReferralSummary(userId: string) {
  const dashboard = await getReferralDashboard(userId);
  return {
    totalInvites: dashboard.counts.total,
    convertedInvites: dashboard.counts.converted,
    pendingCommissionPaise: dashboard.earnings.heldPaise,
    unlockedCommissionPaise: dashboard.earnings.unlockedPaise,
    paidCommissionPaise: dashboard.earnings.paidPaise,
    referralCode: dashboard.referralCode,
  };
}

export async function getReferralChain(userId: string, opts: { page?: number; perPage?: number } = {}) {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 10;
  const skip = (page - 1) * perPage;
  const result = await getReferralChains({ take: perPage, skip });
  return {
    rows: result.rows.map((r) => ({
      id: r.id,
      refereeName: r.referee.name,
      refereeEmail: r.referee.email,
      status: r.status,
      createdAt: r.signedUpAt,
      firstOrderId: r.commissions[0]?.orderId ?? null,
      firstOrderTotalPaise: r.commissions[0] ? r.commissions.reduce((s, c) => s + c.commissionPaise, 0) : 0,
      commissionPaise: r.earnedPaise,
    })),
    page,
    pages: Math.max(1, Math.ceil(result.total / perPage)),
    total: result.total,
  };
}

export async function getReferralCommissions(userId: string, opts: { page?: number; perPage?: number } = {}) {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const commissions = await db.referralCommission.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: 'desc' },
    take: perPage,
    skip,
    include: { order: { select: { orderNo: true } } },
  });

  // Fetch referee names separately since there's no direct relation
  const refereeIds = [...new Set(commissions.map((c) => c.refereeId).filter(Boolean))];
  const referees = await db.user.findMany({
    where: { id: { in: refereeIds } },
    select: { id: true, name: true },
  });
  const refereeMap = new Map(referees.map((u) => [u.id, u.name]));

  const total = await db.referralCommission.count({ where: { referrerId: userId } });

  return {
    rows: commissions.map((r) => ({
      id: r.id,
      refereeName: r.refereeId ? refereeMap.get(r.refereeId) ?? null : null,
      orderId: r.orderId ?? '',
      orderNo: r.order?.orderNo ?? '',
      amountPaise: r.commissionPaise,
      status: r.status,
      createdAt: r.createdAt,
    })),
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
    total,
  };
}
