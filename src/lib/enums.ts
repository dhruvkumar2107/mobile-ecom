/**
 * Central enum-ish unions. SQLite can't express enums, so these are the
 * single source of truth for every status column in prisma/schema.prisma.
 * Keep the string literals in sync with the schema comments.
 */

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Forward-only lifecycle. Terminal states have no successors. */
export const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'returned'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'cyan' },
  packed: { label: 'Packed', tone: 'cyan' },
  shipped: { label: 'Shipped', tone: 'violet' },
  out_for_delivery: { label: 'Out for delivery', tone: 'violet' },
  delivered: { label: 'Delivered', tone: 'emerald' },
  cancelled: { label: 'Cancelled', tone: 'rose' },
  returned: { label: 'Returned', tone: 'rose' },
};

export type Tone = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';

export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'partially_paid',
  'failed',
  'refunded',
  'partially_refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  paid: { label: 'Paid', tone: 'emerald' },
  partially_paid: { label: 'Partially paid', tone: 'amber' },
  failed: { label: 'Failed', tone: 'rose' },
  refunded: { label: 'Refunded', tone: 'slate' },
  partially_refunded: { label: 'Partly refunded', tone: 'slate' },
};

/**
 * `wallet` is a third-party wallet at the gateway (Paytm, PhonePe, Amazon Pay).
 * `wallet_full` is OUR wallet covering 100% of the order, which needs no gateway
 * call at all. A partial wallet payment is not a method — it's `walletAppliedPaise`
 * on the order alongside whichever method collects the remainder.
 */
export const PAYMENT_METHODS = [
  'cod',
  'card',
  'upi',
  'netbanking',
  'wallet',
  'emi',
  'wallet_full',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
  card: 'Credit / Debit Card',
  upi: 'UPI',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
  emi: 'EMI / Pay Later',
  wallet_full: 'VOLTAGE Wallet',
};

/** Methods that need a gateway round-trip before an order can be confirmed. */
export const ONLINE_PAYMENT_METHODS: PaymentMethod[] = [
  'card',
  'upi',
  'netbanking',
  'wallet',
  'emi',
];

export const PAYMENT_ATTEMPT_STATUSES = [
  'created',
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded',
] as const;
export type PaymentAttemptStatus = (typeof PAYMENT_ATTEMPT_STATUSES)[number];

// ── Wallet ────────────────────────────────────────────────────────────
export const WALLET_TXN_TYPES = [
  'referral_commission',
  'cashback',
  'refund',
  'order_payment',
  'withdrawal',
  'adjustment',
  'reversal',
  'signup_bonus',
] as const;
export type WalletTxnType = (typeof WALLET_TXN_TYPES)[number];

export const WALLET_TXN_META: Record<WalletTxnType, { label: string; tone: Tone }> = {
  referral_commission: { label: 'Referral commission', tone: 'cyan' },
  cashback: { label: 'Cashback', tone: 'emerald' },
  refund: { label: 'Refund', tone: 'violet' },
  order_payment: { label: 'Order payment', tone: 'slate' },
  withdrawal: { label: 'Withdrawal', tone: 'amber' },
  adjustment: { label: 'Manual adjustment', tone: 'slate' },
  reversal: { label: 'Reversal', tone: 'rose' },
  signup_bonus: { label: 'Signup bonus', tone: 'emerald' },
};

export const WALLET_TXN_STATUSES = [
  'pending',
  'available',
  'processing',
  'completed',
  'failed',
  'reversed',
] as const;
export type WalletTxnStatus = (typeof WALLET_TXN_STATUSES)[number];

