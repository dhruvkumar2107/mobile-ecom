import 'server-only';

import { db } from '../db';
import { AppError } from '../api';
import { orderNo } from '../ids';
import { percentOf, splitEvenly } from '../money';
import { addMonths } from '../utils';
import { ONLINE_PAYMENT_METHODS, type PaymentMethod } from '../enums';
import { getCart, type CartView } from './cart';
import {
  estimateExchange,
  getEmiOptions,
  redeemCoupon,
  validateCoupon,
  type CouponResult,
  type EmiOption,
  type ExchangeAnswers,
} from './pricing';
import { reserveStock, type Allocation } from './inventory';
import { checkCodEligibility, quoteShipping } from './serviceability';
import { getSettings } from './settings';
import { debit, getOrCreateWallet, maturePendingCredits } from './wallet';
import { notify, templates } from './notify';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  CHECKOUT
 * ════════════════════════════════════════════════════════════════════════
 *  Two entry points, and the split matters:
 *
 *    quote()      pure read. Prices, shipping, tax, wallet, EMI options and
 *                 every eligibility reason. Called on each checkout render.
 *    placeOrder() one transaction. Re-quotes from scratch, reserves stock,
 *                 debits the wallet, writes the order, converts the cart.
 *
 *  placeOrder never trusts a number the client sent. The browser posts choices
 *  — address, method, coupon code, "use my wallet", the trade-in answers — and
 *  never amounts. The server recomputes every figure and charges that. Even the
 *  exchange credit is re-derived from the answers rather than accepted as a
 *  number, because a client-supplied discount is a client-supplied price.
 *
 *  Money order of operations:
 *
 *    subtotal (post pricing-engine, GST-inclusive)
 *    − coupon discount
 *    − exchange credit
 *    + protection plans
 *    + shipping + COD fee
 *    = payable                            → tax is EXTRACTED from this
 *    − wallet applied
 *    = amount due at the gateway (or on delivery for COD)
 */

export type ExchangeSelection = {
  deviceId: string;
  answers: ExchangeAnswers;
};

export type MethodOption = {
  method: PaymentMethod;
  label: string;
  available: boolean;
  reason: string | null;
};

export type CheckoutQuote = {
  cart: CartView;
  addressId: string | null;
  pincode: string | null;

  subtotalPaise: number;
  couponCode: string | null;
  couponDiscountPaise: number;
  couponError: string | null;
  exchangeCreditPaise: number;
  exchangeLabel: string | null;
  protectionPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  isFreeShipping: boolean;

  /** GST-inclusive amount the customer owes before wallet. */
  payablePaise: number;
  taxablePaise: number;
  taxPaise: number;

  walletBalancePaise: number;
  walletPendingPaise: number;
  /** Most the wallet is allowed to cover on this order, after the admin cap. */
  walletApplicablePaise: number;
  walletAppliedPaise: number;
  amountDuePaise: number;

  totalSavingsPaise: number;
  deliveryDays: number;
  expectedBy: Date | null;
  fulfilmentType: 'standard' | 'express';

  methods: MethodOption[];
  emiOptions: EmiOption[];
  issues: string[];
  canPlace: boolean;
};

export type QuoteInput = {
  userId: string | null;
  cartId: string;
  addressId?: string | null;
  couponCode?: string | null;
  useWallet?: boolean;
  express?: boolean;
  exchange?: ExchangeSelection | null;
  method?: PaymentMethod | null;
  loyaltyTier?: string | null;
};

/** Orders below this cannot be financed — banks won't underwrite the paperwork. */
const EMI_MIN_PAISE = 500_000;

