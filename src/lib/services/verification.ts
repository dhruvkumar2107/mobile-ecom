import 'server-only';

import { db } from '../db';
import { AppError } from '../api';
import {
  GatewayError,
  NAME_MATCH_PASS,
  NAME_MATCH_REVIEW,
  nameMatchScore,
  nameMatchVerdict,
  verificationGateway,
} from '../gateways';
import type { IfscDetails, VerificationSnapshot } from '../gateways';
import { isValidIfsc, isValidVpa, maskAccount } from '../utils';
import { notify, templates } from './notify';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  BANK ACCOUNT VERIFICATION (penny drop)
 * ════════════════════════════════════════════════════════════════════════
 *  unverified → pending → verified | failed
 *
 *  This is a genuine asynchronous state machine, not a UI flourish. A ₹1 credit
 *  is pushed to the beneficiary; the bank returns the name it holds on that
 *  account; that name is scored against what the user typed. Withdrawals stay
 *  disabled until the score clears the threshold.
 *
 *  Three outcomes matter:
 *
 *    pass   (≥ 0.80)  verified, withdrawals enabled
 *    review (≥ 0.60)  a human decides — close enough to be a nickname or an
 *                     initial, not close enough to auto-approve
 *    fail   (< 0.60)  rejected; the account most likely belongs to someone else
 *
 *  Every call is logged to BankVerificationLog whatever the outcome, because
 *  "we sent ₹1 and this is what came back" is exactly the evidence needed when
 *  a customer disputes a failed verification.
 */

const MAX_ATTEMPTS = 5;

// ── Adding a destination ──────────────────────────────────────────────

export type AddBankInput = {
  userId: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  makeDefault?: boolean;
};

/**
 * Stores a bank account. The full number is kept because a payout needs it, but
 * everything user-facing reads `last4` — no screen and no API response ever
 * echoes the whole number back.
 */
export async function addBankAccount(input: AddBankInput) {
  const holder = input.accountHolder.trim();
  const accountNumber = input.accountNumber.replace(/\s/g, '');
  const ifsc = input.ifsc.trim().toUpperCase();

  if (holder.length < 3) throw new AppError('Enter the account holder’s full name.');
  if (!/^\d{9,18}$/.test(accountNumber)) {
    throw new AppError('Enter a valid account number (9–18 digits).');
  }
  if (!isValidIfsc(ifsc)) throw new AppError('That IFSC code does not look right.');

  // IFSC is checked against the directory before anything is stored — a typo
  // caught here costs nothing, while a typo caught at payout time costs a
  // failed transfer and a support ticket.
  const branch = await lookupIfsc(ifsc);
  if (!branch) {
    throw new AppError('We could not find that IFSC code. Check it against your passbook.', 400);
  }

  const existing = await db.bankAccount.findFirst({
    where: { userId: input.userId, accountNumber, ifsc, deletedAt: null },
  });
  if (existing) {
    throw new AppError('That account is already saved to your profile.', 409);
  }

  const isFirst = (await db.bankAccount.count({ where: { userId: input.userId, deletedAt: null } })) === 0;

  const account = await db.bankAccount.create({
    data: {
      userId: input.userId,
      destinationType: 'bank',
      accountHolder: holder,
      accountNumber,
      last4: accountNumber.slice(-4),
      ifsc,
      bankName: branch.bank,
      branch: branch.branch,
      verificationStatus: 'unverified',
      isDefault: isFirst || Boolean(input.makeDefault),
    },
  });

  if (input.makeDefault && !isFirst) await setDefaultDestination(account.id, input.userId);

  return publicAccount(account);
}

export async function addUpiDestination(input: {
  userId: string;
  accountHolder: string;
  vpa: string;
  makeDefault?: boolean;
}) {
  const vpa = input.vpa.trim().toLowerCase();
  const holder = input.accountHolder.trim();

  if (!isValidVpa(vpa)) throw new AppError('That UPI ID does not look right.');
  if (holder.length < 3) throw new AppError('Enter the account holder’s full name.');

  const existing = await db.bankAccount.findFirst({
    where: { userId: input.userId, vpa, deletedAt: null },
  });
  if (existing) throw new AppError('That UPI ID is already saved.', 409);

  const isFirst = (await db.bankAccount.count({ where: { userId: input.userId, deletedAt: null } })) === 0;

  const account = await db.bankAccount.create({
    data: {
      userId: input.userId,
      destinationType: 'vpa',
      accountHolder: holder,
      vpa,
      verificationStatus: 'unverified',
      isDefault: isFirst || Boolean(input.makeDefault),
    },
  });

  if (input.makeDefault && !isFirst) await setDefaultDestination(account.id, input.userId);

  return publicAccount(account);
}

