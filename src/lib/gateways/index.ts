import type { PaymentGateway, PayoutGateway, VerificationGateway } from './types';
import { MockPaymentGateway, MockPayoutGateway, MockVerificationGateway } from './mock';
import {
  RazorpayPaymentGateway,
  RazorpayPayoutGateway,
  RazorpayVerificationGateway,
} from './razorpay';

export * from './types';
export { nameMatchScore, nameMatchVerdict, NAME_MATCH_PASS, NAME_MATCH_REVIEW } from './name-match';
export { mockSignPayment, mockPaymentId, mockOrderAmount, mockWebhookSignature } from './mock';

/**
 * Driver resolution. Each capability is switched independently so you can run,
 * say, live Payments while payouts stay simulated during a rollout.
 *
 *   PAYMENT_DRIVER      = mock | razorpay
 *   PAYOUT_DRIVER       = mock | razorpay
 *   VERIFICATION_DRIVER = mock | razorpay
 *
 * Instances are memoised per process — they hold no per-request state.
 */

type Drivers = {
  payments: PaymentGateway;
  payouts: PayoutGateway;
  verification: VerificationGateway;
};

const cached = globalThis as unknown as { __voltageDrivers?: Drivers };

function build(): Drivers {
  const p = (process.env.PAYMENT_DRIVER ?? 'mock').toLowerCase();
  const o = (process.env.PAYOUT_DRIVER ?? 'mock').toLowerCase();
  const v = (process.env.VERIFICATION_DRIVER ?? 'mock').toLowerCase();

  return {
    payments: p === 'razorpay' ? new RazorpayPaymentGateway() : new MockPaymentGateway(),
    payouts: o === 'razorpay' ? new RazorpayPayoutGateway() : new MockPayoutGateway(),
    verification:
      v === 'razorpay' ? new RazorpayVerificationGateway() : new MockVerificationGateway(),
  };
}

function drivers(): Drivers {
  if (!cached.__voltageDrivers) cached.__voltageDrivers = build();
  return cached.__voltageDrivers;
}

export function paymentGateway(): PaymentGateway {
  return drivers().payments;
}

export function payoutGateway(): PayoutGateway {
  return drivers().payouts;
}

export function verificationGateway(): VerificationGateway {
  return drivers().verification;
}

/** Surfaced in the admin Settings screen so operators can see what's live. */
export function driverStatus() {
  const d = drivers();
  return {
    payments: { driver: d.payments.name, live: d.payments.isLive },
    payouts: { driver: d.payouts.name, live: d.payouts.isLive },
    verification: { driver: d.verification.name, live: d.verification.isLive },
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    xAccountConfigured: Boolean(process.env.RAZORPAYX_ACCOUNT_NUMBER),
  };
}
