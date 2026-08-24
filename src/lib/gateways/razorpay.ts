import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  CreatePaymentOrderInput,
  CreatePayoutInput,
  IfscDetails,
  PaymentGateway,
  PaymentOrder,
  PaymentSnapshot,
  PaymentVerifyInput,
  PayoutGateway,
  PayoutMode,
  PayoutSnapshot,
  PennyDropInput,
  RefundInput,
  RefundSnapshot,
  VerificationGateway,
  VerificationSnapshot,
  VpaValidateInput,
} from './types';
import { GatewayError } from './types';
import { nameMatchScore } from './name-match';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  RAZORPAY DRIVER — live HTTP
 * ════════════════════════════════════════════════════════════════════════
 *  Payments        POST /v1/orders, /v1/payments/:id/capture, /refund
 *  Payouts (X)     POST /v1/contacts → /v1/fund_accounts → /v1/payouts
 *  Penny drop      POST /v1/fund_accounts/validations
 *  IFSC directory  GET  https://ifsc.razorpay.com/:ifsc   (public, unauthed)
 *
 *  Activated by setting PAYMENT_DRIVER / PAYOUT_DRIVER / VERIFICATION_DRIVER
 *  to "razorpay" and supplying credentials. Payouts additionally require
 *  RAZORPAYX_ACCOUNT_NUMBER — the X account the money debits from.
 */

const API = 'https://api.razorpay.com/v1';
const IFSC_API = 'https://ifsc.razorpay.com';
const TIMEOUT_MS = 20_000;

function creds() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) {
    throw new GatewayError(
      'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to use the razorpay driver.',
      'missing_credentials',
      500,
    );
  }
  return { id, secret };
}

function authHeader(): string {
  const { id, secret } = creds();
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
}

function xAccount(): string {
  const acc = process.env.RAZORPAYX_ACCOUNT_NUMBER;
  if (!acc) {
    throw new GatewayError(
      'RAZORPAYX_ACCOUNT_NUMBER must be set for payouts and fund-account validation.',
      'missing_x_account',
      500,
    );
  }
  return acc;
}

type RzpError = { error?: { code?: string; description?: string; reason?: string } };

async function call<T>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    'Content-Type': 'application/json',
  };
  // Razorpay only honours an idempotency key on payout creation.
  if (init.idempotencyKey) headers['X-Payout-Idempotency'] = init.idempotencyKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new GatewayError(
      aborted
        ? 'Razorpay did not respond in time. The operation may still complete — reconcile before retrying.'
        : 'Could not reach Razorpay.',
      aborted ? 'timeout' : 'network_error',
      504,
      err,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON error page */
  }

  if (!res.ok) {
    const e = (json as RzpError)?.error;
    throw new GatewayError(
      e?.description ?? `Razorpay returned HTTP ${res.status}.`,
      e?.code ?? `http_${res.status}`,
      res.status === 400 ? 400 : 502,
      json ?? text,
    );
  }
  return json as T;
}

// ── Payments ──────────────────────────────────────────────────────────

type RzpOrder = { id: string; amount: number; currency: string; status: string };
type RzpPayment = {
  id: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  amount: number;
  method: string | null;
  card?: { last4?: string; network?: string; issuer?: string } | null;
  vpa?: string | null;
  bank?: string | null;
  wallet?: string | null;
  error_code?: string | null;
  error_description?: string | null;
};
type RzpRefund = { id: string; amount: number; status: 'pending' | 'processed' | 'failed' };

function instrumentLabel(p: RzpPayment): string | null {
  if (p.card?.last4) {
    return `${p.card.issuer ?? p.card.network ?? 'Card'} •••• ${p.card.last4}`;
  }
  if (p.vpa) return p.vpa;
  if (p.bank) return `${p.bank} Net Banking`;
  if (p.wallet) return `${p.wallet} Wallet`;
  return p.method ?? null;
}

export class RazorpayPaymentGateway implements PaymentGateway {
  readonly name = 'razorpay' as const;
  readonly isLive = true;

