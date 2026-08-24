import 'server-only';

import { db } from '../db';
import { AppError } from '../api';
import { payoutGateway, GatewayError } from '../gateways';
import type { PayoutDestination, PayoutMode, PayoutSnapshot } from '../gateways';
import { withdrawalNo } from '../ids';
import { maskAccount } from '../utils';
import { getSettings } from './settings';
import {
  debit,
  getOrCreateWallet,
  lockForWithdrawal,
  maturePendingCredits,
  releaseLock,
} from './wallet';
import { notify, templates } from './notify';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  PAYOUTS — money out
 * ════════════════════════════════════════════════════════════════════════
 *  request → (auto-approve | admin approval) → payout → processed
 *                     ↘ reject                      ↘ failed → retry
 *
 *  The money is moved between wallet buckets at each step, and the buckets are
 *  what make this safe:
 *
 *    request   spendable → locked   (so it can't also be spent at checkout)
 *    payout    locked → debited     (only once the provider accepted it)
 *    reject    locked → spendable
 *    failure   locked → spendable   (or re-credited if already debited)
 *
 *  A withdrawal is never allowed against an unverified bank account. That gate
 *  lives here rather than in the UI, because the UI is not a security boundary.
 */

// ── Request ───────────────────────────────────────────────────────────

export type WithdrawalResult = {
  requestId: string;
  requestNo: string;
  status: string;
  amountPaise: number;
  autoApproved: boolean;
  message: string;
};

export async function requestWithdrawal(input: {
  userId: string;
  amountPaise: number;
  bankAccountId: string;
}): Promise<WithdrawalResult> {
  const settings = await getSettings();

  if (!Number.isInteger(input.amountPaise) || input.amountPaise <= 0) {
    throw new AppError('Enter a valid withdrawal amount.');
  }
  if (input.amountPaise < settings.payoutMinPaise) {
    throw new AppError(
      `The minimum withdrawal is ₹${(settings.payoutMinPaise / 100).toLocaleString('en-IN')}.`,
      400,
    );
  }

  const account = await db.bankAccount.findFirst({
    where: { id: input.bankAccountId, userId: input.userId, deletedAt: null },
  });
  if (!account) throw new AppError('That payout destination was not found.', 404);

  // The verification gate. `payoutRequiresVerifiedBank` can be turned off for a
  // demo, but it defaults on and this is the only place it's honoured.
  if (settings.payoutRequiresVerifiedBank && account.verificationStatus !== 'verified') {
    throw new AppError(
      account.verificationStatus === 'pending'
        ? 'This account is still being verified. Withdrawals unlock once verification completes.'
        : 'Verify this account before withdrawing. We send a ₹1 test credit to confirm the name on it.',
      409,
    );
  }

  // Held commission that has come of age counts toward the withdrawable
  // balance, so mature it before reading the wallet.
  await maturePendingCredits(input.userId);
  const wallet = await getOrCreateWallet(input.userId);

  if (wallet.balancePaise < input.amountPaise) {
    throw new AppError(
      `Your withdrawable balance is ₹${(wallet.balancePaise / 100).toLocaleString('en-IN')}.`,
      409,
    );
  }

  // Daily cap, counted on requests rather than completions — otherwise the cap
  // is trivially bypassed by queuing many requests before any settles.
  const since = new Date(Date.now() - 24 * 3_600_000);
  const today = await db.withdrawalRequest.aggregate({
    where: {
      userId: input.userId,
      createdAt: { gte: since },
      status: { notIn: ['rejected', 'cancelled', 'failed'] },
    },
    _sum: { amountPaise: true },
  });
  const usedToday = today._sum.amountPaise ?? 0;
  if (usedToday + input.amountPaise > settings.payoutMaxPerDayPaise) {
    throw new AppError(
      `That would exceed the daily withdrawal limit of ₹${(
        settings.payoutMaxPerDayPaise / 100
      ).toLocaleString('en-IN')}. You have already requested ₹${(usedToday / 100).toLocaleString(
        'en-IN',
      )} today.`,
      409,
    );
  }

  const autoApprove = input.amountPaise <= settings.payoutAutoApproveBelowPaise;

  const request = await db.$transaction(async (tx) => {
    await lockForWithdrawal(input.userId, input.amountPaise, tx);

    return tx.withdrawalRequest.create({
      data: {
        userId: input.userId,
        requestNo: withdrawalNo(),
        amountPaise: input.amountPaise,
        destinationType: account.destinationType,
        bankAccountId: account.id,
        destinationSnapshot: JSON.stringify(destinationSnapshot(account)),
        status: autoApprove ? 'approved' : 'requested',
        isAutoApproved: autoApprove,
        approvedAt: autoApprove ? new Date() : null,
      },
    });
  });

  await notify({
    userId: input.userId,
    ...templates.withdrawalRequested({
      requestNo: request.requestNo,
      amountPaise: input.amountPaise,
    }),
    channels: ['email', 'push'],
  });

  if (autoApprove) {
    // Kicked off immediately but not awaited into the caller's error path — a
    // provider hiccup must not make the request itself look like it failed.
    await executePayout(request.id).catch((err) => {
      console.error(`[payouts] auto payout failed for ${request.requestNo}:`, err);
    });
  }

  return {
    requestId: request.id,
    requestNo: request.requestNo,
    status: request.status,
    amountPaise: request.amountPaise,
    autoApproved: autoApprove,
    message: autoApprove
      ? 'Approved automatically and sent to your bank. It usually lands within a few minutes.'
      : 'Your request is in the approval queue and is usually reviewed within one working day.',
  };
}

function destinationSnapshot(account: {
  destinationType: string;
  accountHolder: string;
  last4: string | null;
  ifsc: string | null;
  bankName: string | null;
  vpa: string | null;
}) {
  return account.destinationType === 'vpa'
    ? { type: 'vpa', accountHolder: account.accountHolder, vpa: account.vpa }
    : {
        type: 'bank',
        accountHolder: account.accountHolder,
        accountMasked: maskAccount(account.last4),
        ifsc: account.ifsc,
        bankName: account.bankName,
      };
}

/** Customer-side cancel, only while nothing has been sent to the provider. */
export async function cancelWithdrawal(requestId: string, userId: string) {
  const request = await db.withdrawalRequest.findFirst({ where: { id: requestId, userId } });
  if (!request) throw new AppError('Withdrawal request not found.', 404);
  if (!['requested', 'approved'].includes(request.status)) {
    throw new AppError('This withdrawal is already being processed and cannot be cancelled.', 409);
  }
  const started = await db.payout.count({ where: { withdrawalRequestId: requestId } });
  if (started > 0) {
    throw new AppError('This withdrawal has already been sent to the bank.', 409);
  }

  await db.$transaction(async (tx) => {
    await releaseLock(userId, request.amountPaise, tx);
    await tx.withdrawalRequest.update({
      where: { id: requestId },
      data: { status: 'cancelled' },
    });
  });

  return { cancelled: true };
}

// ── Approval queue ────────────────────────────────────────────────────

export async function approveWithdrawal(input: {
  requestId: string;
  adminId: string;
  note?: string | null;
}) {
  const request = await db.withdrawalRequest.findUnique({ where: { id: input.requestId } });
  if (!request) throw new AppError('Withdrawal request not found.', 404);
  if (request.status !== 'requested') {
    throw new AppError(`This request is already ${request.status}.`, 409);
  }

  await db.withdrawalRequest.update({
    where: { id: input.requestId },
    data: {
      status: 'approved',
      approvedById: input.adminId,
      approvedAt: new Date(),
      adminNote: input.note ?? null,
    },
  });

  return executePayout(input.requestId);
}

/** Rejection returns the locked money to spendable balance. */
export async function rejectWithdrawal(input: {
  requestId: string;
  adminId: string;
  reason: string;
}) {
  if (!input.reason.trim()) throw new AppError('A rejection reason is required.');

  const request = await db.withdrawalRequest.findUnique({ where: { id: input.requestId } });
  if (!request) throw new AppError('Withdrawal request not found.', 404);
  if (!['requested', 'approved'].includes(request.status)) {
    throw new AppError(`This request is already ${request.status}.`, 409);
  }

  await db.$transaction(async (tx) => {
    await releaseLock(request.userId, request.amountPaise, tx);
    await tx.withdrawalRequest.update({
      where: { id: input.requestId },
      data: {
        status: 'rejected',
        approvedById: input.adminId,
        rejectionReason: input.reason,
        approvedAt: new Date(),
      },
    });
  });

  await notify({
    userId: request.userId,
    ...templates.withdrawalRejected({
      requestNo: request.requestNo,
      amountPaise: request.amountPaise,
      reason: input.reason,
    }),
    channels: ['email', 'push'],
  });

  return { rejected: true };
}

// ── Execution ─────────────────────────────────────────────────────────

/**
 * Sends an approved withdrawal to the payout provider.
 *
 * The Payout row is created *before* the provider call so a lost response
 * leaves a record to reconcile rather than a silent hole. The wallet is debited
 * out of the locked bucket only once the provider has accepted the instruction —
 * before that the money legitimately still belongs to the user.
 */
export async function executePayout(requestId: string): Promise<PayoutSnapshot> {
  const request = await db.withdrawalRequest.findUnique({
    where: { id: requestId },
    include: {
      bankAccount: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!request) throw new AppError('Withdrawal request not found.', 404);
  if (request.status !== 'approved') {
    throw new AppError(`Only approved withdrawals can be paid out (this one is ${request.status}).`, 409);
  }
  if (!request.bankAccount) throw new AppError('This request has no payout destination.', 409);

  const account = request.bankAccount;
  const gw = payoutGateway();

  const destination: PayoutDestination =
    account.destinationType === 'vpa'
      ? { type: 'vpa', accountHolder: account.accountHolder, vpa: account.vpa ?? '' }
      : {
          type: 'bank',
          accountHolder: account.accountHolder,
          accountNumber: account.accountNumber ?? '',
          ifsc: account.ifsc ?? '',
        };

  if (destination.type === 'bank' && (!destination.accountNumber || !destination.ifsc)) {
    throw new AppError('The stored bank details are incomplete. Re-add the account.', 409);
  }
  if (destination.type === 'vpa' && !destination.vpa) {
    throw new AppError('The stored UPI ID is missing. Re-add the destination.', 409);
  }

  // Don't queue payouts the provider can't fund — a rejected batch is worse
  // than a withdrawal that stays queued with an honest explanation.
  const balance = await gw.fetchBalancePaise().catch(() => null);
  if (balance !== null && balance < request.amountPaise) {
    await db.withdrawalRequest.update({
      where: { id: requestId },
      data: { adminNote: 'Held — payout account balance is insufficient.' },
    });
    throw new AppError(
      'Payouts are temporarily paused while the disbursement account is topped up. Your request stays queued.',
      503,
    );
  }

  const mode: PayoutMode = account.destinationType === 'vpa' ? 'UPI' : 'IMPS';
  const attemptNo = (await db.payout.count({ where: { withdrawalRequestId: requestId } })) + 1;

  const payout = await db.payout.create({
    data: {
      withdrawalRequestId: requestId,
      provider: gw.name === 'razorpay' ? 'razorpayx' : gw.name,
      mode,
      amountPaise: request.amountPaise,
      status: 'created',
      attemptNo,
    },
  });

  await db.withdrawalRequest.update({
    where: { id: requestId },
    data: { status: 'processing' },
  });

  let snapshot: PayoutSnapshot;
  try {
    snapshot = await gw.createPayout({
      destination,
      amountPaise: request.amountPaise,
      mode,
      // The request number is the idempotency key: a retried instruction with
      // the same key must not pay the user twice.
      referenceId: `${request.requestNo}-${attemptNo}`,
      narration: `VOLTAGE payout ${request.requestNo}`,
      contact: {
        name: request.user.name ?? account.accountHolder,
        email: request.user.email,
        phone: request.user.phone,
        userId: request.userId,
      },
      contactId: account.providerContactId,
      fundAccountId: account.providerFundAccountId,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'The payout provider rejected the request.';
    await markPayoutFailed(payout.id, reason);
    throw err instanceof GatewayError
      ? new AppError(`Payout could not be sent: ${err.message}`, 502)
      : new AppError('Payout could not be sent. It has been returned to your wallet.', 502);
  }

  await db.payout.update({
    where: { id: payout.id },
    data: {
      providerPayoutId: snapshot.providerPayoutId,
      status: snapshot.status,
      feePaise: snapshot.feePaise,
      taxPaise: snapshot.taxPaise,
      utr: snapshot.utr,
      rawResponse: JSON.stringify(snapshot.raw ?? {}),
      processedAt: snapshot.status === 'processed' ? new Date() : null,
    },
  });

  // Cache the provider ids so the next payout reuses the validated destination.
  if (snapshot.providerContactId || snapshot.providerFundAccountId) {
    await db.bankAccount.update({
      where: { id: account.id },
      data: {
        providerContactId: snapshot.providerContactId ?? account.providerContactId,
        providerFundAccountId: snapshot.providerFundAccountId ?? account.providerFundAccountId,
      },
    });
  }

  if (snapshot.status === 'processed') {
    await settlePayout(payout.id, snapshot.utr);
  } else if (snapshot.status === 'failed' || snapshot.status === 'reversed') {
    await markPayoutFailed(payout.id, snapshot.failureReason ?? 'The bank returned the transfer.');
  }

  return snapshot;
}

/**
 * Terminal success. The locked money is debited for real here — this is the
 * point at which it has actually left our books.
 */
async function settlePayout(payoutId: string, utr: string | null) {
  const payout = await db.payout.findUnique({
    where: { id: payoutId },
    include: { withdrawalRequest: true },
  });
  if (!payout) return;
  const request = payout.withdrawalRequest;
  if (request.status === 'completed') return; // already settled

  await db.$transaction(async (tx) => {
    const txn = await debit(
      {
        userId: request.userId,
        type: 'withdrawal',
        amountPaise: request.amountPaise,
        description: `Withdrawal ${request.requestNo} paid to bank`,
        referenceType: 'withdrawal',
        referenceId: request.id,
        fromLocked: true,
      },
      tx,
    );

    await tx.payout.update({
      where: { id: payoutId },
      data: { status: 'processed', utr, processedAt: new Date() },
    });

    await tx.withdrawalRequest.update({
      where: { id: request.id },
      data: { status: 'completed', walletTxnId: txn.id },
    });
  });

  await notify({
    userId: request.userId,
    ...templates.withdrawalPaid({
      requestNo: request.requestNo,
      amountPaise: request.amountPaise,
      utr,
    }),
    channels: ['email', 'sms', 'push'],
  });
}

/**
 * Terminal failure. The money goes back where the user can see and use it.
 *
 * Two cases: the common one is a payout that never settled, so the locked
 * amount is simply released. If the payout had already been debited and was
 * later reversed by the bank, the amount is re-credited instead — releasing a
 * lock that no longer exists would quietly lose the money.
 */
async function markPayoutFailed(payoutId: string, reason: string) {
  const payout = await db.payout.findUnique({
    where: { id: payoutId },
    include: { withdrawalRequest: true },
  });
  if (!payout) return;
  const request = payout.withdrawalRequest;

  await db.$transaction(async (tx) => {
    await tx.payout.update({
      where: { id: payoutId },
      data: { status: 'failed', failureReason: reason },
    });

    if (request.walletTxnId) {
      // Already debited — reverse it as a fresh credit.
      const { credit } = await import('./wallet');
      await credit(
        {
          userId: request.userId,
          type: 'reversal',
          amountPaise: request.amountPaise,
          description: `Withdrawal ${request.requestNo} was reversed by the bank`,
          referenceType: 'withdrawal',
          referenceId: request.id,
        },
        tx,
      );
    } else {
      await releaseLock(request.userId, request.amountPaise, tx);
    }

    await tx.withdrawalRequest.update({
      where: { id: request.id },
      data: { status: 'failed', rejectionReason: reason },
    });
  });

  await notify({
    userId: request.userId,
    ...templates.withdrawalRejected({
      requestNo: request.requestNo,
      amountPaise: request.amountPaise,
      reason,
    }),
    channels: ['email', 'push'],
  });
}

/**
 * Admin retry of a failed payout. The failed request is re-approved and sent
 * again, which also re-locks the money that the failure released.
 */
export async function retryPayout(input: { requestId: string; adminId: string }) {
  const request = await db.withdrawalRequest.findUnique({ where: { id: input.requestId } });
  if (!request) throw new AppError('Withdrawal request not found.', 404);
  if (request.status !== 'failed') {
    throw new AppError(`Only failed withdrawals can be retried (this one is ${request.status}).`, 409);
  }

  await db.$transaction(async (tx) => {
    // Re-lock, because the failure handler put the money back as spendable.
    await lockForWithdrawal(request.userId, request.amountPaise, tx);
    await tx.withdrawalRequest.update({
      where: { id: request.id },
      data: {
        status: 'approved',
        approvedById: input.adminId,
        approvedAt: new Date(),
        rejectionReason: null,
        walletTxnId: null,
        adminNote: `Retry of a failed payout (attempt ${
          (await tx.payout.count({ where: { withdrawalRequestId: request.id } })) + 1
        })`,
      },
    });
  });

  return executePayout(request.id);
}

/** Manual override: mark paid outside the system (a treasury transfer by hand). */
export async function manualSettle(input: {
  requestId: string;
  adminId: string;
  utr: string;
  note?: string | null;
}) {
  const request = await db.withdrawalRequest.findUnique({
    where: { id: input.requestId },
    include: { payouts: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!request) throw new AppError('Withdrawal request not found.', 404);
  if (request.status === 'completed') throw new AppError('Already settled.', 409);
  if (!['approved', 'processing', 'failed'].includes(request.status)) {
    throw new AppError(`Cannot settle a ${request.status} request.`, 409);
  }

  // A failed payout released the lock; re-take it before debiting.
  if (request.status === 'failed') {
    await db.$transaction(async (tx) => {
      await lockForWithdrawal(request.userId, request.amountPaise, tx);
      await tx.withdrawalRequest.update({
        where: { id: request.id },
        data: { walletTxnId: null },
      });
    });
  }

  const payout =
    request.payouts[0] ??
    (await db.payout.create({
      data: {
        withdrawalRequestId: request.id,
        provider: 'manual',
        mode: request.destinationType === 'vpa' ? 'UPI' : 'NEFT',
        amountPaise: request.amountPaise,
        status: 'created',
      },
    }));

  await db.withdrawalRequest.update({
    where: { id: request.id },
    data: {
      adminNote: input.note ?? 'Settled manually by an administrator.',
      approvedById: input.adminId,
    },
  });

  await settlePayout(payout.id, input.utr);
  return { settled: true };
}

// ── Reconciliation ────────────────────────────────────────────────────

/** Webhook bridge — called by `payments.handlePaymentWebhook`. */
export async function handlePayoutWebhookEvent(
  eventType: string,
  providerPayoutId: string,
): Promise<void> {
  const payout = await db.payout.findFirst({ where: { providerPayoutId } });
  if (!payout) return;

  // The event only tells us *something* changed; the provider is asked for the
  // authoritative state rather than trusting the event body.
  let snapshot: PayoutSnapshot | null = null;
  try {
    snapshot = await payoutGateway().fetchPayout(providerPayoutId);
  } catch {
    snapshot = null;
  }

  const status = snapshot?.status ?? (eventType === 'payout.processed' ? 'processed' : 'failed');

  if (status === 'processed') {
    await settlePayout(payout.id, snapshot?.utr ?? null);
    return;
  }
  if (status === 'failed' || status === 'reversed') {
    await markPayoutFailed(
      payout.id,
      snapshot?.failureReason ??
        (eventType === 'payout.reversed'
          ? 'The bank reversed the transfer.'
          : 'The bank rejected the transfer.'),
    );
    return;
  }

  await db.payout.update({
    where: { id: payout.id },
    data: { status, utr: snapshot?.utr ?? payout.utr },
  });
}

/** Polls in-flight payouts. Safe to run repeatedly; idempotent per payout. */
export async function syncPendingPayouts(): Promise<{ checked: number; settled: number }> {
  const inFlight = await db.payout.findMany({
    where: {
      status: { in: ['created', 'queued', 'processing'] },
      providerPayoutId: { not: null },
    },
    take: 50,
    select: { id: true, providerPayoutId: true },
  });

  let settled = 0;
  for (const row of inFlight) {
    try {
      const snapshot = await payoutGateway().fetchPayout(row.providerPayoutId!);
      if (snapshot.status === 'processed') {
        await settlePayout(row.id, snapshot.utr);
        settled += 1;
      } else if (snapshot.status === 'failed' || snapshot.status === 'reversed') {
        await markPayoutFailed(row.id, snapshot.failureReason ?? 'The transfer did not complete.');
      } else {
        await db.payout.update({
          where: { id: row.id },
          data: { status: snapshot.status, utr: snapshot.utr },
        });
      }
    } catch (err) {
      console.error(`[payouts] sync failed for payout ${row.id}:`, err);
    }
  }

  return { checked: inFlight.length, settled };
}

// ── Reads ─────────────────────────────────────────────────────────────

export async function getWithdrawal(requestId: string, userId?: string | null) {
  const request = await db.withdrawalRequest.findFirst({
    where: { id: requestId, ...(userId ? { userId } : {}) },
    include: {
      payouts: { orderBy: { createdAt: 'desc' } },
      bankAccount: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
      approvedBy: { select: { name: true } },
    },
  });
  if (!request) throw new AppError('Withdrawal request not found.', 404);
  return request;
}

export async function listUserWithdrawals(userId: string, take = 20) {
  return db.withdrawalRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
    include: { payouts: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
}

/** Admin Wallet & Payouts queue. Defaults to what needs a decision. */
export async function listWithdrawals(
  opts: { status?: string; take?: number; skip?: number; query?: string } = {},
) {
  const where = {
    ...(opts.status && opts.status !== 'all' ? { status: opts.status } : {}),
    ...(opts.query
      ? {
          OR: [
            { requestNo: { contains: opts.query } },
            { user: { name: { contains: opts.query } } },
            { user: { email: { contains: opts.query } } },
          ],
        }
      : {}),
  };

  const [rows, total, pendingCount] = await Promise.all([
    db.withdrawalRequest.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: opts.take ?? 25,
      skip: opts.skip ?? 0,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        bankAccount: {
          select: {
            destinationType: true,
            accountHolder: true,
            last4: true,
            bankName: true,
            vpa: true,
            verificationStatus: true,
            nameMatchScore: true,
          },
        },
        payouts: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    db.withdrawalRequest.count({ where }),
    db.withdrawalRequest.count({ where: { status: 'requested' } }),
  ]);

  return { rows, total, pendingCount };
}

/** Headline numbers for the admin payouts screen. */
export async function payoutSummary() {
  const [queued, processing, completed, failed, wallets] = await Promise.all([
    db.withdrawalRequest.aggregate({
      where: { status: 'requested' },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
    db.withdrawalRequest.aggregate({
      where: { status: { in: ['approved', 'processing'] } },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
    db.withdrawalRequest.aggregate({
      where: { status: 'completed' },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
    db.withdrawalRequest.aggregate({
      where: { status: 'failed' },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
    db.wallet.aggregate({
      _sum: { balancePaise: true, pendingPaise: true, lockedPaise: true },
    }),
  ]);

  const providerBalance = await payoutGateway()
    .fetchBalancePaise()
    .catch(() => null);

  return {
    queued: { count: queued._count._all, valuePaise: queued._sum.amountPaise ?? 0 },
    processing: { count: processing._count._all, valuePaise: processing._sum.amountPaise ?? 0 },
    completed: { count: completed._count._all, valuePaise: completed._sum.amountPaise ?? 0 },
    failed: { count: failed._count._all, valuePaise: failed._sum.amountPaise ?? 0 },
    /** Total customer money we are holding — our real liability. */
    liabilityPaise:
      (wallets._sum.balancePaise ?? 0) +
      (wallets._sum.pendingPaise ?? 0) +
      (wallets._sum.lockedPaise ?? 0),
    spendablePaise: wallets._sum.balancePaise ?? 0,
    heldPaise: wallets._sum.pendingPaise ?? 0,
    lockedPaise: wallets._sum.lockedPaise ?? 0,
    providerBalancePaise: providerBalance,
  };
}

/** Every user's wallet at a glance, for the admin Wallet module. */
export async function listWallets(opts: { take?: number; skip?: number; query?: string } = {}) {
  const where = opts.query
    ? {
        user: {
          OR: [
            { name: { contains: opts.query } },
            { email: { contains: opts.query } },
            { phone: { contains: opts.query } },
          ],
        },
      }
    : {};

  const [rows, total] = await Promise.all([
    db.wallet.findMany({
      where,
      orderBy: { balancePaise: 'desc' },
      take: opts.take ?? 25,
      skip: opts.skip ?? 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            referralCode: true,
            loyaltyTier: true,
          },
        },
      },
    }),
    db.wallet.count({ where }),
  ]);

  return { rows, total };
}