// ── Verification ──────────────────────────────────────────────────────

export type VerifyResult = {
  bankAccountId: string;
  status: 'pending' | 'verified' | 'failed';
  verdict: 'pass' | 'review' | 'fail' | 'pending';
  registeredName: string | null;
  nameMatchScore: number | null;
  message: string;
  /** True only when withdrawals are now actually possible. */
  withdrawalsEnabled: boolean;
};

/**
 * Starts verification. Returns `pending` when the provider hasn't answered yet —
 * the caller polls `pollVerification`, which is what makes this a real flow
 * rather than a fake instant tick.
 */
export async function startVerification(
  bankAccountId: string,
  userId: string,
): Promise<VerifyResult> {
  const account = await db.bankAccount.findFirst({
    where: { id: bankAccountId, userId, deletedAt: null },
    include: { user: { select: { email: true, phone: true } } },
  });
  if (!account) throw new AppError('Payout destination not found.', 404);

  if (account.verificationStatus === 'verified') {
    return {
      bankAccountId,
      status: 'verified',
      verdict: 'pass',
      registeredName: account.registeredName,
      nameMatchScore: account.nameMatchScore,
      message: 'This account is already verified.',
      withdrawalsEnabled: true,
    };
  }
  if (account.verificationStatus === 'pending' && account.pendingVerificationRef) {
    return pollVerification(bankAccountId, userId);
  }
  if (account.attempts >= MAX_ATTEMPTS) {
    throw new AppError(
      'This account has failed verification too many times. Remove it and add the correct details, or contact support.',
      429,
    );
  }

  const gw = verificationGateway();
  const attemptNo = account.attempts + 1;

  let snapshot: VerificationSnapshot;
  try {
    snapshot =
      account.destinationType === 'vpa'
        ? await gw.validateVpa({
            accountHolder: account.accountHolder,
            vpa: account.vpa ?? '',
            userId,
            email: account.user.email,
            phone: account.user.phone,
            contactId: account.providerContactId,
          })
        : await gw.startPennyDrop({
            accountHolder: account.accountHolder,
            accountNumber: account.accountNumber ?? '',
            ifsc: account.ifsc ?? '',
            userId,
            email: account.user.email,
            phone: account.user.phone,
            contactId: account.providerContactId,
          });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The verification provider is unavailable.';
    await db.$transaction(async (tx) => {
      await tx.bankVerificationLog.create({
        data: {
          bankAccountId,
          provider: providerLabel(gw.name),
          requestType: account.destinationType === 'vpa' ? 'vpa_validate' : 'penny_drop',
          status: 'failed',
          message,
          attemptNo,
          completedAt: new Date(),
        },
      });
      // The attempt counter deliberately does NOT move for a provider outage.
      // Burning a customer's retries because our vendor was down is unfair.
      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { failureReason: message },
      });
    });
    throw err instanceof GatewayError
      ? new AppError(`Verification could not be started: ${err.message}`, 502)
      : new AppError('Verification could not be started right now. Please try again shortly.', 502);
  }

  await db.$transaction(async (tx) => {
    await tx.bankVerificationLog.create({
      data: {
        bankAccountId,
        provider: providerLabel(gw.name),
        providerRefId: snapshot.providerRefId,
        requestType: account.destinationType === 'vpa' ? 'vpa_validate' : 'penny_drop',
        status: snapshot.status,
        amountPaise: snapshot.amountPaise,
        registeredName: snapshot.registeredName,
        nameMatchScore: snapshot.nameMatchScore,
        responseCode: snapshot.responseCode,
        message: snapshot.message,
        rawResponse: JSON.stringify(snapshot.raw ?? {}),
        attemptNo,
        completedAt: snapshot.status === 'completed' || snapshot.status === 'failed' ? new Date() : null,
      },
    });

    await tx.bankAccount.update({
      where: { id: bankAccountId },
      data: {
        verificationStatus: 'pending',
        pendingVerificationRef: snapshot.providerRefId,
        attempts: attemptNo,
        failureReason: null,
        providerContactId: snapshot.providerContactId ?? account.providerContactId,
        providerFundAccountId: snapshot.providerFundAccountId ?? account.providerFundAccountId,
      },
    });
  });

  // Some providers answer synchronously. If this one did, settle it now.
  if (snapshot.status === 'completed' || snapshot.status === 'failed') {
    return applySnapshot(bankAccountId, account.accountHolder, snapshot, attemptNo);
  }

  return {
    bankAccountId,
    status: 'pending',
    verdict: 'pending',
    registeredName: null,
    nameMatchScore: null,
    message:
      account.destinationType === 'vpa'
        ? 'Validating your UPI ID with the payment network. This takes a few seconds.'
        : 'We have sent ₹1 to this account to confirm the name on it. This usually takes under a minute.',
    withdrawalsEnabled: false,
  };
}

