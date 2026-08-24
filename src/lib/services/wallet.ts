import 'server-only';

import type { Prisma } from '@prisma/client';
import { db } from '../db';
import { AppError } from '../api';
import type { WalletTxnType } from '../enums';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  WALLET LEDGER
 * ════════════════════════════════════════════════════════════════════════
 *  A wallet holds three buckets, and the distinction matters:
 *
 *   balancePaise  spendable at checkout AND withdrawable to a bank
 *   pendingPaise  credited but inside a hold window (referral commission
 *                 waiting out the return period) — not spendable, not
 *                 withdrawable, visible to the user as "pending"
 *   lockedPaise   reserved against an in-flight withdrawal, so the same money
 *                 cannot also be spent at checkout while a payout is queued
 *
 *  Invariant: every mutation writes exactly one WalletTransaction and adjusts
 *  the buckets in the SAME database transaction. `balanceAfterPaise` snapshots
 *  the spendable balance so a statement can be reconstructed without replaying
 *  the whole ledger.
 */

export type LedgerTx = Prisma.TransactionClient;

export async function getOrCreateWallet(userId: string, tx: LedgerTx | typeof db = db) {
  const existing = await tx.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return tx.wallet.create({ data: { userId } });
}

type CreditInput = {
  userId: string;
  type: WalletTxnType;
  amountPaise: number;
  description: string;
  /** `pending` parks the credit in the hold bucket until `availableAt`. */
  status?: 'available' | 'pending';
  availableAt?: Date | null;
  referenceType?: string | null;
  referenceId?: string | null;
  orderId?: string | null;
  createdById?: string | null;
};

/** Adds money. Returns the created transaction. */
export async function credit(input: CreditInput, tx?: LedgerTx) {
  const run = async (t: LedgerTx) => {
    if (input.amountPaise <= 0) throw new AppError('Credit amount must be positive.');

    const wallet = await getOrCreateWallet(input.userId, t);
    const held = input.status === 'pending';

    const updated = await t.wallet.update({
      where: { id: wallet.id },
      data: held
        ? { pendingPaise: { increment: input.amountPaise } }
        : { balancePaise: { increment: input.amountPaise } },
    });

    return t.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: input.type,
        direction: 'credit',
        amountPaise: input.amountPaise,
        balanceAfterPaise: updated.balancePaise,
        status: held ? 'pending' : 'completed',
        availableAt: held ? (input.availableAt ?? null) : null,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        orderId: input.orderId ?? null,
        description: input.description,
        createdById: input.createdById ?? null,
      },
    });
  };

  return tx ? run(tx) : db.$transaction(run);
}

type DebitInput = {
  userId: string;
  type: WalletTxnType;
  amountPaise: number;
  description: string;
  referenceType?: string | null;
  referenceId?: string | null;
  orderId?: string | null;
  createdById?: string | null;
  /** Debit from the locked bucket instead of the spendable one (payout settle). */
  fromLocked?: boolean;
};

/** Removes money. Throws if the relevant bucket can't cover it. */
export async function debit(input: DebitInput, tx?: LedgerTx) {
  const run = async (t: LedgerTx) => {
    if (input.amountPaise <= 0) throw new AppError('Debit amount must be positive.');

    const wallet = await getOrCreateWallet(input.userId, t);
    const bucket = input.fromLocked ? wallet.lockedPaise : wallet.balancePaise;
    if (bucket < input.amountPaise) {
      throw new AppError(
        input.fromLocked
          ? 'Locked wallet balance is insufficient for this settlement.'
          : 'Insufficient wallet balance.',
        409,
      );
    }

    const updated = await t.wallet.update({
      where: { id: wallet.id },
      data: input.fromLocked
        ? { lockedPaise: { decrement: input.amountPaise } }
        : { balancePaise: { decrement: input.amountPaise } },
    });

    return t.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: input.type,
        direction: 'debit',
        amountPaise: input.amountPaise,
        balanceAfterPaise: updated.balancePaise,
        status: 'completed',
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        orderId: input.orderId ?? null,
        description: input.description,
        createdById: input.createdById ?? null,
      },
    });
  };

  return tx ? run(tx) : db.$transaction(run);
}

