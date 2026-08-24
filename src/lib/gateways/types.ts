/**
 * Gateway contracts.
 *
 * Every integration point is expressed as an interface so the application layer
 * never knows which provider is live. Two drivers implement each contract:
 *
 *   mock/      → deterministic in-process simulator (default; no keys)
 *   razorpay/  → Razorpay Payments, RazorpayX Payouts, Fund Account Validation
 *
 * The mock driver is NOT a stub that returns success. It models the same
 * asynchronous state machines the real providers use — a penny-drop starts
 * `pending` and only resolves on a later poll, payouts queue before they
 * process, and specific inputs deterministically fail — so the flows built on
 * top of it are the flows that run in production.
 */

export type GatewayName = 'mock' | 'razorpay' | 'cashfree';

export type Money = { amountPaise: number; currency: 'INR' };

// ── Payments ──────────────────────────────────────────────────────────

export type CreatePaymentOrderInput = {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
  /** Restricts the checkout to one instrument where the provider supports it. */
  method?: 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi';
};

export type PaymentOrder = {
  gatewayOrderId: string;
  amountPaise: number;
  currency: string;
  status: string;
  /** Public key the browser SDK needs. Empty under the mock driver. */
  publicKey: string;
  gateway: GatewayName;
};

export type PaymentVerifyInput = {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature: string;
};

export type PaymentSnapshot = {
  gatewayPaymentId: string;
  status: 'created' | 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  amountPaise: number;
  method: string | null;
  instrumentLabel: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  raw: unknown;
};

export type RefundInput = {
  gatewayPaymentId: string;
  amountPaise: number;
  speed?: 'normal' | 'optimum';
  notes?: Record<string, string>;
};

export type RefundSnapshot = {
  gatewayRefundId: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed';
  amountPaise: number;
  raw: unknown;
};

export interface PaymentGateway {
  readonly name: GatewayName;
  readonly isLive: boolean;
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder>;
  /** Confirms the browser callback really came from the gateway (HMAC). */
  verifyPaymentSignature(input: PaymentVerifyInput): Promise<boolean>;
  fetchPayment(gatewayPaymentId: string): Promise<PaymentSnapshot>;
  capturePayment(gatewayPaymentId: string, amountPaise: number): Promise<PaymentSnapshot>;
  refund(input: RefundInput): Promise<RefundSnapshot>;
  /** Verifies a webhook body signature. Must use the raw body, not re-serialised JSON. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

// ── Payouts (money out) ───────────────────────────────────────────────

export type PayoutMode = 'IMPS' | 'NEFT' | 'UPI' | 'RTGS';

export type PayoutDestination =
  | {
      type: 'bank';
      accountHolder: string;
      accountNumber: string;
      ifsc: string;
    }
  | { type: 'vpa'; accountHolder: string; vpa: string };

export type CreatePayoutInput = {
  destination: PayoutDestination;
  amountPaise: number;
  mode: PayoutMode;
  /** Idempotency key — our WithdrawalRequest.requestNo. */
  referenceId: string;
  narration?: string;
  contact: { name: string; email?: string | null; phone?: string | null; userId: string };
  /**
   * Provider-side ids cached from a previous verification. Reusing them avoids
   * creating a duplicate contact/fund-account on every withdrawal, and pays out
   * to exactly the account that passed the penny drop.
   */
  contactId?: string | null;
  fundAccountId?: string | null;
};

export type PayoutSnapshot = {
  providerPayoutId: string;
  status: 'created' | 'queued' | 'processing' | 'processed' | 'reversed' | 'failed' | 'cancelled';
  amountPaise: number;
  feePaise: number;
  taxPaise: number;
  mode: PayoutMode;
  utr: string | null;
  failureReason: string | null;
  /** Returned so the caller can persist and reuse them. */
  providerContactId?: string | null;
  providerFundAccountId?: string | null;
  raw: unknown;
};

export interface PayoutGateway {
  readonly name: GatewayName;
  readonly isLive: boolean;
  createPayout(input: CreatePayoutInput): Promise<PayoutSnapshot>;
  fetchPayout(providerPayoutId: string): Promise<PayoutSnapshot>;
  /** Provider-side balance guard, so we don't queue payouts we can't fund. */
  fetchBalancePaise(): Promise<number | null>;
}

// ── Bank account verification (penny drop) ────────────────────────────

export type PennyDropInput = {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  userId: string;
  email?: string | null;
  phone?: string | null;
  /** Reuse an existing provider contact instead of creating another. */
  contactId?: string | null;
};

export type VpaValidateInput = {
  accountHolder: string;
  vpa: string;
  userId: string;
  email?: string | null;
  phone?: string | null;
  contactId?: string | null;
};

export type VerificationSnapshot = {
  providerRefId: string;
  /** `pending` means "keep polling" — this is genuinely asynchronous. */
  status: 'created' | 'pending' | 'completed' | 'failed';
  /** Name on record at the beneficiary bank. Null until completed. */
  registeredName: string | null;
  /** 0–1 similarity between the submitted holder name and `registeredName`. */
  nameMatchScore: number | null;
  accountStatus: 'active' | 'invalid' | null;
  responseCode: string | null;
  message: string | null;
  amountPaise: number;
  /** Persisted so the eventual payout targets the validated fund account. */
  providerContactId?: string | null;
  providerFundAccountId?: string | null;
  raw: unknown;
};

export type IfscDetails = {
  ifsc: string;
  bank: string;
  branch: string;
  city: string;
  state: string;
  supportsImps: boolean;
  supportsUpi: boolean;
} | null;

export interface VerificationGateway {
  readonly name: GatewayName;
  readonly isLive: boolean;
  /** Debits ₹1 to the beneficiary and reads back the name their bank holds. */
  startPennyDrop(input: PennyDropInput): Promise<VerificationSnapshot>;
  /**
   * Polls an in-flight validation. `submittedName` is passed so drivers that
   * don't retain request state can still score the returned registered name.
   */
  fetchVerification(providerRefId: string, submittedName?: string): Promise<VerificationSnapshot>;
  validateVpa(input: VpaValidateInput): Promise<VerificationSnapshot>;
  /** Public IFSC directory lookup — no penny debit, no auth required. */
  lookupIfsc(ifsc: string): Promise<IfscDetails>;
}

export class GatewayError extends Error {
  constructor(
    message: string,
    readonly code: string = 'gateway_error',
    readonly status = 502,
    readonly raw?: unknown,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}
