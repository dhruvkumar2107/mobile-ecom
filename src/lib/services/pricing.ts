import 'server-only';

import type { Prisma } from '@prisma/client';
import { db } from '../db';
import { AppError } from '../api';
import { bpsOf, discountPercent, percentOf, splitEvenly } from '../money';
import { parseJson } from '../utils';
import { LOYALTY_TIER_META, LOYALTY_TIERS } from '../enums';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  PRICING ENGINE
 * ════════════════════════════════════════════════════════════════════════
 *  One authoritative price per variant, computed in a fixed order so the
 *  storefront, the cart and the invoice can never disagree:
 *
 *    1. variant base price (falls back to the product anchor)
 *    2. live flash sale         — absolute price, wins outright if lower
 *    3. pricing rules           — highest-priority match, then best discount
 *    4. loyalty tier bonus      — small extra % for higher tiers
 *
 *  Coupons are deliberately NOT part of this: they apply to the cart total,
 *  not per-line, so they live in the cart/checkout quote instead.
 */

// ── Effective variant price ───────────────────────────────────────────

export type PriceContext = {
  brandId: string;
  categoryId: string;
  productId: string;
  variantId: string;
  quantity?: number;
  loyaltyTier?: string | null;
};

export type PricedResult = {
  mrpPaise: number;
  pricePaise: number;
  /** What the customer actually pays after every rule. */
  finalPaise: number;
  discountPaise: number;
  discountPercent: number;
  appliedRule: { id: string; name: string; kind: 'flash_sale' | 'pricing_rule' | 'loyalty' } | null;
  flashSale: { id: string; name: string; endsAt: Date; remaining: number | null; salePricePaise: number } | null;
};

type RuleConditions = {
  minQty?: number;
  loyaltyTier?: string;
  maxQty?: number;
};

/** Loads everything the resolver needs once, so a listing page isn't N+1. */
export async function loadPricingContext() {
  const now = new Date();
  const [rules, flashItems] = await Promise.all([
    db.pricingRule.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { priority: 'desc' },
    }),
    db.flashSaleItem.findMany({
      where: {
        flashSale: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      },
      include: { flashSale: { select: { id: true, name: true, endsAt: true } } },
    }),
  ]);

  const flashByVariant = new Map<string, (typeof flashItems)[number]>();
  for (const item of flashItems) {
    // A variant in two overlapping sales gets the cheaper one.
    const existing = flashByVariant.get(item.variantId);
    if (!existing || item.salePricePaise < existing.salePricePaise) {
      flashByVariant.set(item.variantId, item);
    }
  }

  return { rules, flashByVariant, now };
}

export type PricingContextData = Awaited<ReturnType<typeof loadPricingContext>>;

function ruleMatches(
  rule: { scope: string; targetId: string | null; conditions: string },
  ctx: PriceContext,
): boolean {
  const target =
    rule.scope === 'global'
      ? true
      : rule.scope === 'brand'
        ? rule.targetId === ctx.brandId
        : rule.scope === 'category'
          ? rule.targetId === ctx.categoryId
          : rule.scope === 'product'
            ? rule.targetId === ctx.productId
            : rule.scope === 'variant'
              ? rule.targetId === ctx.variantId
              : false;
  if (!target) return false;

  const cond = parseJson<RuleConditions>(rule.conditions, {});
  const qty = ctx.quantity ?? 1;
  if (cond.minQty && qty < cond.minQty) return false;
  if (cond.maxQty && qty > cond.maxQty) return false;
  if (cond.loyaltyTier && cond.loyaltyTier !== ctx.loyaltyTier) return false;
  return true;
}

function applyDiscount(
  base: number,
  rule: { discountType: string; value: number; maxDiscountPaise: number | null },
): number {
  if (rule.discountType === 'fixed_price') return Math.min(base, Math.max(0, rule.value));
  const raw = rule.discountType === 'percent' ? percentOf(base, rule.value) : rule.value;
  const capped = rule.maxDiscountPaise ? Math.min(raw, rule.maxDiscountPaise) : raw;
  return Math.max(0, base - capped);
}

/**
 * Bonus discount for loyalty tiers, in basis points. Derived from the tier
 * table rather than restated here — a second copy of these numbers drifts, and
 * a tier that silently maps to no discount is a bug nobody notices until a
 * customer asks why their Titanium benefit never applied.
 */
