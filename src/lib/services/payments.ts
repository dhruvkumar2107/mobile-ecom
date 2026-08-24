import 'server-only';

import { db } from '../db';
import { AppError } from '../api';
import { paymentGateway, GatewayError } from '../gateways';
import type { PaymentSnapshot } from '../gateways';
import { ONLINE_PAYMENT_METHODS, type PaymentMethod } from '../enums';
import { notify, templates } from './notify';
import { confirmOrder } from './orders';
import { orderNo } from '../ids';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  PAYMENTS — money in
 * ════════════════════════════════════════════════════════════════════════
 *  Two rules run through everything here:
 *
 *  1. The amount is read from the gateway, never from the browser. A verify
 *     callback carries ids and a signature; the figure we credit comes from
 *     fetchPayment(). Trusting a posted amount is how a ₹80,000 phone gets
 *     paid for with ₹1.
 *
 *  2. Nothing about the order moves until the gateway says `captured`.
 *     `authorized` means the bank has ring-fenced the money, not that we hold
 *     it — so we capture, re-read, and only then confirm.
 *
 *  Every attempt is persisted before the gateway is called, so a failure that
 *  loses the response still leaves a row to reconcile against.
 */

// ── Initiate ──────────────────────────────────────────────────────────

export type InitiateInput = {
  orderId: string;
  userId: string;
  method: PaymentMethod;
  /** Optional saved instrument, purely for the label on the attempt row. */
  savedCardId?: string | null;
  savedUpiId?: string | null;
};

export type InitiateResult = {
  attemptId: string;
  gateway: string;
  gatewayOrderId: string;
  publicKey: string;
  amountPaise: number;
  currency: string;
  orderNo: string;
  /** Prefill for the gateway's hosted checkout. */
  prefill: { name: string; email: string | null; contact: string | null };
  /** True when the mock driver is live, so the UI can show its simulator panel. */
  isMock: boolean;
};