/** Polls an in-flight verification. Safe to call on a timer from the client. */
export async function pollVerification(
  bankAccountId: string,
  userId: string,
): Promise<VerifyResult> {
  const account = await db.bankAccount.findFirst({
    where: { id: bankAccountId, userId, deletedAt: null },
  });
  if (!account) throw new AppError('Payout destination not found.', 404);

  if (account.verificationStatus === 'verified') {
    return {
      bankAccountId,
      status: 'verified',
      verdict: 'pass',
      registeredName: account.registeredName,
      nameMatchScore: account.nameMatchScore,
      message: 'Verified. Withdrawals are enabled for this account.',
      withdrawalsEnabled: true,
    };
  }
  if (!account.pendingVerificationRef) {
    return {
      bankAccountId,
      status: account.verificationStatus === 'failed' ? 'failed' : 'pending',
      verdict: account.verificationStatus === 'failed' ? 'fail' : 'pending',
      registeredName: account.registeredName,
      nameMatchScore: account.nameMatchScore,
      message: account.failureReason ?? 'Verification has not been started for this account yet.',
      withdrawalsEnabled: false,
    };
  }

  let snapshot: VerificationSnapshot;
  try {
    snapshot = await verificationGateway().fetchVerification(
      account.pendingVerificationRef,
      account.accountHolder,
    );
  } catch (err) {
    return {
      bankAccountId,
      status: 'pending',
      verdict: 'pending',
      registeredName: null,
      nameMatchScore: null,
      message: 'Still waiting on the bank. We will keep checking.',
      withdrawalsEnabled: false,
    };
  }

  if (snapshot.status === 'created' || snapshot.status === 'pending') {
    return {
      bankAccountId,
      status: 'pending',
      verdict: 'pending',
      registeredName: null,
      nameMatchScore: null,
      message: 'The bank has not responded yet. This can take up to a minute.',
      withdrawalsEnabled: false,
    };
  }

  return applySnapshot(bankAccountId, account.accountHolder, snapshot, account.attempts);
}

/**
 * Turns a terminal provider snapshot into account state.
 *
 * The score is recomputed locally rather than taken on faith from the provider,
 * so the threshold that gates withdrawals is one we control and can audit.
 */