const TIER_BONUS_BPS: Record<string, number> = Object.fromEntries(
  LOYALTY_TIERS.map((t) => [t, LOYALTY_TIER_META[t].rewardRateBps]),
);

export function resolvePrice(
  variant: { mrpPaise: number; pricePaise: number },
  ctx: PriceContext,
  data: PricingContextData,
): PricedResult {
  const mrp = variant.mrpPaise;
  const base = variant.pricePaise;

  let best = base;
  let applied: PricedResult['appliedRule'] = null;
  let flash: PricedResult['flashSale'] = null;

  const flashItem = data.flashByVariant.get(ctx.variantId);
  if (flashItem) {
    const capReached =
      flashItem.quantityCap > 0 && flashItem.soldCount >= flashItem.quantityCap;
    if (!capReached) {
      flash = {
        id: flashItem.flashSale.id,
        name: flashItem.flashSale.name,
        endsAt: flashItem.flashSale.endsAt,
        remaining: flashItem.quantityCap > 0 ? flashItem.quantityCap - flashItem.soldCount : null,
        salePricePaise: flashItem.salePricePaise,
      };
      if (flashItem.salePricePaise < best) {
        best = flashItem.salePricePaise;
        applied = { id: flashItem.flashSale.id, name: flashItem.flashSale.name, kind: 'flash_sale' };
      }
    }
  }

  // Rules are pre-sorted by priority; the first matching priority band wins,
  // and within it we take the deepest discount.
  const matching = data.rules.filter((r) => ruleMatches(r, ctx));
  if (matching.length) {
    const topPriority = matching[0].priority;
    for (const rule of matching.filter((r) => r.priority === topPriority)) {
      const candidate = applyDiscount(base, rule);
      if (candidate < best) {
        best = candidate;
        applied = { id: rule.id, name: rule.name, kind: 'pricing_rule' };
      }
    }
  }

  const tierBps = ctx.loyaltyTier ? (TIER_BONUS_BPS[ctx.loyaltyTier] ?? 0) : 0;
  if (tierBps > 0) {
    const bonus = bpsOf(best, tierBps);
    if (bonus > 0) {
      best -= bonus;
      if (!applied) applied = { id: 'loyalty', name: 'Loyalty tier benefit', kind: 'loyalty' };
    }
  }

  const finalPaise = Math.max(0, Math.min(best, mrp));

  return {
    mrpPaise: mrp,
    pricePaise: base,
    finalPaise,
    discountPaise: mrp - finalPaise,
    discountPercent: discountPercent(mrp, finalPaise),
    appliedRule: applied,
    flashSale: flash,
  };
}

/** Convenience for a single variant when you don't already hold the context. */
export async function priceVariant(variantId: string, loyaltyTier?: string | null) {
  const [variant, data] = await Promise.all([
    db.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { id: true, brandId: true, categoryId: true } } },
    }),
    loadPricingContext(),
  ]);
  if (!variant) throw new AppError('Variant not found.', 404);

  return resolvePrice(
    variant,
    {
      brandId: variant.product.brandId,
      categoryId: variant.product.categoryId,
      productId: variant.productId,
      variantId: variant.id,
      loyaltyTier,
    },
    data,
  );
}

// ── EMI ───────────────────────────────────────────────────────────────

export type EmiOption = {
  planId: string;
  bankName: string;
  bankCode: string;
  tenureMonths: number;
  isNoCost: boolean;
  interestBps: number;
  monthlyPaise: number;
  totalPayablePaise: number;
  /** Interest the customer pays. Zero on no-cost plans. */
  interestPaise: number;
  processingFeePaise: number;
  /** On a no-cost plan the interest is absorbed as an upfront discount. */
  bankDiscountPaise: number;
  instruments: string[];
  schedule: number[];
};

/**
 * Standard reducing-balance EMI.
 *
 *   EMI = P·r·(1+r)^n / ((1+r)^n − 1)     r = monthly rate
 *
 * On a no-cost plan the customer pays exactly P across n months; the interest
 * the bank still charges is discounted off the price upfront, which is how
 * "no-cost EMI" actually works in India — so we surface that as
 * `bankDiscountPaise` rather than pretending the bank lends for free.
 */