export async function quote(input: QuoteInput): Promise<CheckoutQuote> {
  const settings = await getSettings();
  const cart = await getCart(input.cartId, { loyaltyTier: input.loyaltyTier });

  const issues: string[] = [];
  if (cart.isEmpty) issues.push('Your cart is empty.');
  for (const line of cart.lines) {
    if (line.stockIssue) issues.push(`${line.productName} — ${line.stockIssue.toLowerCase()}`);
  }

  // ── Address ──
  const address = await resolveAddress(input.userId, input.addressId, issues);

  // ── Coupon ──
  let coupon: CouponResult | null = null;
  let couponError: string | null = null;
  const code = input.couponCode ?? cart.couponCode;
  if (code && !cart.isEmpty) {
    try {
      coupon = await validateCoupon(code, {
        userId: input.userId,
        subtotalPaise: cart.subtotalPaise,
        lines: cart.lines.map((l) => ({
          productId: l.productId,
          brandId: l.brandId,
          categoryId: l.categoryId,
          lineTotalPaise: l.lineTotalPaise,
        })),
      });
    } catch (err) {
      couponError = err instanceof Error ? err.message : 'Coupon could not be applied.';
    }
  }
  const couponDiscountPaise = coupon?.discountPaise ?? 0;

  // ── Exchange / trade-in ──
  // Recomputed from the answers, never taken from the request as an amount.
  let exchangeCreditPaise = 0;
  let exchangeLabel: string | null = null;
  if (input.exchange) {
    try {
      const est = await estimateExchange(input.exchange.deviceId, input.exchange.answers);
      if (est.isEligible) {
        exchangeCreditPaise = Math.min(est.offerPaise, cart.subtotalPaise - couponDiscountPaise);
        exchangeLabel = `${est.brandName} ${est.modelName}`;
      } else if (est.ineligibleReason) {
        issues.push(est.ineligibleReason);
      }
    } catch (err) {
      issues.push(err instanceof Error ? err.message : 'Trade-in could not be valued.');
    }
  }

  // ── Shipping ──
  let shippingPaise = 0;
  let codFeePaise = 0;
  let isFreeShipping = false;
  let deliveryDays = 4;
  let expectedBy: Date | null = null;
  let fulfilmentType: 'standard' | 'express' = 'standard';

  if (address && !cart.isEmpty) {
    try {
      const ship = await quoteShipping({
        pincode: address.pincode,
        subtotalPaise: cart.subtotalPaise - couponDiscountPaise,
        express: input.express,
        isCod: input.method === 'cod',
      });
      shippingPaise = ship.shippingPaise;
      codFeePaise = ship.codFeePaise;
      isFreeShipping = ship.isFreeShipping;
      deliveryDays = ship.deliveryDays;
      expectedBy = ship.expectedBy;
      fulfilmentType = ship.fulfilmentType;
    } catch (err) {
      issues.push(err instanceof Error ? err.message : 'We cannot deliver to that pincode.');
    }
  }

  // ── Totals ──
  const payablePaise = Math.max(
    0,
    cart.subtotalPaise -
      couponDiscountPaise -
      exchangeCreditPaise +
      cart.protectionPaise +
      shippingPaise +
      codFeePaise,
  );

  // Storefront prices are GST-inclusive, so tax is extracted, never added on.
  const blendedRate = weightedGstRate(cart);
  const taxablePaise = Math.round((payablePaise * 100) / (100 + blendedRate));
  const taxPaise = payablePaise - taxablePaise;

  // ── Wallet ──
  let walletBalancePaise = 0;
  let walletPendingPaise = 0;
  if (input.userId) {
    // Reading the wallet is also when held commission matures, so a customer
    // who waited out the hold window sees the money on this very screen.
    await maturePendingCredits(input.userId);
    const wallet = await getOrCreateWallet(input.userId);
    walletBalancePaise = wallet.balancePaise;
    walletPendingPaise = wallet.pendingPaise;
  }

  const walletCap = percentOf(payablePaise, settings.walletMaxPercentOnOrder);
  const walletApplicablePaise = Math.min(walletBalancePaise, walletCap, payablePaise);
  const walletAppliedPaise = input.useWallet ? walletApplicablePaise : 0;
  const amountDuePaise = payablePaise - walletAppliedPaise;

  // ── Payment methods ──
  const cod = address
    ? await checkCodEligibility({
        pincode: address.pincode,
        orderTotalPaise: payablePaise,
        userId: input.userId,
      })
    : { allowed: false, reason: 'Add a delivery address first.', limitPaise: 0 };

  // Only reachable when the admin cap allows 100% — otherwise there is always a
  // remainder and the customer still picks a real payment method.
  const walletCoversAll = payablePaise > 0 && walletAppliedPaise >= payablePaise;
  const covered = walletCoversAll ? 'Your wallet covers this order in full.' : null;

  const methods: MethodOption[] = [
    { method: 'upi', label: 'UPI', available: !walletCoversAll, reason: covered },
    { method: 'card', label: 'Credit / debit card', available: !walletCoversAll, reason: covered },
    { method: 'netbanking', label: 'Net banking', available: !walletCoversAll, reason: covered },
    {
      method: 'wallet',
      label: 'Wallets — Paytm, PhonePe, Amazon Pay',
      available: !walletCoversAll,
      reason: covered,
    },
    {
      method: 'emi',
      label: 'EMI & no-cost EMI',
      // EMI finances the amount still owed; a bank won't underwrite a balance
      // our own wallet has already paid down to nothing.
      available: !walletCoversAll && amountDuePaise >= EMI_MIN_PAISE,
      reason:
        covered ??
        (amountDuePaise < EMI_MIN_PAISE
          ? `EMI is available above ₹${EMI_MIN_PAISE / 100}.`
          : null),
    },
    {
      method: 'cod',
      label: 'Cash on delivery',
      available: !walletCoversAll && cod.allowed,
      reason: covered ?? cod.reason,
    },
  ];

  if (walletCoversAll) {
    methods.unshift({
      method: 'wallet_full',
      label: 'VOLTAGE Wallet',
      available: true,
      reason: null,
    });
  }

  const emiOptions =
    amountDuePaise >= EMI_MIN_PAISE ? await getEmiOptions(amountDuePaise) : [];

  if (input.method) {
    const chosen = methods.find((m) => m.method === input.method);
    if (!chosen) issues.push('That payment method is not supported.');
    else if (!chosen.available) {
      issues.push(chosen.reason ?? 'That payment method is unavailable for this order.');
    }
  }

  return {
    cart,
    addressId: address?.id ?? null,
    pincode: address?.pincode ?? null,
    subtotalPaise: cart.subtotalPaise,
    couponCode: coupon?.code ?? null,
    couponDiscountPaise,
    couponError,
    exchangeCreditPaise,
    exchangeLabel,
    protectionPaise: cart.protectionPaise,
    shippingPaise,
    codFeePaise,
    isFreeShipping,
    payablePaise,
    taxablePaise,
    taxPaise,
    walletBalancePaise,
    walletPendingPaise,
    walletApplicablePaise,
    walletAppliedPaise,
    amountDuePaise,
    totalSavingsPaise: cart.savingsPaise + couponDiscountPaise + exchangeCreditPaise,
    deliveryDays,
    expectedBy,
    fulfilmentType,
    methods,
    emiOptions,
    issues,
    canPlace: issues.length === 0 && !cart.isEmpty,
  };
}