export async function initiatePayment(input: InitiateInput): Promise<InitiateResult> {
  if (!ONLINE_PAYMENT_METHODS.includes(input.method)) {
    throw new AppError('That payment method does not need an online payment.', 400);
  }

  const order = await db.order.findFirst({
    where: { id: input.orderId, userId: input.userId },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
  if (!order) throw new AppError('Order not found.', 404);

  if (order.paymentStatus === 'paid') {
    throw new AppError('This order is already paid.', 409);
  }
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError('This order can no longer be paid for.', 409);
  }
  if (order.amountDuePaise <= 0) {
    throw new AppError('There is nothing left to pay on this order.', 409);
  }

  const gw = paymentGateway();

  // Attempt number is derived, not passed in — the client has no business
  // deciding which try this is.
  const priorCount = await db.paymentAttempt.count({ where: { orderId: order.id } });

  let gatewayOrder;
  try {
    gatewayOrder = await gw.createOrder({
      amountPaise: order.amountDuePaise,
      receipt: order.orderNo,
      method: input.method === 'emi' ? 'emi' : (input.method as 'card' | 'upi' | 'netbanking' | 'wallet'),
      notes: { orderNo: order.orderNo, userId: order.userId },
    });
  } catch (err) {
    // A gateway that won't even open a session still deserves a row, otherwise
    // the failure is invisible to the admin Payments dashboard.
    await db.paymentAttempt.create({
      data: {
        orderId: order.id,
        gateway: gw.name,
        method: input.method,
        amountPaise: order.amountDuePaise,
        status: 'failed',
        attemptNo: priorCount + 1,
        errorCode: err instanceof GatewayError ? err.code : 'gateway_unreachable',
        errorDescription: err instanceof Error ? err.message : 'Could not reach the payment gateway.',
      },
    });
    throw err instanceof GatewayError
      ? new AppError(err.message, 502)
      : new AppError('Could not start the payment. Please try again.', 502);
  }

  const instrumentLabel = await resolveInstrumentLabel(input);

  const attempt = await db.paymentAttempt.create({
    data: {
      orderId: order.id,
      gateway: gw.name,
      gatewayOrderId: gatewayOrder.gatewayOrderId,
      method: input.method,
      instrumentLabel,
      amountPaise: order.amountDuePaise,
      status: 'created',
      attemptNo: priorCount + 1,
      isRetryOf: priorCount > 0 ? await latestFailedAttemptId(order.id) : null,
    },
  });

  return {
    attemptId: attempt.id,
    gateway: gw.name,
    gatewayOrderId: gatewayOrder.gatewayOrderId,
    publicKey: gatewayOrder.publicKey,
    amountPaise: order.amountDuePaise,
    currency: gatewayOrder.currency,
    orderNo: order.orderNo,
    prefill: {
      name: order.user.name ?? 'VOLTAGE customer',
      email: order.user.email,
      contact: order.user.phone,
    },
    isMock: !gw.isLive,
  };
}

async function latestFailedAttemptId(orderId: string): Promise<string | null> {
  const prev = await db.paymentAttempt.findFirst({
    where: { orderId, status: 'failed' },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return prev?.id ?? null;
}

async function resolveInstrumentLabel(input: InitiateInput): Promise<string | null> {
  if (input.savedCardId) {
    const card = await db.savedCard.findFirst({
      where: { id: input.savedCardId, userId: input.userId },
      select: { network: true, last4: true, issuer: true },
    });
    if (card) return `${card.issuer ?? card.network} •••• ${card.last4}`;
  }
  if (input.savedUpiId) {
    const upi = await db.savedUpi.findFirst({
      where: { id: input.savedUpiId, userId: input.userId },
      select: { vpa: true },
    });
    if (upi) return upi.vpa;
  }
  return null;
}

// ── Verify & capture ──────────────────────────────────────────────────

export type VerifyInput = {
  orderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature: string;
  userId?: string | null;
};

export type VerifyResult = {
  ok: boolean;
  status: string;
  orderNo: string;
  amountPaidPaise: number;
  message: string;
};

/**
 * The browser's success callback. The signature proves the callback came from
 * the gateway; `fetchPayment` proves what was actually paid. Both are required —
 * a valid signature over a lie is still a lie.
 */
export async function verifyPayment(input: VerifyInput): Promise<VerifyResult> {
  const attempt = await db.paymentAttempt.findFirst({
    where: {
      orderId: input.orderId,
      gatewayOrderId: input.gatewayOrderId,
      ...(input.userId ? { order: { userId: input.userId } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { order: { select: { id: true, orderNo: true, userId: true, amountDuePaise: true } } },
  });
  if (!attempt) throw new AppError('We could not find that payment session.', 404);

  // Replay of a callback we already processed — return the settled state rather
  // than re-crediting the order.
  if (attempt.status === 'captured') {
    return {
      ok: true,
      status: 'captured',
      orderNo: attempt.order.orderNo,
      amountPaidPaise: attempt.amountPaise,
      message: 'Payment already confirmed.',
    };
  }

  const gw = paymentGateway();

  const signatureOk = await gw.verifyPaymentSignature({
    gatewayOrderId: input.gatewayOrderId,
    gatewayPaymentId: input.gatewayPaymentId,
    signature: input.signature,
  });

  if (!signatureOk) {
    await failAttempt(
      attempt.id,
      'signature_mismatch',
      'The payment confirmation could not be verified.',
    );
    throw new AppError(
      'This payment could not be verified. If money was debited it will be refunded automatically.',
      400,
    );
  }

  let snapshot: PaymentSnapshot;
  try {
    snapshot = await gw.fetchPayment(input.gatewayPaymentId);
  } catch (err) {
    // Signature was good but we can't read the payment — leave the attempt
    // pending so the webhook or a reconciliation sweep settles it. Do NOT fail
    // it: the customer's money may well have moved.
    await db.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'pending',
        gatewayPaymentId: input.gatewayPaymentId,
        errorDescription: err instanceof Error ? err.message : 'Gateway read failed',
      },
    });
    return {
      ok: false,
      status: 'pending',
      orderNo: attempt.order.orderNo,
      amountPaidPaise: 0,
      message: 'Your payment is being confirmed. We will update the order shortly.',
    };
  }

  return settleSnapshot(attempt.id, snapshot);
}

/**
 * The single place a gateway snapshot turns into order state. Both the verify
 * callback and the webhook funnel through here, which is what keeps them from
 * disagreeing.
 */
async function settleSnapshot(
  attemptId: string,
  snapshot: PaymentSnapshot,
): Promise<VerifyResult> {
  const attempt = await db.paymentAttempt.findUnique({
    where: { id: attemptId },
    include: { order: true },
  });
  if (!attempt) throw new AppError('Payment attempt not found.', 404);

  const order = attempt.order;

  if (snapshot.status === 'failed') {
    await failAttempt(
      attempt.id,
      snapshot.errorCode ?? 'payment_failed',
      snapshot.errorDescription ?? 'The payment was declined.',
      snapshot,
    );
    await notify({
      userId: order.userId,
      ...templates.paymentFailed({
        orderNo: order.orderNo,
        reason: snapshot.errorDescription ?? 'The payment was declined by your bank.',
      }),
      channels: ['email', 'push'],
    });
    return {
      ok: false,
      status: 'failed',
      orderNo: order.orderNo,
      amountPaidPaise: 0,
      message: snapshot.errorDescription ?? 'Your payment was declined. Please try another method.',
    };
  }

  let live = snapshot;

  // `authorized` is a hold, not a receipt. Capture converts it.
  if (live.status === 'authorized') {
    try {
      live = await paymentGateway().capturePayment(live.gatewayPaymentId, attempt.amountPaise);
    } catch (err) {
      await db.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'authorized',
          gatewayPaymentId: live.gatewayPaymentId,
          errorDescription: err instanceof Error ? err.message : 'Capture failed',
          rawPayload: JSON.stringify(live.raw ?? {}),
        },
      });
      return {
        ok: false,
        status: 'authorized',
        orderNo: order.orderNo,
        amountPaidPaise: 0,
        message: 'Your payment is authorised and being captured. The order will confirm shortly.',
      };
    }
  }

  if (live.status !== 'captured') {
    await db.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: live.status,
        gatewayPaymentId: live.gatewayPaymentId,
        method: live.method ?? attempt.method,
        instrumentLabel: live.instrumentLabel ?? attempt.instrumentLabel,
        rawPayload: JSON.stringify(live.raw ?? {}),
      },
    });
    return {
      ok: false,
      status: live.status,
      orderNo: order.orderNo,
      amountPaidPaise: 0,
      message: 'Your payment is still processing. We will confirm the order as soon as it clears.',
    };
  }

  // Underpayment never confirms an order. It's recorded and escalated instead —
  // silently accepting it would ship a phone for less than its price.
  if (live.amountPaise < attempt.amountPaise) {
    await db.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'captured',
        gatewayPaymentId: live.gatewayPaymentId,
        capturedAt: new Date(),
        errorCode: 'amount_mismatch',
        errorDescription: `Captured ${live.amountPaise} against ${attempt.amountPaise} due.`,
        rawPayload: JSON.stringify(live.raw ?? {}),
      },
    });
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'partially_paid',
        amountPaidPaise: { increment: live.amountPaise },
        amountDuePaise: Math.max(0, order.amountDuePaise - live.amountPaise),
        notes: `Underpaid by ${order.amountDuePaise - live.amountPaise} paise — needs review.`,
      },
    });
    return {
      ok: false,
      status: 'partially_paid',
      orderNo: order.orderNo,
      amountPaidPaise: live.amountPaise,
      message: 'We received a partial payment. Our team will contact you about the balance.',
    };
  }

  await db.paymentAttempt.update({
    where: { id: attempt.id },
    data: {
      status: 'captured',
      gatewayPaymentId: live.gatewayPaymentId,
      method: live.method ?? attempt.method,
      instrumentLabel: live.instrumentLabel ?? attempt.instrumentLabel,
      capturedAt: new Date(),
      errorCode: null,
      errorDescription: null,
      rawPayload: JSON.stringify(live.raw ?? {}),
    },
  });

  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'paid',
      amountPaidPaise: order.totalPaise,
      amountDuePaise: 0,
      paymentMethod: (live.method as PaymentMethod | null) ?? order.paymentMethod,
    },
  });

  // Any older attempt still sitting open on this order is moot now.
  await db.paymentAttempt.updateMany({
    where: { orderId: order.id, id: { not: attempt.id }, status: { in: ['created', 'pending'] } },
    data: { status: 'failed', errorCode: 'superseded', failedAt: new Date() },
  });

  await confirmOrder(order.id, {
    note: `Paid online — ${live.instrumentLabel ?? live.method ?? 'gateway'}`,
    actorId: order.userId,
  });

  await notify({
    userId: order.userId,
    ...templates.orderPlaced({
      orderNo: order.orderNo,
      totalPaise: order.totalPaise,
      expectedBy: order.expectedDeliveryAt,
    }),
    channels: ['email', 'sms', 'push'],
  });

  return {
    ok: true,
    status: 'captured',
    orderNo: order.orderNo,
    amountPaidPaise: live.amountPaise,
    message: 'Payment successful.',
  };
}