  async createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder> {
    const order = await call<RzpOrder>('/orders', {
      method: 'POST',
      body: {
        amount: input.amountPaise, // Razorpay is paise-native
        currency: 'INR',
        receipt: input.receipt,
        notes: input.notes ?? {},
        payment_capture: 1,
      },
    });
    return {
      gatewayOrderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      status: order.status,
      publicKey: creds().id,
      gateway: 'razorpay',
    };
  }

  /** HMAC-SHA256("<order_id>|<payment_id>", key_secret), constant-time compared. */
  async verifyPaymentSignature({
    gatewayOrderId,
    gatewayPaymentId,
    signature,
  }: PaymentVerifyInput): Promise<boolean> {
    const expected = createHmac('sha256', creds().secret)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest('hex');
    return safeEqualHex(expected, signature);
  }

  async fetchPayment(id: string): Promise<PaymentSnapshot> {
    const p = await call<RzpPayment>(`/payments/${encodeURIComponent(id)}`);
    return toPaymentSnapshot(p);
  }

  async capturePayment(id: string, amountPaise: number): Promise<PaymentSnapshot> {
    const p = await call<RzpPayment>(`/payments/${encodeURIComponent(id)}/capture`, {
      method: 'POST',
      body: { amount: amountPaise, currency: 'INR' },
    });
    return toPaymentSnapshot(p);
  }

  async refund(input: RefundInput): Promise<RefundSnapshot> {
    const r = await call<RzpRefund>(
      `/payments/${encodeURIComponent(input.gatewayPaymentId)}/refund`,
      {
        method: 'POST',
        body: {
          amount: input.amountPaise,
          speed: input.speed ?? 'normal',
          notes: input.notes ?? {},
        },
      },
    );
    return {
      gatewayRefundId: r.id,
      status: r.status === 'processed' ? 'completed' : r.status === 'failed' ? 'failed' : 'processing',
      amountPaise: r.amount,
      raw: r,
    };
  }

  /** Webhook signature is computed over the RAW body — never re-serialised JSON. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return safeEqualHex(expected, signature);
  }
}

function toPaymentSnapshot(p: RzpPayment): PaymentSnapshot {
  return {
    gatewayPaymentId: p.id,
    status: p.status === 'refunded' ? 'refunded' : p.status,
    amountPaise: p.amount,
    method: p.method ?? null,
    instrumentLabel: instrumentLabel(p),
    errorCode: p.error_code ?? null,
    errorDescription: p.error_description ?? null,
    raw: p,
  };
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b ?? '', 'hex');
  return ab.length === bb.length && ab.length > 0 && timingSafeEqual(ab, bb);
}

// ── Shared RazorpayX helpers ──────────────────────────────────────────

type RzpContact = { id: string };
type RzpFundAccount = { id: string };

async function ensureContact(input: {
  contactId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  userId: string;
}): Promise<string> {
  if (input.contactId) return input.contactId;
  const c = await call<RzpContact>('/contacts', {
    method: 'POST',
    body: {
      name: input.name,
      email: input.email ?? undefined,
      contact: input.phone?.replace(/^\+91/, '') ?? undefined,
      type: 'customer',
      reference_id: input.userId,
    },
  });
  return c.id;
}

async function ensureBankFundAccount(
  contactId: string,
  bank: { accountHolder: string; ifsc: string; accountNumber: string },
  existingId?: string | null,
): Promise<string> {
  if (existingId) return existingId;
  const fa = await call<RzpFundAccount>('/fund_accounts', {
    method: 'POST',
    body: {
      contact_id: contactId,
      account_type: 'bank_account',
      bank_account: {
        name: bank.accountHolder,
        ifsc: bank.ifsc.toUpperCase(),
        account_number: bank.accountNumber,
      },
    },
  });
  return fa.id;
}

async function ensureVpaFundAccount(
  contactId: string,
  vpa: string,
  existingId?: string | null,
): Promise<string> {
  if (existingId) return existingId;
  const fa = await call<RzpFundAccount>('/fund_accounts', {
    method: 'POST',
    body: { contact_id: contactId, account_type: 'vpa', vpa: { address: vpa } },
  });
  return fa.id;
}

// ── Payouts ───────────────────────────────────────────────────────────

type RzpPayout = {
  id: string;
  status: 'queued' | 'pending' | 'rejected' | 'processing' | 'processed' | 'cancelled' | 'reversed' | 'failed';
  amount: number;
  fees?: number;
  tax?: number;
  mode: string;
  utr?: string | null;
  status_details?: { description?: string; reason?: string } | null;
  failure_reason?: string | null;
};

/** Razorpay's vocabulary → ours. `pending` there means awaiting approval. */
function mapPayoutStatus(s: RzpPayout['status']): PayoutSnapshot['status'] {
  switch (s) {
    case 'queued':
      return 'queued';
    case 'pending':
    case 'processing':
      return 'processing';
    case 'processed':
      return 'processed';
    case 'reversed':
      return 'reversed';
    case 'cancelled':
      return 'cancelled';
    case 'rejected':
    case 'failed':
      return 'failed';
    default:
      return 'created';
  }
}

export class RazorpayPayoutGateway implements PayoutGateway {
  readonly name = 'razorpay' as const;
  readonly isLive = true;