/**
 * Moves spendable balance into the locked bucket for a withdrawal request.
 * Done at request time, not approval time — otherwise a user could request a
 * payout and then spend the same money at checkout before an admin approves.
 */
export async function lockForWithdrawal(
  userId: string,
  amountPaise: number,
  tx: LedgerTx,
): Promise<void> {
  const wallet = await getOrCreateWallet(userId, tx);
  if (wallet.balancePaise < amountPaise) {
    throw new AppError('Withdrawable balance is insufficient for this request.', 409);
  }
  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balancePaise: { decrement: amountPaise },
      lockedPaise: { increment: amountPaise },
    },
  });
}

/** Returns locked money to the spendable bucket (rejection, failure, cancel). */
export async function releaseLock(
  userId: string,
  amountPaise: number,
  tx: LedgerTx,
): Promise<void> {
  const wallet = await getOrCreateWallet(userId, tx);
  const releasable = Math.min(wallet.lockedPaise, amountPaise);
  if (releasable <= 0) return;
  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      lockedPaise: { decrement: releasable },
      balancePaise: { increment: releasable },
    },
  });
}

/**
 * Matures held credits whose hold window has elapsed: pending → available.
 * Called opportunistically whenever a wallet is read, and by the ops sweep, so
 * the system needs no always-on scheduler to stay correct.
 */
export async function maturePendingCredits(userId?: string): Promise<number> {
  const now = new Date();
  const due = await db.walletTransaction.findMany({
    where: {
      status: 'pending',
      direction: 'credit',
      availableAt: { lte: now },
      ...(userId ? { wallet: { userId } } : {}),
    },
    select: { id: true, walletId: true, amountPaise: true },
    take: 500,
  });
  if (!due.length) return 0;

  await db.$transaction(async (t) => {
    for (const txn of due) {
      const w = await t.wallet.update({
        where: { id: txn.walletId },
        data: {
          pendingPaise: { decrement: txn.amountPaise },
          balancePaise: { increment: txn.amountPaise },
        },
      });
      await t.walletTransaction.update({
        where: { id: txn.id },
        data: { status: 'completed', balanceAfterPaise: w.balancePaise },
      });
      // Keep the commission record in step with the money.
      await t.referralCommission.updateMany({
        where: { walletTxnId: txn.id, status: 'held' },
        data: { status: 'unlocked' },
      });
    }
  });

  return due.length;
}

/**
 * Claws back a credit — used when an order inside the hold window is cancelled
 * or returned. Pulls from the pending bucket first (the usual case), then from
 * spendable if it already matured. Never drives a bucket negative; any shortfall
 * is recorded so finance can chase it.
 */
export async function reverseCredit(
  originalTxnId: string,
  reason: string,
  tx: LedgerTx,
): Promise<{ reversedPaise: number; shortfallPaise: number }> {
  const original = await tx.walletTransaction.findUnique({
    where: { id: originalTxnId },
    include: { wallet: true },
  });
  if (!original || original.direction !== 'credit') {
    throw new AppError('Original credit not found.', 404);
  }
  if (original.status === 'reversed') return { reversedPaise: 0, shortfallPaise: 0 };

  const amount = original.amountPaise;
  const wallet = original.wallet;

  const fromPending = Math.min(wallet.pendingPaise, original.status === 'pending' ? amount : 0);
  const remaining = amount - fromPending;
  const fromBalance = Math.min(wallet.balancePaise, remaining);
  const shortfall = remaining - fromBalance;

  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      pendingPaise: { decrement: fromPending },
      balancePaise: { decrement: fromBalance },
    },
  });

  await tx.walletTransaction.update({
    where: { id: original.id },
    data: { status: 'reversed' },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'reversal',
      direction: 'debit',
      amountPaise: fromPending + fromBalance,
      balanceAfterPaise: updated.balancePaise,
      status: 'completed',
      referenceType: 'wallet_transaction',
      referenceId: original.id,
      description: shortfall > 0 ? `${reason} (partial — ₹${shortfall / 100} unrecovered)` : reason,
    },
  });

  return { reversedPaise: fromPending + fromBalance, shortfallPaise: shortfall };
}