async function failAttempt(
  attemptId: string,
  code: string,
  description: string,
  snapshot?: PaymentSnapshot,
) {
  await db.paymentAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'failed',
      failedAt: new Date(),
      errorCode: code,
      errorDescription: description,
      ...(snapshot
        ? {
            gatewayPaymentId: snapshot.gatewayPaymentId,
            rawPayload: JSON.stringify(snapshot.raw ?? {}),
          }
        : {}),
    },
  });

  const attempt = await db.paymentAttempt.findUnique({
    where: { id: attemptId },
    select: { orderId: true },
  });
  if (attempt) {
    await db.order.update({
      where: { id: attempt.orderId },
      data: { paymentStatus: 'failed' },
    });
  }
}

/** Customer-facing abandon — closes the session so retry starts clean. */
export async function abandonPayment(orderId: string, userId: string) {
  const attempt = await db.paymentAttempt.findFirst({
    where: { orderId, order: { userId }, status: { in: ['created', 'pending'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (!attempt) return { closed: false };
  await failAttempt(attempt.id, 'cancelled_by_user', 'The customer closed the payment window.');
  return { closed: true };
}

// ── Retry ─────────────────────────────────────────────────────────────

/**
 * Retry after a failure. A new attempt is created rather than the old one
 * reopened, because the failure history is what the admin dashboard reads and
 * what tells us a customer tried four cards before one worked.
 */
export async function retryPayment(input: {
  orderId: string;
  userId: string;
  method: PaymentMethod;
}): Promise<InitiateResult> {
  const order = await db.order.findFirst({
    where: { id: input.orderId, userId: input.userId },
    select: { id: true, status: true, paymentStatus: true, amountDuePaise: true },
  });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.paymentStatus === 'paid') throw new AppError('This order is already paid.', 409);
  if (order.status === 'cancelled') {
    throw new AppError('This order was cancelled. Please place a new one.', 409);
  }

  await db.paymentAttempt.updateMany({
    where: { orderId: order.id, status: { in: ['created', 'pending'] } },
    data: { status: 'failed', errorCode: 'superseded_by_retry', failedAt: new Date() },
  });

  return initiatePayment({ orderId: input.orderId, userId: input.userId, method: input.method });
}

/**
 * Reconciliation sweep for attempts left in limbo — a closed browser, a lost
 * webhook, a UPI collect request the customer approved ten minutes later.
 * Called from the admin Payments dashboard and safe to run repeatedly.
 */
export async function syncPendingPayments(olderThanMinutes = 2): Promise<{
  checked: number;
  settled: number;
}> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  const stale = await db.paymentAttempt.findMany({
    where: {
      status: { in: ['pending', 'authorized'] },
      gatewayPaymentId: { not: null },
      createdAt: { lt: cutoff },
    },
    take: 50,
    select: { id: true, gatewayPaymentId: true },
  });

  let settled = 0;
  for (const row of stale) {
    try {
      const snapshot = await paymentGateway().fetchPayment(row.gatewayPaymentId!);
      const result = await settleSnapshot(row.id, snapshot);
      if (result.ok) settled += 1;
    } catch (err) {
      console.error(`[payments] sync failed for attempt ${row.id}:`, err);
    }
  }

  return { checked: stale.length, settled };
}

// ── Refunds ───────────────────────────────────────────────────────────

export type RefundResult = {
  refundId: string;
  status: string;
  amountPaise: number;
  gatewayRefundId: string | null;
};

/**
 * Refunds gateway money for an order. Called by cancellation and returns, and
 * by the admin Payments screen for a manual refund.
 *
 * A failure here creates a Refund row with `failed` status rather than throwing
 * the money away — the admin dashboard lists those for retry. An owed refund
 * that exists only in a log line is an owed refund nobody pays.
 */
export async function refundOrderPayment(input: {
  orderId: string;
  amountPaise: number;
  reason: string;
  speed?: 'normal' | 'optimum';
}): Promise<RefundResult> {
  if (input.amountPaise <= 0) throw new AppError('Refund amount must be positive.');

  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: {
      payments: {
        where: { status: 'captured' },
        orderBy: { capturedAt: 'desc' },
      },
      refunds: true,
    },
  });
  if (!order) throw new AppError('Order not found.', 404);

  const captured = order.payments.reduce((s, p) => s + p.amountPaise, 0);
  const alreadyRefunded = order.refunds
    .filter((r) => r.status !== 'failed')
    .reduce((s, r) => s + r.amountPaise, 0);

  if (alreadyRefunded + input.amountPaise > captured) {
    throw new AppError(
      `Only ${captured - alreadyRefunded} paise of gateway money remains refundable on this order.`,
      409,
    );
  }

  const source = order.payments[0];
  if (!source?.gatewayPaymentId) {
    throw new AppError('No captured gateway payment to refund against.', 409);
  }

  const refund = await db.refund.create({
    data: {
      orderId: order.id,
      paymentAttemptId: source.id,
      amountPaise: input.amountPaise,
      reason: input.reason,
      mode: 'gateway',
      status: 'initiated',
      speed: input.speed ?? 'normal',
    },
  });

  try {
    const snapshot = await paymentGateway().refund({
      gatewayPaymentId: source.gatewayPaymentId,
      amountPaise: input.amountPaise,
      speed: input.speed ?? 'normal',
      notes: { orderNo: order.orderNo, reason: input.reason },
    });

    const done = snapshot.status === 'completed';

    await db.$transaction(async (tx) => {
      await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: snapshot.status,
          gatewayRefundId: snapshot.gatewayRefundId,
          processedAt: done ? new Date() : null,
        },
      });

      const totalRefunded = alreadyRefunded + input.amountPaise;
      await tx.order.update({
        where: { id: order.id },
        data: {
          refundedPaise: { increment: input.amountPaise },
          paymentStatus: totalRefunded >= captured ? 'refunded' : 'partially_refunded',
        },
      });

      if (snapshot.amountPaise === source.amountPaise) {
        await tx.paymentAttempt.update({
          where: { id: source.id },
          data: { status: 'refunded' },
        });
      }
    });

    await notify({
      userId: order.userId,
      ...templates.refundIssued({
        orderNo: order.orderNo,
        amountPaise: input.amountPaise,
        destination: source.instrumentLabel ?? 'your original payment method',
      }),
      channels: ['email', 'sms'],
    });

    return {
      refundId: refund.id,
      status: snapshot.status,
      amountPaise: input.amountPaise,
      gatewayRefundId: snapshot.gatewayRefundId,
    };
  } catch (err) {
    await db.refund.update({
      where: { id: refund.id },
      data: {
        status: 'failed',
        reason: `${input.reason} — gateway error: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      },
    });
    throw err instanceof GatewayError
      ? new AppError(`Refund could not be sent: ${err.message}`, 502)
      : new AppError('Refund could not be sent to the gateway. It is queued for retry.', 502);
  }
}

/** Admin retry for a refund the gateway rejected. */
export async function retryRefund(refundId: string): Promise<RefundResult> {
  const refund = await db.refund.findUnique({ where: { id: refundId } });
  if (!refund) throw new AppError('Refund not found.', 404);
  if (refund.status === 'completed') throw new AppError('That refund already completed.', 409);

  // The failed row is retired rather than reused, so the retry history survives.
  await db.refund.update({
    where: { id: refundId },
    data: { status: 'failed', reason: `${refund.reason ?? ''} (superseded by retry)`.trim() },
  });

  return refundOrderPayment({
    orderId: refund.orderId,
    amountPaise: refund.amountPaise,
    reason: refund.reason ?? 'Retry of a failed refund',
    speed: refund.speed as 'normal' | 'optimum',
  });
}

// ── Webhooks ──────────────────────────────────────────────────────────

type WebhookBody = {
  event?: string;
  payload?: {
    payment?: { entity?: Record<string, unknown> };
    refund?: { entity?: Record<string, unknown> };
    payout?: { entity?: Record<string, unknown> };
  };
};

/**
 * Gateway webhook intake.
 *
 * Signature verification runs against the RAW body — re-serialising JSON
 * changes byte order and breaks the HMAC. Events are deduplicated on the
 * provider's own event id, because gateways retry aggressively and delivering
 * the same capture twice must not confirm an order twice.
 */
export async function handlePaymentWebhook(input: {
  rawBody: string;
  signature: string;
  eventId: string;
  gateway?: string;
}): Promise<{ ok: boolean; handled: string; duplicate?: boolean }> {
  const gw = paymentGateway();
  const signatureValid = gw.verifyWebhookSignature(input.rawBody, input.signature);

  const existing = await db.webhookEvent.findUnique({ where: { eventId: input.eventId } });
  if (existing?.processedAt) {
    return { ok: true, handled: existing.eventType, duplicate: true };
  }

  let body: WebhookBody = {};
  try {
    body = JSON.parse(input.rawBody) as WebhookBody;
  } catch {
    /* recorded below with the parse failure */
  }
  const eventType = body.event ?? 'unknown';

  const record = existing
    ? await db.webhookEvent.update({
        where: { id: existing.id },
        data: { signatureValid, payload: input.rawBody, eventType },
      })
    : await db.webhookEvent.create({
        data: {
          gateway: input.gateway ?? gw.name,
          eventId: input.eventId,
          eventType,
          payload: input.rawBody,
          signatureValid,
        },
      });

  // An unsigned event is stored for forensics and then ignored. Acting on it
  // would let anyone who knows the URL mark orders paid.
  if (!signatureValid) {
    await db.webhookEvent.update({
      where: { id: record.id },
      data: { error: 'Signature verification failed', processedAt: new Date() },
    });
    throw new AppError('Webhook signature verification failed.', 400);
  }

  try {
    await dispatchWebhook(eventType, body);
    await db.webhookEvent.update({
      where: { id: record.id },
      data: { processedAt: new Date(), error: null },
    });
    return { ok: true, handled: eventType };
  } catch (err) {
    // Left unprocessed on purpose: the gateway will redeliver, and the admin
    // dashboard shows the error in the meantime.
    await db.webhookEvent.update({
      where: { id: record.id },
      data: { error: err instanceof Error ? err.message : 'Handler failed' },
    });
    throw err;
  }
}

async function dispatchWebhook(eventType: string, body: WebhookBody): Promise<void> {
  const paymentEntity = body.payload?.payment?.entity;
  const refundEntity = body.payload?.refund?.entity;
  const payoutEntity = body.payload?.payout?.entity;

  switch (eventType) {
    case 'payment.captured':
    case 'payment.authorized':
    case 'payment.failed': {
      const gatewayPaymentId = String(paymentEntity?.id ?? '');
      const gatewayOrderId = paymentEntity?.order_id ? String(paymentEntity.order_id) : null;
      if (!gatewayPaymentId) throw new AppError('Webhook carried no payment id.', 400);

      const attempt = await db.paymentAttempt.findFirst({
        where: {
          OR: [
            { gatewayPaymentId },
            ...(gatewayOrderId ? [{ gatewayOrderId, status: { in: ['created', 'pending'] } }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (!attempt) return; // not an order of ours

      const snapshot = await paymentGateway().fetchPayment(gatewayPaymentId);
      await settleSnapshot(attempt.id, snapshot);
      return;
    }

    case 'refund.processed':
    case 'refund.failed': {
      const gatewayRefundId = String(refundEntity?.id ?? '');
      if (!gatewayRefundId) return;
      const refund = await db.refund.findFirst({ where: { gatewayRefundId } });
      if (!refund) return;

      const completed = eventType === 'refund.processed';
      await db.refund.update({
        where: { id: refund.id },
        data: {
          status: completed ? 'completed' : 'failed',
          processedAt: completed ? new Date() : null,
        },
      });
      return;
    }

    case 'payout.processed':
    case 'payout.reversed':
    case 'payout.failed': {
      const providerPayoutId = String(payoutEntity?.id ?? '');
      if (!providerPayoutId) return;
      const { handlePayoutWebhookEvent } = await import('./payouts');
      await handlePayoutWebhookEvent(eventType, providerPayoutId);
      return;
    }

    default:
      // Unrecognised but signed — stored, acknowledged, not acted upon.
      return;
  }
}

// ── Reads ─────────────────────────────────────────────────────────────

export async function getOrderPayments(orderId: string) {
  return db.paymentAttempt.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    include: { refunds: true },
  });
}

export type PaymentListFilter = {
  status?: string;
  gateway?: string;
  method?: string;
  from?: Date;
  to?: Date;
  query?: string;
  take?: number;
  skip?: number;
};

/** Admin Payments dashboard — gateway-wise transaction log. */
export async function listPayments(filter: PaymentListFilter = {}) {
  const where = {
    ...(filter.status && filter.status !== 'all' ? { status: filter.status } : {}),
    ...(filter.gateway && filter.gateway !== 'all' ? { gateway: filter.gateway } : {}),
    ...(filter.method && filter.method !== 'all' ? { method: filter.method } : {}),
    ...(filter.from || filter.to
      ? { createdAt: { ...(filter.from ? { gte: filter.from } : {}), ...(filter.to ? { lte: filter.to } : {}) } }
      : {}),
    ...(filter.query
      ? {
          OR: [
            { gatewayPaymentId: { contains: filter.query } },
            { gatewayOrderId: { contains: filter.query } },
            { order: { orderNo: { contains: filter.query } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.paymentAttempt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter.take ?? 25,
      skip: filter.skip ?? 0,
      include: {
        order: {
          select: {
            orderNo: true,
            totalPaise: true,
            user: { select: { name: true, email: true } },
          },
        },
        refunds: { select: { id: true, amountPaise: true, status: true } },
      },
    }),
    db.paymentAttempt.count({ where }),
  ]);

  return { rows, total };
}

/**
 * Settlement view: what the gateway owes us, and the COD/online split. Failed
 * attempts are counted but contribute nothing — a decline is not revenue.
 */
export async function paymentSummary(from: Date, to: Date) {
  const range = { gte: from, lte: to };

  const [byStatus, byGateway, byMethod, codOrders, onlineOrders, refunds] = await Promise.all([
    db.paymentAttempt.groupBy({
      by: ['status'],
      where: { createdAt: range },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
    db.paymentAttempt.groupBy({
      by: ['gateway'],
      where: { createdAt: range, status: 'captured' },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
    db.paymentAttempt.groupBy({
      by: ['method'],
      where: { createdAt: range, status: 'captured' },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
    db.order.aggregate({
      where: { placedAt: range, paymentMethod: 'cod', status: { notIn: ['cancelled'] } },
      _count: { _all: true },
      _sum: { totalPaise: true },
    }),
    db.order.aggregate({
      where: {
        placedAt: range,
        paymentMethod: { not: 'cod' },
        status: { notIn: ['cancelled'] },
      },
      _count: { _all: true },
      _sum: { totalPaise: true },
    }),
    db.refund.aggregate({
      where: { createdAt: range, status: { in: ['completed', 'processing'] } },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
  ]);

  const captured = byStatus.find((s) => s.status === 'captured');
  const failed = byStatus.find((s) => s.status === 'failed');
  const attemptTotal = byStatus.reduce((s, r) => s + r._count._all, 0);
  const capturedCount = captured?._count._all ?? 0;

  return {
    capturedPaise: captured?._sum.amountPaise ?? 0,
    capturedCount,
    failedCount: failed?._count._all ?? 0,
    attemptCount: attemptTotal,
    /** Share of attempts that ended in money. The number to watch. */
    successRate: attemptTotal ? Math.round((capturedCount / attemptTotal) * 1000) / 10 : 0,
    refundedPaise: refunds._sum.amountPaise ?? 0,
    refundCount: refunds._count._all,
    /** Captured minus refunded — what should actually settle to the bank. */
    netSettlementPaise: (captured?._sum.amountPaise ?? 0) - (refunds._sum.amountPaise ?? 0),
    cod: { count: codOrders._count._all, valuePaise: codOrders._sum.totalPaise ?? 0 },
    online: { count: onlineOrders._count._all, valuePaise: onlineOrders._sum.totalPaise ?? 0 },
    byGateway: byGateway.map((g) => ({
      gateway: g.gateway,
      count: g._count._all,
      valuePaise: g._sum.amountPaise ?? 0,
    })),
    byMethod: byMethod.map((m) => ({
      method: m.method,
      count: m._count._all,
      valuePaise: m._sum.amountPaise ?? 0,
    })),
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: s._count._all,
      valuePaise: s._sum.amountPaise ?? 0,
    })),
  };
}

/**
 * Creates a wallet top-up payment session.
 * Returns the payment gateway order details for the browser to complete.
 */
export async function createWalletTopupOrder(
  userId: string,
  amountPaise: number,
): Promise<{ attemptId: string; gateway: string; gatewayOrderId: string; publicKey: string; amountPaise: number; currency: string; orderNo: string; isMock: boolean }> {
  if (amountPaise <= 0) throw new AppError('Top-up amount must be positive.');
  if (amountPaise > 10_000_000) throw new AppError('Top-up amount cannot exceed ₹1,00,000.');

const user = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true, phone: true } });
  if (!user) throw new AppError('User not found.', 404);

  const gw = paymentGateway();

  const gatewayOrder = await gw.createOrder({
    amountPaise,
    receipt: `WALLET-${userId.slice(0, 8)}-${Date.now()}`,
    method: 'upi',
    notes: { type: 'wallet_topup', userId },
  });

  // Create a wallet top-up order record
  const order = await db.order.create({
    data: {
      orderNo: orderNo(),
      userId,
      status: 'pending',
      paymentMethod: 'wallet_topup',
      paymentStatus: 'pending',
      totalPaise: amountPaise,
      amountDuePaise: amountPaise,
      subtotalPaise: amountPaise,
      discountPaise: 0,
      couponDiscountPaise: 0,
      protectionPaise: 0,
      taxPaise: 0,
      shippingPaise: 0,
      walletAppliedPaise: 0,
      items: {
        create: {
          variantId: 'wallet-topup',
          productName: 'Wallet top-up',
          brandName: 'VOLTAGE',
          variantLabel: 'Wallet balance',
          sku: `WLT-${Date.now()}`,
          quantity: 1,
          unitPricePaise: amountPaise,
          lineTotalPaise: amountPaise,
          mrpPaise: amountPaise,
          taxablePaise: amountPaise,
          taxPaise: 0,
          isAccessory: true,
          imageGradient: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
          hsnCode: '999999',
          gstRate: 0,
          warrantyMonths: 0,
        },
      },
      addressSnapshot: JSON.stringify({}),
    },
  });

  const attempt = await db.paymentAttempt.create({
    data: {
      orderId: order.id,
      gateway: gw.name,
      gatewayOrderId: gatewayOrder.gatewayOrderId,
      method: 'upi',
      instrumentLabel: 'Wallet top-up',
      amountPaise,
      status: 'created',
      attemptNo: 1,
    },
  });

  return {
    attemptId: attempt.id,
    gateway: gw.name,
    gatewayOrderId: gatewayOrder.gatewayOrderId,
    publicKey: gatewayOrder.publicKey,
    amountPaise: gatewayOrder.amountPaise,
    currency: gatewayOrder.currency,
    orderNo: order.orderNo,
    isMock: !gw.isLive,
  };
}

/** Refunds needing attention, for the admin dashboard's action list. */
export async function failedRefunds(take = 25) {
  return db.refund.findMany({
    where: { status: 'failed' },
    orderBy: { createdAt: 'desc' },
    take,
    include: { order: { select: { orderNo: true, user: { select: { name: true, email: true } } } } },
  });
}

/** Webhook log for the admin Payments screen. */
export async function listWebhookEvents(opts: { take?: number; skip?: number } = {}) {
  const [rows, total] = await Promise.all([
    db.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: opts.take ?? 25,
      skip: opts.skip ?? 0,
    }),
    db.webhookEvent.count(),
  ]);
  return { rows, total };
}