  async createPayout(input: CreatePayoutInput): Promise<PayoutSnapshot> {
    const contactId = await ensureContact({
      contactId: input.contactId,
      name: input.contact.name,
      email: input.contact.email,
      phone: input.contact.phone,
      userId: input.contact.userId,
    });

    const fundAccountId =
      input.destination.type === 'bank'
        ? await ensureBankFundAccount(contactId, input.destination, input.fundAccountId)
        : await ensureVpaFundAccount(contactId, input.destination.vpa, input.fundAccountId);

    const mode: PayoutMode = input.destination.type === 'vpa' ? 'UPI' : input.mode;

    const p = await call<RzpPayout>('/payouts', {
      method: 'POST',
      // Idempotency key stops a retried request from paying out twice.
      idempotencyKey: input.referenceId,
      body: {
        account_number: xAccount(),
        fund_account_id: fundAccountId,
        amount: input.amountPaise,
        currency: 'INR',
        mode,
        purpose: 'cashback',
        queue_if_low_balance: true,
        reference_id: input.referenceId,
        narration: (input.narration ?? 'VOLTAGE Payout').slice(0, 30),
      },
    });

    return {
      ...toPayoutSnapshot(p),
      providerContactId: contactId,
      providerFundAccountId: fundAccountId,
    };
  }

  async fetchPayout(id: string): Promise<PayoutSnapshot> {
    return toPayoutSnapshot(await call<RzpPayout>(`/payouts/${encodeURIComponent(id)}`));
  }

  /**
   * RazorpayX exposes balance per virtual account rather than a single global
   * endpoint. Returning null means "unknown" — callers must not treat that as
   * zero and block payouts.
   */
  async fetchBalancePaise(): Promise<number | null> {
    return null;
  }
}

function toPayoutSnapshot(p: RzpPayout): PayoutSnapshot {
  return {
    providerPayoutId: p.id,
    status: mapPayoutStatus(p.status),
    amountPaise: p.amount,
    feePaise: p.fees ?? 0,
    taxPaise: p.tax ?? 0,
    mode: (p.mode as PayoutMode) ?? 'IMPS',
    utr: p.utr ?? null,
    failureReason: p.failure_reason ?? p.status_details?.description ?? p.status_details?.reason ?? null,
    raw: p,
  };
}

// ── Fund Account Validation (penny drop) ──────────────────────────────

type RzpValidation = {
  id: string;
  status: 'created' | 'completed' | 'failed';
  amount: number;
  fund_account?: { id?: string } | null;
  results?: {
    account_status?: 'active' | 'invalid' | null;
    registered_name?: string | null;
    upi?: { name?: string | null } | null;
  } | null;
  error?: { description?: string; code?: string } | null;
};

export class RazorpayVerificationGateway implements VerificationGateway {
  readonly name = 'razorpay' as const;
  readonly isLive = true;