// ── Reads ─────────────────────────────────────────────────────────────

export async function getWalletSummary(userId: string) {
  await maturePendingCredits(userId);
  const wallet = await getOrCreateWallet(userId);

  const grouped = await db.walletTransaction.groupBy({
    by: ['type', 'direction'],
    where: { walletId: wallet.id, status: { in: ['completed', 'pending'] } },
    _sum: { amountPaise: true },
  });

  const byType: Record<string, number> = {};
  for (const g of grouped) {
    const signed = g.direction === 'credit' ? 1 : -1;
    byType[g.type] = (byType[g.type] ?? 0) + signed * (g._sum.amountPaise ?? 0);
  }

  // Calculate lifetime earned/spent from all completed transactions
  const lifetime = await db.walletTransaction.groupBy({
    by: ['direction'],
    where: { walletId: wallet.id, status: 'completed' },
    _sum: { amountPaise: true },
  });

  let lifetimeEarnedPaise = 0;
  let lifetimeSpentPaise = 0;
  for (const g of lifetime) {
    if (g.direction === 'credit') lifetimeEarnedPaise += g._sum.amountPaise ?? 0;
    else lifetimeSpentPaise += g._sum.amountPaise ?? 0;
  }

  return {
    balancePaise: wallet.balancePaise,
    pendingPaise: wallet.pendingPaise,
    lockedPaise: wallet.lockedPaise,
    totalPaise: wallet.balancePaise + wallet.pendingPaise + wallet.lockedPaise,
    byType,
    lifetimeEarnedPaise,
    lifetimeSpentPaise,
  };
}

export async function getLedger(
  userId: string,
  opts: { take?: number; skip?: number; type?: string } = {},
) {
  const wallet = await getOrCreateWallet(userId);
  const where: Prisma.WalletTransactionWhereInput = {
    walletId: wallet.id,
    ...(opts.type ? { type: opts.type } : {}),
  };

  const [rows, total] = await Promise.all([
    db.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.take ?? 25,
      skip: opts.skip ?? 0,
      include: { order: { select: { orderNo: true } } },
    }),
    db.walletTransaction.count({ where }),
  ]);

  return { rows, total };
}

export async function getWalletTransactions(
  userId: string,
  opts: { page?: number; perPage?: number; type?: string } = {},
) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(100, Math.max(1, opts.perPage ?? 20));
  const skip = (page - 1) * perPage;
  const result = await getLedger(userId, { take: perPage, skip, type: opts.type });
  return { rows: result.rows, page, pages: Math.max(1, Math.ceil(result.total / perPage)), total: result.total };
}

export async function getBankAccounts(userId: string) {
  return db.bankAccount.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

/**
 * Recomputes bucket totals from the ledger and reports drift. Exposed in the
 * admin payouts module — a wallet system without a reconciliation check is a
 * wallet system nobody should trust.
 */
export async function auditWallet(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  const txns = await db.walletTransaction.findMany({
    where: { walletId: wallet.id },
    select: { direction: true, amountPaise: true, status: true },
  });

  let expectedBalance = 0;
  let expectedPending = 0;
  for (const t of txns) {
    const sign = t.direction === 'credit' ? 1 : -1;
    if (t.status === 'pending') expectedPending += sign * t.amountPaise;
    else if (t.status === 'completed') expectedBalance += sign * t.amountPaise;
  }
  // Locked money has left `balancePaise` but no debit exists for it yet.
  expectedBalance -= wallet.lockedPaise;

  return {
    balancePaise: wallet.balancePaise,
    pendingPaise: wallet.pendingPaise,
    lockedPaise: wallet.lockedPaise,
    expectedBalancePaise: expectedBalance,
    expectedPendingPaise: expectedPending,
    balanceDriftPaise: wallet.balancePaise - expectedBalance,
    pendingDriftPaise: wallet.pendingPaise - expectedPending,
    isBalanced: wallet.balancePaise === expectedBalance && wallet.pendingPaise === expectedPending,
    transactionCount: txns.length,
  };
}