export function computeEmi(
  principalPaise: number,
  tenureMonths: number,
  interestBps: number,
  isNoCost: boolean,
  processingFeePaise = 0,
): Omit<EmiOption, 'planId' | 'bankName' | 'bankCode' | 'instruments'> {
  const n = Math.max(1, tenureMonths);

  if (isNoCost || interestBps === 0) {
    const schedule = splitEvenly(principalPaise, n);
    const notionalInterest =
      interestBps > 0 ? emiInterestTotal(principalPaise, n, interestBps) : 0;
    return {
      tenureMonths: n,
      isNoCost,
      interestBps,
      monthlyPaise: schedule[0],
      totalPayablePaise: principalPaise + processingFeePaise,
      interestPaise: 0,
      processingFeePaise,
      bankDiscountPaise: notionalInterest,
      schedule,
    };
  }

  const r = interestBps / 10_000 / 12;
  const factor = Math.pow(1 + r, n);
  const monthly = Math.round((principalPaise * r * factor) / (factor - 1));
  const total = monthly * n;

  return {
    tenureMonths: n,
    isNoCost: false,
    interestBps,
    monthlyPaise: monthly,
    totalPayablePaise: total + processingFeePaise,
    interestPaise: total - principalPaise,
    processingFeePaise,
    bankDiscountPaise: 0,
    schedule: Array.from({ length: n }, () => monthly),
  };
}

function emiInterestTotal(principalPaise: number, n: number, interestBps: number): number {
  const r = interestBps / 10_000 / 12;
  const factor = Math.pow(1 + r, n);
  const monthly = Math.round((principalPaise * r * factor) / (factor - 1));
  return Math.max(0, monthly * n - principalPaise);
}

export async function getEmiOptions(
  amountPaise: number,
  opts: { brandId?: string | null } = {},
): Promise<EmiOption[]> {
  const plans = await db.emiPlan.findMany({
    where: {
      isActive: true,
      minOrderPaise: { lte: amountPaise },
      OR: [{ brandId: null }, ...(opts.brandId ? [{ brandId: opts.brandId }] : [])],
    },
    orderBy: [{ sortOrder: 'asc' }, { tenureMonths: 'asc' }],
  });

  return plans.map((p) => ({
    planId: p.id,
    bankName: p.bankName,
    bankCode: p.bankCode,
    instruments: parseJson<string[]>(p.instruments, ['credit']),
    ...computeEmi(amountPaise, p.tenureMonths, p.interestBps, p.isNoCost, p.processingFeePaise),
  }));
}

/** Cheapest monthly instalment available — the "from ₹X/mo" line on a PDP. */
export async function lowestEmi(amountPaise: number, brandId?: string | null) {
  const options = await getEmiOptions(amountPaise, { brandId });
  if (!options.length) return null;
  return options.reduce((lo, o) => (o.monthlyPaise < lo.monthlyPaise ? o : lo));
}

// ── Coupons ───────────────────────────────────────────────────────────

export type CouponTarget = {
  brandIds?: string[];
  categoryIds?: string[];
  productIds?: string[];
};

export type CouponLine = {
  productId: string;
  brandId: string;
  categoryId: string;
  lineTotalPaise: number;
};

export type CouponResult = {
  couponId: string;
  code: string;
  description: string | null;
  discountPaise: number;
  /** Portion of the cart the coupon was allowed to act on. */
  eligiblePaise: number;
  isStackable: boolean;
};

/**
 * Validates a coupon against a cart and returns the discount. Throws with a
 * customer-readable reason on every rejection path, because "invalid coupon"
 * with no explanation is the single most common checkout frustration.
 */