  async startPennyDrop(input: PennyDropInput): Promise<VerificationSnapshot> {
    const contactId = await ensureContact({
      contactId: input.contactId,
      name: input.accountHolder,
      email: input.email,
      phone: input.phone,
      userId: input.userId,
    });
    const fundAccountId = await ensureBankFundAccount(contactId, {
      accountHolder: input.accountHolder,
      ifsc: input.ifsc,
      accountNumber: input.accountNumber,
    });

    const v = await call<RzpValidation>('/fund_accounts/validations', {
      method: 'POST',
      body: {
        account_number: xAccount(),
        fund_account: { id: fundAccountId },
        amount: 100, // ₹1 penny drop
        currency: 'INR',
        notes: { user_id: input.userId },
      },
    });

    return {
      ...toVerificationSnapshot(v, input.accountHolder),
      providerContactId: contactId,
      providerFundAccountId: fundAccountId,
    };
  }

  async fetchVerification(providerRefId: string, submittedName?: string): Promise<VerificationSnapshot> {
    const v = await call<RzpValidation>(
      `/fund_accounts/validations/${encodeURIComponent(providerRefId)}`,
    );
    return toVerificationSnapshot(v, submittedName);
  }

  /**
   * Razorpay validates a VPA through the same validations endpoint with a
   * zero-amount request against a `vpa` fund account.
   */
  async validateVpa(input: VpaValidateInput): Promise<VerificationSnapshot> {
    const contactId = await ensureContact({
      contactId: input.contactId,
      name: input.accountHolder,
      email: input.email,
      phone: input.phone,
      userId: input.userId,
    });
    const fundAccountId = await ensureVpaFundAccount(contactId, input.vpa);

    const v = await call<RzpValidation>('/fund_accounts/validations', {
      method: 'POST',
      body: {
        account_number: xAccount(),
        fund_account: { id: fundAccountId },
        amount: 0,
        currency: 'INR',
        notes: { user_id: input.userId },
      },
    });

    return {
      ...toVerificationSnapshot(v, input.accountHolder),
      providerContactId: contactId,
      providerFundAccountId: fundAccountId,
    };
  }

  async lookupIfsc(ifsc: string): Promise<IfscDetails> {
    const code = ifsc.toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${IFSC_API}/${code}`, {
        signal: controller.signal,
        // The IFSC directory changes rarely; a day of caching is safe.
        next: { revalidate: 86400 },
      });
      if (!res.ok) return null;
      const d = (await res.json()) as Record<string, unknown>;
      return {
        ifsc: code,
        bank: String(d.BANK ?? ''),
        branch: String(d.BRANCH ?? ''),
        city: String(d.CITY ?? ''),
        state: String(d.STATE ?? ''),
        supportsImps: d.IMPS === true,
        supportsUpi: d.UPI === true,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

function toVerificationSnapshot(v: RzpValidation, submittedName?: string): VerificationSnapshot {
  const registered = v.results?.registered_name ?? v.results?.upi?.name ?? null;
  return {
    providerRefId: v.id,
    // `created` is Razorpay's in-flight state — surface it as pending so the
    // caller keeps polling instead of treating it as a terminal result.
    status: v.status === 'created' ? 'pending' : v.status,
    registeredName: registered,
    nameMatchScore: registered && submittedName ? nameMatchScore(submittedName, registered) : null,
    accountStatus: v.results?.account_status ?? null,
    responseCode: v.error?.code ?? (v.status === 'completed' ? 'SUCCESS' : null),
    message:
      v.error?.description ??
      (v.status === 'completed'
        ? 'Account validated by the beneficiary bank.'
        : v.status === 'failed'
          ? 'The bank could not validate this account.'
          : 'Validation in progress.'),
    amountPaise: v.amount ?? 100,
    providerFundAccountId: v.fund_account?.id ?? null,
    raw: v,
  };
}