type ResolvedAddress = { id: string; pincode: string; state: string };

async function resolveAddress(
  userId: string | null,
  addressId: string | null | undefined,
  issues: string[],
): Promise<ResolvedAddress | null> {
  if (!userId) {
    issues.push('Sign in to place an order.');
    return null;
  }

  const select = { id: true, pincode: true, state: true } as const;

  if (addressId) {
    const found = await db.address.findFirst({
      where: { id: addressId, userId, deletedAt: null },
      select,
    });
    if (found) return found;
    issues.push('That delivery address is no longer available.');
    return null;
  }

  const fallback =
    (await db.address.findFirst({
      where: { userId, deletedAt: null, isDefault: true },
      select,
    })) ??
    (await db.address.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select,
    }));

  if (!fallback) issues.push('Add a delivery address to continue.');
  return fallback;
}

/** Value-weighted average GST rate across the cart. */
function weightedGstRate(cart: CartView): number {
  const total = cart.lines.reduce((s, l) => s + l.lineTotalPaise, 0);
  if (total === 0) return 18;
  return cart.lines.reduce((s, l) => s + l.gstRate * l.lineTotalPaise, 0) / total;
}

// ── Place order ───────────────────────────────────────────────────────

export type PlaceOrderInput = {
  userId: string;
  cartId: string;
  addressId: string;
  method: PaymentMethod;
  couponCode?: string | null;
  useWallet?: boolean;
  express?: boolean;
  exchange?: ExchangeSelection | null;
  emiPlanId?: string | null;
  notes?: string | null;
  ip?: string | null;
  deviceId?: string | null;
  loyaltyTier?: string | null;
};