export async function validateCoupon(
  code: string,
  input: { userId: string | null; lines: CouponLine[]; subtotalPaise: number },
): Promise<CouponResult> {
  const coupon = await db.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!coupon || !coupon.isActive) throw new AppError('That coupon code is not valid.', 404);

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new AppError('This coupon is not active yet.');
  }
  if (coupon.endsAt && coupon.endsAt < now) throw new AppError('This coupon has expired.');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('This coupon has been fully redeemed.');
  }

  if (coupon.perUserLimit > 0) {
    if (!input.userId) throw new AppError('Sign in to use this coupon.', 401);
    const used = await db.couponRedemption.count({
      where: { couponId: coupon.id, userId: input.userId },
    });
    if (used >= coupon.perUserLimit) {
      throw new AppError('You have already used this coupon.');
    }
  }

  const target = parseJson<CouponTarget>(coupon.appliesTo, {});
  const restricted =
    (target.brandIds?.length ?? 0) +
      (target.categoryIds?.length ?? 0) +
      (target.productIds?.length ?? 0) >
    0;

  const eligibleLines = restricted
    ? input.lines.filter(
        (l) =>
          target.brandIds?.includes(l.brandId) ||
          target.categoryIds?.includes(l.categoryId) ||
          target.productIds?.includes(l.productId),
      )
    : input.lines;

  const eligiblePaise = eligibleLines.reduce((s, l) => s + l.lineTotalPaise, 0);
  if (eligiblePaise === 0) {
    throw new AppError('This coupon does not apply to anything in your cart.');
  }
  if (input.subtotalPaise < coupon.minOrderPaise) {
    throw new AppError(
      `Add ₹${Math.ceil((coupon.minOrderPaise - input.subtotalPaise) / 100)} more to use this coupon.`,
    );
  }

  const raw =
    coupon.discountType === 'percent' ? percentOf(eligiblePaise, coupon.value) : coupon.value;
  const capped = coupon.maxDiscountPaise ? Math.min(raw, coupon.maxDiscountPaise) : raw;
  const discountPaise = Math.min(capped, eligiblePaise);

  return {
    couponId: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discountPaise,
    eligiblePaise,
    isStackable: coupon.isStackable,
  };
}

/** Records a redemption and bumps the counter. Call inside the order transaction. */
export async function redeemCoupon(
  tx: Prisma.TransactionClient,
  couponId: string,
  userId: string,
  orderId: string,
  discountPaise: number,
) {
  await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
  return tx.couponRedemption.create({
    data: { couponId, userId, orderId, discountPaise },
  });
}

/** Returns a redemption when an order is cancelled before dispatch. */
export async function releaseCoupon(tx: Prisma.TransactionClient, orderId: string) {
  const redemptions = await tx.couponRedemption.findMany({ where: { orderId } });
  for (const r of redemptions) {
    await tx.coupon.update({
      where: { id: r.couponId },
      data: { usedCount: { decrement: 1 } },
    });
  }
  await tx.couponRedemption.deleteMany({ where: { orderId } });
  return redemptions.length;
}

// ── Exchange / trade-in ───────────────────────────────────────────────

export const DEVICE_CONDITIONS = [
  {
    key: 'like_new',
    label: 'Like new',
    multiplierBps: 10_000,
    hint: 'No marks, everything works, box and accessories included',
  },
  {
    key: 'good',
    label: 'Good',
    multiplierBps: 8_000,
    hint: 'Light scuffs, screen and body intact, fully functional',
  },
  {
    key: 'fair',
    label: 'Fair',
    multiplierBps: 5_500,
    hint: 'Visible wear or minor dents, all core functions work',
  },
  {
    key: 'poor',
    label: 'Poor',
    multiplierBps: 3_000,
    hint: 'Heavy wear, faded display or weak battery',
  },
] as const;

export type DeviceCondition = (typeof DEVICE_CONDITIONS)[number]['key'];

export type ExchangeAnswers = {
  condition: DeviceCondition;
  screenCracked: boolean;
  powersOn: boolean;
  batteryHealthy: boolean;
  hasOriginalAccessories: boolean;
  underWarranty: boolean;
};

export type ExchangeQuote = {
  deviceId: string;
  brandName: string;
  modelName: string;
  baseValuePaise: number;
  offerPaise: number;
  /** Line-by-line so the customer can see exactly why the number moved. */
  breakdown: { label: string; deltaPaise: number }[];
  /** Quotes are honoured at pickup only if the device matches the answers. */
  expiresAt: Date;
  isEligible: boolean;
  ineligibleReason: string | null;
};

const AGE_DEPRECIATION_BPS_PER_YEAR = 1_200; // 12% a year, floored at 25% of base