async function applySnapshot(
  bankAccountId: string,
  submittedName: string,
  snapshot: VerificationSnapshot,
  attemptNo: number,
): Promise<VerifyResult> {
  const score =
    snapshot.registeredName !== null
      ? recomputeScore(submittedName, snapshot.registeredName, snapshot.nameMatchScore)
      : snapshot.nameMatchScore;

  const verdict = snapshot.status === 'failed' ? 'fail' : nameMatchVerdict(score);
  const accountInvalid = snapshot.accountStatus === 'invalid';

  const passed = verdict === 'pass' && !accountInvalid && snapshot.status === 'completed';
  const status: 'verified' | 'failed' | 'pending' = passed
    ? 'verified'
    : verdict === 'review' && !accountInvalid
      ? 'pending'
      : 'failed';

  const message = passed
    ? 'Verified. Withdrawals are enabled for this account.'
    : accountInvalid
      ? 'The bank reported this account as invalid or closed.'
      : verdict === 'review'
        ? `The name on the account reads “${snapshot.registeredName}”, which is close but not an exact match. Our team will review this within a working day.`
        : snapshot.registeredName
          ? `The name on this account is “${snapshot.registeredName}”, which does not match “${submittedName}”. You can only withdraw to an account in your own name.`
          : (snapshot.message ?? 'Verification failed. Check the details and try again.');

  const account = await db.$transaction(async (tx) => {
    const log = await tx.bankVerificationLog.findFirst({
      where: { bankAccountId, providerRefId: snapshot.providerRefId },
      orderBy: { createdAt: 'desc' },
    });

    if (log) {
      await tx.bankVerificationLog.update({
        where: { id: log.id },
        data: {
          status: snapshot.status,
          registeredName: snapshot.registeredName,
          nameMatchScore: score,
          responseCode: snapshot.responseCode,
          message: snapshot.message,
          rawResponse: JSON.stringify(snapshot.raw ?? {}),
          completedAt: new Date(),
        },
      });
    } else {
      await tx.bankVerificationLog.create({
        data: {
          bankAccountId,
          provider: providerLabel(verificationGateway().name),
          providerRefId: snapshot.providerRefId,
          status: snapshot.status,
          amountPaise: snapshot.amountPaise,
          registeredName: snapshot.registeredName,
          nameMatchScore: score,
          responseCode: snapshot.responseCode,
          message: snapshot.message,
          rawResponse: JSON.stringify(snapshot.raw ?? {}),
          attemptNo,
          completedAt: new Date(),
        },
      });
    }

    return tx.bankAccount.update({
      where: { id: bankAccountId },
      data: {
        verificationStatus: status,
        verifiedAt: passed ? new Date() : null,
        registeredName: snapshot.registeredName,
        nameMatchScore: score,
        failureReason: passed ? null : message,
        // Cleared on a terminal outcome so a later retry starts a fresh drop.
        // A `review` keeps its ref: an admin decision, not another penny drop,
        // is what resolves it.
        pendingVerificationRef: verdict === 'review' ? snapshot.providerRefId : null,
        providerContactId: snapshot.providerContactId ?? undefined,
        providerFundAccountId: snapshot.providerFundAccountId ?? undefined,
      },
      include: { user: { select: { id: true } } },
    });
  });

  if (passed) {
    await notify({
      userId: account.userId,
      ...templates.bankVerified({
        bankName: account.bankName ?? account.vpa ?? 'bank',
        last4: account.last4 ?? '',
      }),
      channels: ['email', 'push'],
    });
  } else if (status === 'failed') {
    await notify({
      userId: account.userId,
      ...templates.bankVerificationFailed({
        bankName: account.bankName ?? account.vpa ?? 'bank',
        reason: message,
      }),
      channels: ['email', 'push'],
    });
  }

  return {
    bankAccountId,
    status,
    verdict,
    registeredName: snapshot.registeredName,
    nameMatchScore: score,
    message,
    withdrawalsEnabled: passed,
  };
}

/**
 * Trusts our own scorer over the provider's, but never scores *higher* than the
 * provider did — if their engine saw a mismatch we don't override it upward.
 */
function recomputeScore(
  submitted: string,
  registered: string,
  providerScore: number | null,
): number {
  const ours = nameMatchScore(submitted, registered);
  return providerScore === null ? ours : Math.min(ours, providerScore);
}

function providerLabel(name: string): string {
  return name === 'razorpay' ? 'razorpay_fav' : name;
}

// ── IFSC directory ────────────────────────────────────────────────────

export async function lookupIfsc(ifsc: string): Promise<IfscDetails> {
  const code = ifsc.trim().toUpperCase();
  if (!isValidIfsc(code)) return null;
  try {
    return await verificationGateway().lookupIfsc(code);
  } catch {
    return null;
  }
}

// ── Destination management ────────────────────────────────────────────

