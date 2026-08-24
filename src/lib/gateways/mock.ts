import { createHmac } from 'node:crypto';
import type {
  CreatePaymentOrderInput,
  CreatePayoutInput,
  IfscDetails,
  PaymentGateway,
  PaymentOrder,
  PaymentSnapshot,
  PaymentVerifyInput,
  PayoutGateway,
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
 *  MOCK DRIVER — a simulator, not a stub.
 * ════════════════════════════════════════════════════════════════════════
 *
 * Design constraint: it must behave like an asynchronous third party across
 * process restarts and Next.js hot reloads, without a state table.
 *
 * Solution: every reference id it mints is a signed, self-describing token that
 * carries the eventual outcome and the wall-clock time at which the operation
 * "settles". `fetch*` then decides pending-vs-settled by comparing that
 * embedded deadline against `Date.now()`. So a penny-drop really does return
 * `pending` on the first poll and `completed` a few seconds later, and a server
 * restart mid-verification doesn't lose the operation.
 *
 * Tokens are HMAC-signed with AUTH_SECRET, so a client cannot forge a
 * "completed" reference — the same trust boundary a real gateway enforces.
 *
 * ── Deterministic test triggers ──────────────────────────────────────
 *  Bank account number ending …
 *    0000 → verification FAILS (account does not exist)
 *    1111 → completes, name belongs to someone else   (score ≈ 0 → fail)
 *    2222 → completes, partial/abbreviated name       (score ≈ 0.6 → review)
 *    9999 → verification passes but PAYOUTS fail at the bank
 *    else → completes with an exact name match
 *  VPA containing "fail" → VPA validation fails.
 */

const SETTLE_MS = {
  pennyDrop: 6_000,
  vpa: 2_500,
  payout: 8_000,
} as const;

function key(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new GatewayError('AUTH_SECRET is required for the mock driver', 'config');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', key()).update(payload).digest('hex').slice(0, 16);
}

function encode(prefix: string, data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  const b64 = Buffer.from(json, 'utf8').toString('base64url');
  return `${prefix}_${b64}.${sign(b64)}`;
}

function decode<T>(ref: string, prefix: string): T {
  const withoutPrefix = ref.startsWith(`${prefix}_`) ? ref.slice(prefix.length + 1) : '';
  const [b64, sig] = withoutPrefix.split('.');
  if (!b64 || !sig) throw new GatewayError(`Malformed ${prefix} reference`, 'bad_reference', 400);
  if (sign(b64) !== sig) {
    throw new GatewayError(`Tampered ${prefix} reference`, 'signature_mismatch', 400);
  }
  return JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as T;
}

/** Mirrors the ₹1 debit + name read-back a real penny drop performs. */
function pennyDropOutcome(accountNumber: string, submittedName: string) {
  const tail = accountNumber.slice(-4);
  switch (tail) {
    case '0000':
      return {
        outcome: 'failed' as const,
        registeredName: null,
        accountStatus: 'invalid' as const,
        code: 'BAD_ACCOUNT_NUMBER',
        message: 'The beneficiary account could not be located at the bank.',
      };
    case '1111':
      return {
        outcome: 'completed' as const,
        registeredName: 'SUNITA RAMESH IYER',
        accountStatus: 'active' as const,
        code: 'SUCCESS',
        message: 'Account is active. Name on record differs from the name submitted.',
      };
    case '2222': {
      // Abbreviated form of the submitted name — lands in the review band.
      const parts = submittedName.trim().split(/\s+/);
      const abbreviated = [parts[0]?.[0] ?? 'X', ...parts.slice(1, 2)].join(' ').toUpperCase();
      return {
        outcome: 'completed' as const,
        registeredName: abbreviated || 'A KUMAR',
        accountStatus: 'active' as const,
        code: 'SUCCESS',
        message: 'Account is active. Bank holds an abbreviated name.',
      };
    }
    default:
      return {
        outcome: 'completed' as const,
        registeredName: submittedName.toUpperCase(),
        accountStatus: 'active' as const,
        code: 'SUCCESS',
        message: 'Account is active and the beneficiary name matches.',
      };
  }
}

type FavToken = {
  n: string | null; // registered name
  a: string; // account status
  c: string; // response code
  m: string; // message
  o: 'completed' | 'failed';
  r: number; // settles at (epoch ms)
  s: string; // submitted name (to score against)
  amt: number;
};

type PayoutToken = {
  o: 'processed' | 'failed';
  r: number;
  amt: number;
  mode: string;
  utr: string | null;
  fail: string | null;
  fee: number;
  tax: number;
};

type PaymentToken = { amt: number; o: 'captured' | 'failed'; m: string; label: string };

// ── Payments ──────────────────────────────────────────────────────────

export class MockPaymentGateway implements PaymentGateway {
  readonly name = 'mock' as const;
  readonly isLive = false;

  async createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder> {
    if (input.amountPaise < 100) {
      throw new GatewayError('Amount must be at least ₹1.', 'amount_too_small', 400);
    }
    return {
      gatewayOrderId: encode('order_mock', {
        amt: input.amountPaise,
        rcpt: input.receipt,
        at: Date.now(),
      }),
      amountPaise: input.amountPaise,
      currency: 'INR',
      status: 'created',
      publicKey: '',
      gateway: 'mock',
    };
  }

  /**
   * Same HMAC construction Razorpay uses: sha256("<order_id>|<payment_id>").
   * Exercised for real — the simulated checkout screen calls
   * `mockSignPayment` to produce this, so a forged callback is rejected.
   */
  async verifyPaymentSignature({
    gatewayOrderId,
    gatewayPaymentId,
    signature,
  }: PaymentVerifyInput): Promise<boolean> {
    return mockSignPayment(gatewayOrderId, gatewayPaymentId) === signature;
  }

  async fetchPayment(gatewayPaymentId: string): Promise<PaymentSnapshot> {
    const t = decode<PaymentToken>(gatewayPaymentId, 'pay_mock');
    const failed = t.o === 'failed';
    return {
      gatewayPaymentId,
      status: failed ? 'failed' : 'captured',
      amountPaise: t.amt,
      method: t.m,
      instrumentLabel: t.label,
      errorCode: failed ? 'BAD_REQUEST_ERROR' : null,
      errorDescription: failed
        ? 'Payment was declined by the issuing bank. Please try a different method.'
        : null,
      raw: { simulated: true, ...t },
    };
  }

  async capturePayment(gatewayPaymentId: string): Promise<PaymentSnapshot> {
    return this.fetchPayment(gatewayPaymentId);
  }

  async refund(input: RefundInput): Promise<RefundSnapshot> {
    const t = decode<PaymentToken>(input.gatewayPaymentId, 'pay_mock');
    if (input.amountPaise > t.amt) {
      throw new GatewayError('Refund exceeds the captured amount.', 'refund_too_large', 400);
    }
    return {
      gatewayRefundId: encode('rfnd_mock', { amt: input.amountPaise, at: Date.now() }),
      // Instant on the mock; real gateways settle over 5–7 working days.
      status: 'completed',
      amountPaise: input.amountPaise,
      raw: { simulated: true, speed: input.speed ?? 'normal' },
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    return createHmac('sha256', key()).update(rawBody).digest('hex') === signature;
  }
}

/** Used by the simulated checkout screen to mint a legitimate callback. */
export function mockSignPayment(orderId: string, paymentId: string): string {
  return createHmac('sha256', key()).update(`${orderId}|${paymentId}`).digest('hex');
}

/** Mints the payment id the simulated checkout returns. */
export function mockPaymentId(opts: {
  amountPaise: number;
  method: string;
  outcome: 'captured' | 'failed';
  instrumentLabel: string;
}): string {
  return encode('pay_mock', {
    amt: opts.amountPaise,
    o: opts.outcome,
    m: opts.method,
    label: opts.instrumentLabel,
  });
}

export function mockOrderAmount(gatewayOrderId: string): number {
  return decode<{ amt: number }>(gatewayOrderId, 'order_mock').amt;
}

export function mockWebhookSignature(rawBody: string): string {
  return createHmac('sha256', key()).update(rawBody).digest('hex');
}

// ── Payouts ───────────────────────────────────────────────────────────

export class MockPayoutGateway implements PayoutGateway {
  readonly name = 'mock' as const;
  readonly isLive = false;

  async createPayout(input: CreatePayoutInput): Promise<PayoutSnapshot> {
    const { destination, amountPaise, mode } = input;
    if (amountPaise < 100) {
      throw new GatewayError('Payout must be at least ₹1.', 'amount_too_small', 400);
    }

    const acct = destination.type === 'bank' ? destination.accountNumber : destination.vpa;
    const willFail =
      (destination.type === 'bank' && destination.accountNumber.endsWith('9999')) ||
      (destination.type === 'bank' && destination.ifsc.toUpperCase().startsWith('FAIL')) ||
      (destination.type === 'vpa' && destination.vpa.toLowerCase().includes('fail'));

    // Mirrors RazorpayX pricing: ₹5 + 18% GST per IMPS/UPI transfer.
    const fee = willFail ? 0 : 500;
    const tax = willFail ? 0 : Math.round(fee * 0.18);

    const token = encode('pout_mock', {
      o: willFail ? 'failed' : 'processed',
      r: Date.now() + SETTLE_MS.payout,
      amt: amountPaise,
      mode,
      utr: willFail ? null : `MOCKUTR${String(Math.abs(hash(acct)) % 1e9).padStart(9, '0')}`,
      fail: willFail ? 'Beneficiary account is frozen or invalid (bank response: R03).' : null,
      fee,
      tax,
    } satisfies PayoutToken);

    return {
      providerPayoutId: token,
      status: 'queued',
      amountPaise,
      feePaise: fee,
      taxPaise: tax,
      mode,
      utr: null,
      failureReason: null,
      raw: { simulated: true, reference_id: input.referenceId, settles_in_ms: SETTLE_MS.payout },
    };
  }

  async fetchPayout(providerPayoutId: string): Promise<PayoutSnapshot> {
    const t = decode<PayoutToken>(providerPayoutId, 'pout_mock');
    const now = Date.now();
    const elapsed = now - (t.r - SETTLE_MS.payout);

    let status: PayoutSnapshot['status'];
    if (now < t.r) status = elapsed > SETTLE_MS.payout / 2 ? 'processing' : 'queued';
    else status = t.o;

    const settled = now >= t.r;
    return {
      providerPayoutId,
      status,
      amountPaise: t.amt,
      feePaise: t.fee,
      taxPaise: t.tax,
      mode: t.mode as PayoutSnapshot['mode'],
      utr: settled && t.o === 'processed' ? t.utr : null,
      failureReason: settled && t.o === 'failed' ? t.fail : null,
      raw: { simulated: true, settles_at: new Date(t.r).toISOString() },
    };
  }

  async fetchBalancePaise(): Promise<number | null> {
    // A generous simulated float so payout testing isn't blocked on balance.
    return 500_000_00;
  }
}

// ── Verification (penny drop) ─────────────────────────────────────────

export class MockVerificationGateway implements VerificationGateway {
  readonly name = 'mock' as const;
  readonly isLive = false;

  async startPennyDrop(input: PennyDropInput): Promise<VerificationSnapshot> {
    const digits = input.accountNumber.replace(/\D/g, '');
    if (digits.length < 6) {
      throw new GatewayError('Account number looks invalid.', 'invalid_account', 400);
    }

    const o = pennyDropOutcome(digits, input.accountHolder);
    const settlesAt = Date.now() + SETTLE_MS.pennyDrop;

    const ref = encode('fav_mock', {
      n: o.registeredName,
      a: o.accountStatus,
      c: o.code,
      m: o.message,
      o: o.outcome,
      r: settlesAt,
      s: input.accountHolder,
      amt: 100,
    } satisfies FavToken);

    // Real providers accept the request and settle later — so do we.
    return {
      providerRefId: ref,
      status: 'pending',
      registeredName: null,
      nameMatchScore: null,
      accountStatus: null,
      responseCode: null,
      message: 'Penny drop initiated. ₹1 is being credited to validate the account.',
      amountPaise: 100,
      raw: { simulated: true, settles_in_ms: SETTLE_MS.pennyDrop },
    };
  }

  async fetchVerification(providerRefId: string): Promise<VerificationSnapshot> {
    const t = decode<FavToken>(providerRefId, 'fav_mock');

    if (Date.now() < t.r) {
      return {
        providerRefId,
        status: 'pending',
        registeredName: null,
        nameMatchScore: null,
        accountStatus: null,
        responseCode: null,
        message: 'Awaiting confirmation from the beneficiary bank.',
        amountPaise: t.amt,
        raw: { simulated: true, settles_at: new Date(t.r).toISOString() },
      };
    }

    const score = t.n ? nameMatchScore(t.s, t.n) : null;
    return {
      providerRefId,
      status: t.o,
      registeredName: t.n,
      nameMatchScore: score,
      accountStatus: t.a as 'active' | 'invalid',
      responseCode: t.c,
      message: t.m,
      amountPaise: t.amt,
      raw: { simulated: true, settled: true },
    };
  }

  async validateVpa(input: VpaValidateInput): Promise<VerificationSnapshot> {
    const bad = input.vpa.toLowerCase().includes('fail');
    // UPI handle validation is near-instant in practice.
    const settlesAt = Date.now() + SETTLE_MS.vpa;
    const name = bad ? null : input.accountHolder.toUpperCase();

    const ref = encode('fav_mock', {
      n: name,
      a: bad ? 'invalid' : 'active',
      c: bad ? 'INVALID_VPA' : 'SUCCESS',
      m: bad
        ? 'This UPI ID could not be resolved at the payment service provider.'
        : 'UPI ID resolved successfully.',
      o: bad ? 'failed' : 'completed',
      r: settlesAt,
      s: input.accountHolder,
      amt: 0,
    } satisfies FavToken);

    return {
      providerRefId: ref,
      status: 'pending',
      registeredName: null,
      nameMatchScore: null,
      accountStatus: null,
      responseCode: null,
      message: 'Resolving UPI ID…',
      amountPaise: 0,
      raw: { simulated: true, settles_in_ms: SETTLE_MS.vpa },
    };
  }

  async lookupIfsc(ifsc: string): Promise<IfscDetails> {
    const code = ifsc.toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) return null;
    const bank = MOCK_BANKS[code.slice(0, 4)];
    if (!bank) return null;
    const city = MOCK_CITIES[Math.abs(hash(code)) % MOCK_CITIES.length]!;
    return {
      ifsc: code,
      bank: bank.name,
      branch: `${city} — ${code.slice(-3)} Branch`,
      city,
      state: MOCK_STATE_OF[city] ?? 'Maharashtra',
      supportsImps: true,
      supportsUpi: true,
    };
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

const MOCK_BANKS: Record<string, { name: string }> = {
  HDFC: { name: 'HDFC Bank' },
  ICIC: { name: 'ICICI Bank' },
  SBIN: { name: 'State Bank of India' },
  UTIB: { name: 'Axis Bank' },
  KKBK: { name: 'Kotak Mahindra Bank' },
  PUNB: { name: 'Punjab National Bank' },
  YESB: { name: 'Yes Bank' },
  IDFB: { name: 'IDFC FIRST Bank' },
  BARB: { name: 'Bank of Baroda' },
  INDB: { name: 'IndusInd Bank' },
  CNRB: { name: 'Canara Bank' },
  FDRL: { name: 'Federal Bank' },
  FAIL: { name: 'Testcase Failure Bank' },
};

const MOCK_CITIES = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Ahmedabad'];
const MOCK_STATE_OF: Record<string, string> = {
  Mumbai: 'Maharashtra',
  Pune: 'Maharashtra',
  Bengaluru: 'Karnataka',
  Delhi: 'Delhi',
  Hyderabad: 'Telangana',
  Chennai: 'Tamil Nadu',
  Ahmedabad: 'Gujarat',
};