// ── Withdrawals & payouts ─────────────────────────────────────────────
export const WITHDRAWAL_STATUSES = [
  'requested',
  'approved',
  'rejected',
  'processing',
  'completed',
  'failed',
  'cancelled',
] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const WITHDRAWAL_STATUS_META: Record<WithdrawalStatus, { label: string; tone: Tone }> = {
  requested: { label: 'Awaiting approval', tone: 'amber' },
  approved: { label: 'Approved', tone: 'cyan' },
  rejected: { label: 'Rejected', tone: 'rose' },
  processing: { label: 'Processing', tone: 'violet' },
  completed: { label: 'Paid out', tone: 'emerald' },
  failed: { label: 'Failed', tone: 'rose' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
};

export const PAYOUT_STATUSES = [
  'created',
  'queued',
  'processing',
  'processed',
  'reversed',
  'failed',
  'cancelled',
] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

/** Payout provider states that mean "money definitively left the building". */
export const PAYOUT_TERMINAL_SUCCESS: PayoutStatus[] = ['processed'];
export const PAYOUT_TERMINAL_FAILURE: PayoutStatus[] = ['failed', 'reversed', 'cancelled'];

// ── Bank verification ─────────────────────────────────────────────────
export const VERIFICATION_STATUSES = ['unverified', 'pending', 'verified', 'failed'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_STATUS_META: Record<VerificationStatus, { label: string; tone: Tone }> = {
  unverified: { label: 'Not verified', tone: 'slate' },
  pending: { label: 'Verification in progress', tone: 'amber' },
  verified: { label: 'Verified', tone: 'emerald' },
  failed: { label: 'Verification failed', tone: 'rose' },
};

// ── Referral ──────────────────────────────────────────────────────────
export const REFERRAL_STATUSES = ['invited', 'signed_up', 'converted'] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_STATUS_META: Record<ReferralStatus, { label: string; tone: Tone }> = {
  invited: { label: 'Invited', tone: 'slate' },
  signed_up: { label: 'Signed up', tone: 'cyan' },
  converted: { label: 'Converted', tone: 'emerald' },
};

export const COMMISSION_STATUSES = [
  'pending',
  'held',
  'unlocked',
  'paid',
  'reversed',
  'rejected',
] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const COMMISSION_STATUS_META: Record<CommissionStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  held: { label: 'On hold', tone: 'amber' },
  unlocked: { label: 'Withdrawable', tone: 'emerald' },
  paid: { label: 'Paid out', tone: 'cyan' },
  reversed: { label: 'Reversed', tone: 'rose' },
  rejected: { label: 'Rejected', tone: 'rose' },
};

export const FRAUD_FLAGS = {
  SELF_REFERRAL: 'self_referral',
  SAME_IP: 'same_ip',
  SAME_DEVICE: 'same_device',
  DISPOSABLE_EMAIL: 'disposable_email',
  VELOCITY: 'referrer_velocity',
  BELOW_MIN_ORDER: 'below_min_order',
} as const;
export type FraudFlag = (typeof FRAUD_FLAGS)[keyof typeof FRAUD_FLAGS];

export const FRAUD_FLAG_LABEL: Record<FraudFlag, string> = {
  self_referral: 'Self-referral attempt',
  same_ip: 'Same IP as referrer',
  same_device: 'Same device as referrer',
  disposable_email: 'Disposable email domain',
  referrer_velocity: 'Unusual signup velocity',
  below_min_order: 'Order below commission minimum',
};

// ── Service / RMA ─────────────────────────────────────────────────────
export const SERVICE_STATUSES = [
  'requested',
  'approved',
  'rejected',
  'pickup_scheduled',
  'received',
  'diagnosing',
  'awaiting_parts',
  'repairing',
  'repaired',
  'replaced',
  'shipped_back',
  'closed',
  'cancelled',
] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const SERVICE_STATUS_META: Record<ServiceStatus, { label: string; tone: Tone }> = {
  requested: { label: 'Requested', tone: 'amber' },
  approved: { label: 'Approved', tone: 'cyan' },
  rejected: { label: 'Rejected', tone: 'rose' },
  pickup_scheduled: { label: 'Pickup scheduled', tone: 'cyan' },
  received: { label: 'Device received', tone: 'violet' },
  diagnosing: { label: 'Diagnosing', tone: 'violet' },
  awaiting_parts: { label: 'Awaiting parts', tone: 'amber' },
  repairing: { label: 'Under repair', tone: 'violet' },
  repaired: { label: 'Repaired', tone: 'emerald' },
  replaced: { label: 'Replaced', tone: 'emerald' },
  shipped_back: { label: 'Shipped back', tone: 'cyan' },
  closed: { label: 'Closed', tone: 'slate' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
};

export const SERVICE_TYPES = ['repair', 'replacement', 'return', 'inspection'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

// ── Reviews ───────────────────────────────────────────────────────────
export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

// ── Loyalty ───────────────────────────────────────────────────────────
export const LOYALTY_TIERS = ['silver', 'gold', 'platinum', 'titanium'] as const;
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

export const LOYALTY_TIER_META: Record<
  LoyaltyTier,
  { label: string; minSpendPaise: number; rewardRateBps: number; accent: string }
> = {
  silver: { label: 'Silver', minSpendPaise: 0, rewardRateBps: 50, accent: '#94a3b8' },
  gold: { label: 'Gold', minSpendPaise: 5000000, rewardRateBps: 100, accent: '#fbbf24' },
  platinum: { label: 'Platinum', minSpendPaise: 15000000, rewardRateBps: 150, accent: '#22d3ee' },
  titanium: { label: 'Titanium', minSpendPaise: 40000000, rewardRateBps: 250, accent: '#a78bfa' },
};

// ── Purchase orders / inventory ───────────────────────────────────────
export const PO_STATUSES = [
  'draft',
  'sent',
  'partially_received',
  'received',
  'cancelled',
] as const;
export type PoStatus = (typeof PO_STATUSES)[number];

export const STOCK_MOVEMENT_TYPES = [
  'inbound',
  'outbound',
  'transfer',
  'adjustment',
  'return',
  'damage',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];