function publicAccount(account: {
  id: string;
  destinationType: string;
  accountHolder: string;
  last4: string | null;
  ifsc: string | null;
  bankName: string | null;
  branch: string | null;
  vpa: string | null;
  verificationStatus: string;
  verifiedAt: Date | null;
  nameMatchScore: number | null;
  registeredName: string | null;
  failureReason: string | null;
  attempts: number;
  isDefault: boolean;
}) {
  return {
    id: account.id,
    type: account.destinationType,
    accountHolder: account.accountHolder,
    // Never the full number, at any layer.
    accountMasked: account.destinationType === 'vpa' ? account.vpa : maskAccount(account.last4),
    ifsc: account.ifsc,
    bankName: account.bankName,
    branch: account.branch,
    vpa: account.vpa,
    verificationStatus: account.verificationStatus,
    verifiedAt: account.verifiedAt,
    nameMatchScore: account.nameMatchScore,
    registeredName: account.registeredName,
    failureReason: account.failureReason,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - account.attempts),
    isDefault: account.isDefault,
    canWithdraw: account.verificationStatus === 'verified',
  };
}

export async function listDestinations(userId: string) {
  const rows = await db.bankAccount.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map(publicAccount);
}

export async function setDefaultDestination(bankAccountId: string, userId: string) {
  const account = await db.bankAccount.findFirst({
    where: { id: bankAccountId, userId, deletedAt: null },
  });
  if (!account) throw new AppError('Payout destination not found.', 404);

  await db.$transaction([
    db.bankAccount.updateMany({ where: { userId }, data: { isDefault: false } }),
    db.bankAccount.update({ where: { id: bankAccountId }, data: { isDefault: true } }),
  ]);
  return { updated: true };
}

/**
 * Soft delete. The row survives because withdrawals reference it and a payout
 * audit trail with a dangling destination is not an audit trail.
 */
export async function removeDestination(bankAccountId: string, userId: string) {
  const account = await db.bankAccount.findFirst({
    where: { id: bankAccountId, userId, deletedAt: null },
  });
  if (!account) throw new AppError('Payout destination not found.', 404);

  const inFlight = await db.withdrawalRequest.count({
    where: {
      bankAccountId,
      status: { in: ['requested', 'approved', 'processing'] },
    },
  });
  if (inFlight > 0) {
    throw new AppError('A withdrawal to this account is still in progress.', 409);
  }

  await db.bankAccount.update({
    where: { id: bankAccountId },
    data: { deletedAt: new Date(), isDefault: false },
  });

  // Keep a default if one is still available.
  const next = await db.bankAccount.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (next) await db.bankAccount.update({ where: { id: next.id }, data: { isDefault: true } });

  return { removed: true };
}

// ── Admin ─────────────────────────────────────────────────────────────