export type PlaceOrderResult = {
  orderId: string;
  orderNo: string;
  totalPaise: number;
  amountDuePaise: number;
  walletAppliedPaise: number;
  /** COD and wallet-funded orders are final already; the rest need the gateway. */
  requiresPayment: boolean;
  paymentMethod: PaymentMethod;
};

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  // Re-quote outside the write transaction. It's read-only but does a lot of
  // reads, and holding a SQLite write lock across all of it would serialise
  // every other checkout on the site.
  const q = await quote({
    userId: input.userId,
    cartId: input.cartId,
    addressId: input.addressId,
    couponCode: input.couponCode,
    useWallet: input.useWallet,
    express: input.express,
    exchange: input.exchange,
    method: input.method,
    loyaltyTier: input.loyaltyTier,
  });

  if (!q.canPlace) {
    throw new AppError(q.issues[0] ?? 'This order cannot be placed right now.', 409);
  }

  const address = await db.address.findFirst({
    where: { id: input.addressId, userId: input.userId, deletedAt: null },
  });
  if (!address) throw new AppError('Delivery address not found.', 404);

  const walletApplied = q.walletAppliedPaise;
  const amountDue = q.amountDuePaise;
  const isCod = input.method === 'cod';
  const needsGateway = ONLINE_PAYMENT_METHODS.includes(input.method) && amountDue > 0;

  let emiPlan: EmiOption | null = null;
  if (input.method === 'emi') {
    if (!input.emiPlanId) throw new AppError('Choose an EMI plan to continue.');
    const options = await getEmiOptions(amountDue);
    emiPlan = options.find((o) => o.planId === input.emiPlanId) ?? null;
    if (!emiPlan) throw new AppError('That EMI plan is not available for this amount.', 409);
  }

  const order = await db.$transaction(
    async (tx) => {
      // Reserve first. If the last unit went to somebody else a moment ago,
      // nothing else should have happened yet.
      const allocationsByVariant = new Map<string, Allocation[]>();
      for (const line of q.cart.lines) {
        const allocations = await reserveStock(
          tx,
          line.variantId,
          line.quantity,
          `${line.productName} (${line.variantLabel})`,
        );
        allocationsByVariant.set(line.variantId, allocations);
      }

      const created = await tx.order.create({
        data: {
          orderNo: orderNo(),
          userId: input.userId,
          status: 'pending',
          paymentStatus: 'pending',
          fulfilmentType: q.fulfilmentType,
          addressId: address.id,
          // Snapshot, not a join: a customer editing their address later must
          // not rewrite where a past order was actually delivered.
          addressSnapshot: JSON.stringify({
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            altPhone: address.altPhone,
            line1: address.line1,
            line2: address.line2,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country,
          }),
          subtotalPaise: q.subtotalPaise,
          discountPaise: q.cart.savingsPaise,
          couponCode: q.couponCode,
          couponDiscountPaise: q.couponDiscountPaise,
          exchangeCreditPaise: q.exchangeCreditPaise,
          protectionPaise: q.cart.protectionPaise,
          shippingPaise: q.shippingPaise,
          codFeePaise: q.codFeePaise,
          taxablePaise: q.taxablePaise,
          taxPaise: q.taxPaise,
          walletAppliedPaise: walletApplied,
          totalPaise: q.payablePaise,
          amountPaidPaise: walletApplied,
          amountDuePaise: amountDue,
          paymentMethod: input.method,
          emiPlanId: emiPlan?.planId ?? null,
          emiTenure: emiPlan?.tenureMonths ?? null,
          emiMonthlyPaise: emiPlan?.monthlyPaise ?? null,
          expectedDeliveryAt: q.expectedBy,
          ipAddress: input.ip ?? null,
          deviceId: input.deviceId ?? null,
          notes: input.notes ?? null,
          items: {
            create: q.cart.lines.map((line) => {
              const gross = line.lineTotalPaise;
              const taxable = Math.round((gross * 100) / (100 + line.gstRate));
              return {
                variantId: line.variantId,
                productName: line.productName,
                brandName: line.brandName,
                variantLabel: line.variantLabel,
                sku: line.sku,
                imageGradient: line.heroGradient,
                quantity: line.quantity,
                mrpPaise: line.price.mrpPaise,
                unitPricePaise: line.price.finalPaise,
                discountPaise: (line.price.mrpPaise - line.price.finalPaise) * line.quantity,
                hsnCode: line.hsnCode,
                gstRate: line.gstRate,
                taxablePaise: taxable,
                taxPaise: gross - taxable,
                lineTotalPaise: gross,
                protectionPlanId: line.protection?.id ?? null,
                protectionName: line.protection?.name ?? null,
                protectionPaise: line.protection?.pricePaise ?? 0,
                warrantyMonths: line.warrantyMonths,
                isAccessory: line.isAccessory,
              };
            }),
          },
          events: {
            create: {
              status: 'pending',
              note: isCod
                ? 'Order placed — cash on delivery'
                : amountDue === 0
                  ? 'Order placed — paid from VOLTAGE wallet'
                  : 'Order placed — awaiting payment',
              actorType: 'customer',
              actorId: input.userId,
            },
          },
        },
        include: { items: true },
      });

      // One OrderUnit per physical unit, tagged with the warehouse that reserved
      // it. The IMEI lands at dispatch; the warehouse has to be recorded now so
      // a cancellation releases stock at the branch that actually holds it.
      for (const item of created.items) {
        const allocations = allocationsByVariant.get(item.variantId) ?? [];
        const units: { orderItemId: string; warehouseId: string | null }[] = [];
        for (const a of allocations) {
          for (let i = 0; i < a.quantity; i += 1) {
            units.push({ orderItemId: item.id, warehouseId: a.warehouseId });
          }
        }
        // Pre-orders can be sold ahead of stock, so top up any shortfall with
        // unassigned units rather than silently shipping fewer than were bought.
        while (units.length < item.quantity) {
          units.push({ orderItemId: item.id, warehouseId: null });
        }
        await tx.orderUnit.createMany({ data: units.slice(0, item.quantity) });
      }

      // The wallet debit shares the order's transaction, so a failure anywhere
      // below can never leave money deducted against an order that doesn't exist.
      if (walletApplied > 0) {
        await debit(
          {
            userId: input.userId,
            type: 'order_payment',
            amountPaise: walletApplied,
            description: `Applied to order ${created.orderNo}`,
            referenceType: 'order',
            referenceId: created.id,
            orderId: created.id,
          },
          tx,
        );
      }

      if (q.couponCode) {
        const c = await tx.coupon.findUnique({ where: { code: q.couponCode } });
        if (c) await redeemCoupon(tx, c.id, input.userId, created.id, q.couponDiscountPaise);
      }

      // Flash-sale counters move at placement, not dispatch: the cap is on units
      // claimed, or the sale oversells while orders sit waiting for payment.
      for (const line of q.cart.lines) {
        if (!line.price.flashSale) continue;
        await tx.flashSaleItem.updateMany({
          where: { flashSaleId: line.price.flashSale.id, variantId: line.variantId },
          data: { soldCount: { increment: line.quantity } },
        });
      }

      if (emiPlan) {
        const principalParts = splitEvenly(amountDue, emiPlan.tenureMonths);
        await tx.emiInstalment.createMany({
          data: emiPlan.schedule.map((amountPaise, i) => ({
            orderId: created.id,
            seqNo: i + 1,
            dueDate: addMonths(new Date(), i + 1),
            amountPaise,
            principalPaise: principalParts[i],
            interestPaise: Math.max(0, amountPaise - principalParts[i]),
            status: 'upcoming',
          })),
        });
      }

      await tx.cart.update({
        where: { id: input.cartId },
        data: { status: 'converted', couponCode: null },
      });
      await tx.cartItem.deleteMany({ where: { cartId: input.cartId } });
      await tx.abandonedCart.updateMany({
        where: { cartId: input.cartId, status: { in: ['open', 'reminded'] } },
        data: { status: 'recovered', recoveredOrderId: created.id },
      });

      return created;
    },
    { timeout: 20_000 },
  );

  // Nothing left to collect online → the order is real now. Gateway orders wait
  // for capture instead, which is what stops unpaid orders entering fulfilment.
  if (isCod || amountDue === 0) {
    const { confirmOrder } = await import('./orders');
    await confirmOrder(order.id, {
      note: isCod ? 'Cash on delivery confirmed' : 'Paid in full from VOLTAGE wallet',
      markPaid: amountDue === 0,
      actorId: input.userId,
    });
  }

  await notify({
    userId: input.userId,
    ...templates.orderPlaced({
      orderNo: order.orderNo,
      totalPaise: order.totalPaise,
      expectedBy: q.expectedBy,
    }),
    channels: ['email', 'sms'],
  });

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    totalPaise: order.totalPaise,
    amountDuePaise: amountDue,
    walletAppliedPaise: walletApplied,
    requiresPayment: needsGateway,
    paymentMethod: input.method,
  };
}