/** Deterministic trade-in valuation — same answers always produce the same offer. */
export function quoteExchange(
  device: {
    id: string;
    brandName: string;
    modelName: string;
    baseValuePaise: number;
    launchYear: number | null;
  },
  answers: ExchangeAnswers,
  today = new Date(),
): ExchangeQuote {
  const breakdown: { label: string; deltaPaise: number }[] = [];

  // A dead device has scrap value only — no point pretending otherwise.
  if (!answers.powersOn) {
    return {
      deviceId: device.id,
      brandName: device.brandName,
      modelName: device.modelName,
      baseValuePaise: device.baseValuePaise,
      offerPaise: 0,
      breakdown: [{ label: 'Device does not power on', deltaPaise: -device.baseValuePaise }],
      expiresAt: new Date(today.getTime() + 7 * 86_400_000),
      isEligible: false,
      ineligibleReason: 'We can only accept devices that switch on and hold a charge.',
    };
  }

  let value = device.baseValuePaise;

  const cond = DEVICE_CONDITIONS.find((c) => c.key === answers.condition) ?? DEVICE_CONDITIONS[1];
  const afterCondition = bpsOf(value, cond.multiplierBps);
  breakdown.push({ label: `Condition — ${cond.label}`, deltaPaise: afterCondition - value });
  value = afterCondition;

  if (device.launchYear) {
    const years = Math.max(0, today.getFullYear() - device.launchYear);
    if (years > 0) {
      const retainBps = Math.max(2_500, 10_000 - years * AGE_DEPRECIATION_BPS_PER_YEAR);
      const afterAge = bpsOf(value, retainBps);
      breakdown.push({
        label: `Age — ${years} year${years > 1 ? 's' : ''} since launch`,
        deltaPaise: afterAge - value,
      });
      value = afterAge;
    }
  }

  const deductions: [boolean, string, number][] = [
    [answers.screenCracked, 'Cracked or damaged screen', 3_500],
    [!answers.batteryHealthy, 'Battery health below 80%', 1_200],
    [!answers.hasOriginalAccessories, 'Missing box or charger', 500],
  ];
  for (const [applies, label, bps] of deductions) {
    if (!applies) continue;
    const cut = bpsOf(value, bps);
    breakdown.push({ label, deltaPaise: -cut });
    value -= cut;
  }

  if (answers.underWarranty) {
    const bump = bpsOf(value, 800);
    breakdown.push({ label: 'Still under manufacturer warranty', deltaPaise: bump });
    value += bump;
  }

  // Round down to a whole rupee so the offer reads cleanly.
  const offerPaise = Math.max(0, Math.floor(value / 100) * 100);

  return {
    deviceId: device.id,
    brandName: device.brandName,
    modelName: device.modelName,
    baseValuePaise: device.baseValuePaise,
    offerPaise,
    breakdown,
    expiresAt: new Date(today.getTime() + 7 * 86_400_000),
    isEligible: offerPaise > 0,
    ineligibleReason: offerPaise > 0 ? null : 'This device no longer has trade-in value.',
  };
}

export async function estimateExchange(deviceId: string, answers: ExchangeAnswers) {
  const device = await db.exchangeDevice.findUnique({ where: { id: deviceId } });
  if (!device || !device.isActive) throw new AppError('That device is not in our exchange list.', 404);
  return quoteExchange(device, answers);
}

// ── Protection plans ──────────────────────────────────────────────────

export type ProtectionOption = {
  id: string;
  name: string;
  tier: string;
  description: string | null;
  durationMonths: number;
  pricePaise: number;
  priceType?: string;
  priceValue?: number;
  coverage: string[];
};

/** Percent-priced plans scale with the device, which is how real ADP is sold. */
export async function getProtectionOptions(
  devicePricePaise: number,
  kind = 'phone',
): Promise<ProtectionOption[]> {
  const plans = await db.protectionPlan.findMany({
    where: { isActive: true, appliesToKind: kind },
    orderBy: { sortOrder: 'asc' },
  });

  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    description: p.description,
    durationMonths: p.durationMonths,
    pricePaise:
      p.priceType === 'percent'
        ? Math.max(9900, Math.round(percentOf(devicePricePaise, p.priceValue) / 100) * 100)
        : p.priceValue,
    priceType: p.priceType,
    priceValue: p.priceValue,
    coverage: parseJson<string[]>(p.coverage, []),
  }));
}

export async function protectionPriceFor(
  planId: string,
  devicePricePaise: number,
): Promise<number> {
  const plan = await db.protectionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw new AppError('That protection plan is unavailable.', 404);
  return plan.priceType === 'percent'
    ? Math.max(9900, Math.round(percentOf(devicePricePaise, plan.priceValue) / 100) * 100)
    : plan.priceValue;
}