/** Admin Bank Verification Logs module. */
export async function listVerifications(
  opts: { status?: string; take?: number; skip?: number; query?: string } = {},
) {
  const where = {
    deletedAt: null,
    ...(opts.status && opts.status !== 'all' ? { verificationStatus: opts.status } : {}),
    ...(opts.query
      ? {
          OR: [
            { accountHolder: { contains: opts.query } },
            { last4: { contains: opts.query } },
            { vpa: { contains: opts.query } },
            { user: { email: { contains: opts.query } } },
          ],
        }
      : {}),
  };

  const [rows, total, counts] = await Promise.all([
    db.bankAccount.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: opts.take ?? 25,
      skip: opts.skip ?? 0,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        verificationLogs: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    }),
    db.bankAccount.count({ where }),
    db.bankAccount.groupBy({
      by: ['verificationStatus'],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  return {
    rows: rows.map((r) => ({
      ...publicAccount(r),
      user: r.user,
      logs: r.verificationLogs,
      verdict: nameMatchVerdict(r.nameMatchScore),
    })),
    total,
    counts: Object.fromEntries(counts.map((c) => [c.verificationStatus, c._count._all])),
    thresholds: { pass: NAME_MATCH_PASS, review: NAME_MATCH_REVIEW },
  };
}

export async function getVerificationHistory(bankAccountId: string) {
  const account = await db.bankAccount.findUnique({
    where: { id: bankAccountId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      verificationLogs: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!account) throw new AppError('Payout destination not found.', 404);
  return {
    ...publicAccount(account),
    user: account.user,
    logs: account.verificationLogs,
  };
}

/**
 * Manual override for the `review` band — an admin looked at the returned name
 * and made a judgement. Recorded as its own log entry so the decision has an
 * owner, which is the whole point of having a review band.
 */
export async function overrideVerification(input: {
  bankAccountId: string;
  adminId: string;
  decision: 'approve' | 'reject';
  note: string;
}) {
  if (!input.note.trim()) {
    throw new AppError('A note is required when overriding a verification result.');
  }

  const account = await db.bankAccount.findUnique({ where: { id: input.bankAccountId } });
  if (!account) throw new AppError('Payout destination not found.', 404);

  const approve = input.decision === 'approve';

  await db.$transaction(async (tx) => {
    await tx.bankVerificationLog.create({
      data: {
        bankAccountId: input.bankAccountId,
        provider: 'manual',
        requestType: 'penny_drop',
        status: approve ? 'completed' : 'failed',
        amountPaise: 0,
        registeredName: account.registeredName,
        nameMatchScore: account.nameMatchScore,
        responseCode: approve ? 'MANUAL_APPROVE' : 'MANUAL_REJECT',
        message: `${approve ? 'Approved' : 'Rejected'} by an administrator: ${input.note}`,
        attemptNo: account.attempts,
        completedAt: new Date(),
      },
    });

    await tx.bankAccount.update({
      where: { id: input.bankAccountId },
      data: {
        verificationStatus: approve ? 'verified' : 'failed',
        verifiedAt: approve ? new Date() : null,
        failureReason: approve ? null : input.note,
        pendingVerificationRef: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.adminId,
        action: approve ? 'bank_verification.approve' : 'bank_verification.reject',
        entity: 'BankAccount',
        entityId: input.bankAccountId,
        before: JSON.stringify({
          verificationStatus: account.verificationStatus,
          nameMatchScore: account.nameMatchScore,
        }),
        after: JSON.stringify({
          verificationStatus: approve ? 'verified' : 'failed',
          note: input.note,
        }),
      },
    });
  });

  await notify({
    userId: account.userId,
    ...(approve
      ? templates.bankVerified({
          bankName: account.bankName ?? account.vpa ?? 'bank',
          last4: account.last4 ?? '',
        })
      : templates.bankVerificationFailed({
          bankName: account.bankName ?? account.vpa ?? 'bank',
          reason: input.note,
        })),
    channels: ['email', 'push'],
  });

  return { updated: true, status: approve ? 'verified' : 'failed' };
}

/** Admin-triggered re-verification — clears state and starts a fresh drop. */
export async function retriggerVerification(bankAccountId: string, adminId: string) {
  const account = await db.bankAccount.findUnique({ where: { id: bankAccountId } });
  if (!account) throw new AppError('Payout destination not found.', 404);

  await db.$transaction(async (tx) => {
    await tx.bankAccount.update({
      where: { id: bankAccountId },
      data: {
        verificationStatus: 'unverified',
        pendingVerificationRef: null,
        failureReason: null,
        // Attempts are reset so the customer isn't locked out by an admin's
        // own decision to re-check.
        attempts: 0,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: 'bank_verification.retrigger',
        entity: 'BankAccount',
        entityId: bankAccountId,
        before: JSON.stringify({
          verificationStatus: account.verificationStatus,
          attempts: account.attempts,
        }),
      },
    });
  });

  return startVerification(bankAccountId, account.userId);
}

/** Sweeps verifications still pending at the provider. */
export async function syncPendingVerifications(): Promise<{ checked: number; settled: number }> {
  const pending = await db.bankAccount.findMany({
    where: { verificationStatus: 'pending', pendingVerificationRef: { not: null }, deletedAt: null },
    take: 50,
    select: { id: true, userId: true, nameMatchScore: true },
  });

  let settled = 0;
  for (const row of pending) {
    try {
      const result = await pollVerification(row.id, row.userId);
      if (result.status !== 'pending') settled += 1;
    } catch (err) {
      console.error(`[verification] sync failed for account ${row.id}:`, err);
    }
  }

  return { checked: pending.length, settled };
}
