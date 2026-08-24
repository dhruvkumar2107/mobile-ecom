import 'server-only';

import type { Prisma } from '@prisma/client';
import { db } from '../db';
import { AppError } from '../api';
import { awbNo, imei as newImei, serialNo, warrantyCardNo } from '../ids';
import { addDays, addMonths, parseJson } from '../utils';
import { ORDER_FLOW, LOYALTY_TIERS, LOYALTY_TIER_META, type LoyaltyTier, type OrderStatus } from '../enums';
import { consumeReservation, releaseReservation, type Allocation } from './inventory';
import { releaseCoupon } from './pricing';
import { generateInvoice } from './gst';
import { credit } from './wallet';
import { reverseCommissionForOrder } from './referral';
import { getSettings } from './settings';
import { notify, templates } from './notify';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  ORDER LIFECYCLE
 * ════════════════════════════════════════════════════════════════════════
 *  pending → confirmed → packed → shipped → out_for_delivery → delivered
 *  with cancelled and returned as exits, gated by ORDER_FLOW.
 *
 *  Three things happen at specific points and nowhere else:
 *
 *    confirm   the invoice is generated (a confirmed sale is a taxable event)
 *    dispatch  reservations become real outbound stock, and every unit gets its
 *              IMEI — that number is what the customer's warranty hangs off, so
 *              it is allocated once and never rewritten
 *    deliver   warranty clocks start and the return window opens
 *
 *  Cancellation is the interesting path, because it has to undo money as well
 *  as stock: release the reservation, hand back the coupon, refund what was
 *  actually collected, and claw back any referral commission the order earned.
 */

type Actor = { actorId?: string | null; actorType?: 'system' | 'admin' | 'customer' | 'courier' };

/** Allocation set implied by the units already recorded against an order item. */
async function allocationsFor(
  tx: Prisma.TransactionClient,
  orderItemId: string,
): Promise<Allocation[]> {
  const units = await tx.orderUnit.findMany({
    where: { orderItemId, warehouseId: { not: null } },
    select: { warehouseId: true },
  });
  const byWarehouse = new Map<string, number>();
  for (const u of units) {
    byWarehouse.set(u.warehouseId!, (byWarehouse.get(u.warehouseId!) ?? 0) + 1);
  }
  return [...byWarehouse.entries()].map(([warehouseId, quantity]) => ({ warehouseId, quantity }));
}

async function logEvent(
  tx: Prisma.TransactionClient,
  orderId: string,
  status: string,
  note: string,
  actor: Actor = {},
  location?: string | null,
) {
  await tx.orderStatusEvent.create({
    data: {
      orderId,
      status,
      note,
      location: location ?? null,
      actorId: actor.actorId ?? null,
      actorType: actor.actorType ?? 'system',
    },
  });
}

function assertTransition(from: string, to: OrderStatus) {
  const allowed = ORDER_FLOW[from as OrderStatus];
  if (!allowed) throw new AppError(`Unknown order status "${from}".`, 500);
  if (!allowed.includes(to)) {
    throw new AppError(
      `An order that is ${from.replace(/_/g, ' ')} cannot move to ${to.replace(/_/g, ' ')}.`,
      409,
    );
  }
}

// ── Confirm ───────────────────────────────────────────────────────────

/**
 * Moves a paid (or COD) order into fulfilment and issues its tax invoice.
 * Idempotent: payment webhooks retry, and a second call must not produce a
 * second invoice number or a second confirmation email.
 */
export async function confirmOrder(
  orderId: string,
  opts: { note?: string; markPaid?: boolean; actorId?: string | null } = {},
) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.status !== 'pending') return order; // already confirmed or beyond

  const updated = await db.$transaction(async (tx) => {
    const next = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
        ...(opts.markPaid
          ? {
              paymentStatus: 'paid',
              amountPaidPaise: order.totalPaise,
              amountDuePaise: 0,
            }
          : {}),
      },
    });
    await logEvent(tx, orderId, 'confirmed', opts.note ?? 'Order confirmed', {
      actorId: opts.actorId ?? null,
      actorType: opts.actorId ? 'customer' : 'system',
    });
    return next;
  });

  // Invoice generation is its own transaction and is itself idempotent, so a
  // failure here leaves a confirmed order that can be re-invoiced, rather than
  // rolling back a confirmation the customer has already been told about.
  await generateInvoice(orderId).catch((err) => {
    console.error(`[orders] invoice generation failed for ${order.orderNo}:`, err);
  });

  return updated;
}

// ── Pack & dispatch ───────────────────────────────────────────────────

export async function packOrder(orderId: string, actor: Actor = {}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found.', 404);
    assertTransition(order.status, 'packed');

    const next = await tx.order.update({ where: { id: orderId }, data: { status: 'packed' } });
    await logEvent(tx, orderId, 'packed', 'Order packed and ready for pickup', actor);
    return next;
  });
}

/**
 * Dispatch. This is where the order stops being a promise:
 *
 *   • each unit is stamped with an IMEI and serial (once — never rewritten)
 *   • reserved stock becomes an outbound StockMovement
 *   • a Shipment row and AWB are created
 *
 * IMEI uniqueness is enforced by the database, so the retry loop is doing real
 * work: a collision must produce a fresh number, not a failed dispatch.
 */
export async function dispatchOrder(
  orderId: string,
  input: { courier: string; awb?: string; trackingUrl?: string | null } & Actor,
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { units: true } } },
  });
  if (!order) throw new AppError('Order not found.', 404);
  assertTransition(order.status, 'shipped');

  const awb = input.awb?.trim() || awbNo();

  const shipped = await db.$transaction(
    async (tx) => {
      for (const item of order.items) {
        for (const unit of item.units) {
          // Already stamped — an IMEI is allocated once and never rewritten.
          if (unit.serialNumber && (item.isAccessory || unit.imei1)) continue;
          await assignUnitIdentity(tx, unit.id, item.isAccessory);
        }

        const allocations = await allocationsFor(tx, item.id);
        if (allocations.length) {
          await consumeReservation(tx, item.variantId, allocations, {
            type: 'order',
            id: order.id,
            reason: `Dispatched with ${order.orderNo}`,
          });
        }
      }

      await tx.orderUnit.updateMany({
        where: { orderItem: { orderId }, status: 'allocated' },
        data: { status: 'dispatched' },
      });

      await tx.shipment.create({
        data: {
          orderId,
          courier: input.courier,
          awb,
          status: 'in_transit',
          shippedAt: new Date(),
        },
      });

      const next = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'shipped',
          courier: input.courier,
          awb,
          trackingUrl: input.trackingUrl ?? null,
        },
      });

      await logEvent(tx, orderId, 'shipped', `Handed to ${input.courier} — ${awb}`, input);

      // Units sold is a catalog-level counter used for "best seller" ranking;
      // dispatch is the honest point to increment it.
      for (const item of order.items) {
        await tx.product.updateMany({
          where: { variants: { some: { id: item.variantId } } },
          data: { soldCount: { increment: item.quantity } },
        });
      }

      return next;
    },
    { timeout: 20_000 },
  );

  await notify({
    userId: order.userId,
    ...templates.orderShipped({ orderNo: order.orderNo, courier: input.courier, awb }),
    channels: ['email', 'sms', 'push'],
  });

  return shipped;
}

/**
 * Stamps one unit with a unique IMEI/serial.
 *
 * The candidate is checked for collisions *before* the write rather than
 * catching the unique-constraint error afterwards: a failed statement inside an
 * interactive transaction is not something to recover from and keep going, so
 * the check has to happen first. The database keeps its unique indexes as the
 * real guarantee — this loop just avoids ever tripping them.
 */
async function assignUnitIdentity(
  tx: Prisma.TransactionClient,
  unitId: string,
  isAccessory: boolean,
) {
  const freshImei = async (): Promise<string> => {
    for (let i = 0; i < 8; i += 1) {
      const candidate = newImei();
      const clash = await tx.orderUnit.findUnique({
        where: { imei1: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
    throw new AppError('Could not allocate a unique IMEI for this unit.', 500);
  };

  const freshSerial = async (): Promise<string> => {
    for (let i = 0; i < 8; i += 1) {
      const candidate = serialNo();
      const clash = await tx.orderUnit.findUnique({
        where: { serialNumber: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
    throw new AppError('Could not allocate a unique serial number for this unit.', 500);
  };

  await tx.orderUnit.update({
    where: { id: unitId },
    data: {
      // Accessories have no IMEI; they still get a serial for the RMA trail.
      imei1: isAccessory ? null : await freshImei(),
      imei2: isAccessory ? null : await freshImei(),
      serialNumber: await freshSerial(),
    },
  });
}

export async function markOutForDelivery(orderId: string, actor: Actor = {}, location?: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found.', 404);
    assertTransition(order.status, 'out_for_delivery');

    const next = await tx.order.update({
      where: { id: orderId },
      data: { status: 'out_for_delivery' },
    });
    await logEvent(
      tx,
      orderId,
      'out_for_delivery',
      'Out for delivery',
      { ...actor, actorType: actor.actorType ?? 'courier' },
      location,
    );
    return next;
  });
}

// ── Deliver ───────────────────────────────────────────────────────────

/**
 * Delivery closes the loop: warranty starts, cards are issued, COD cash is
 * recognised as collected, and loyalty points are credited. The warranty period
 * runs from the delivery date, not the order date — the customer didn't have
 * the device while it was in transit.
 */
export async function deliverOrder(orderId: string, actor: Actor = {}) {
  const settings = await getSettings();

  const order = await db.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { units: true } } },
    });
    if (!current) throw new AppError('Order not found.', 404);
    assertTransition(current.status, 'delivered');

    const now = new Date();

    for (const item of current.items) {
      for (const unit of item.units) {
        const validTill = addMonths(now, item.warrantyMonths);
        await tx.orderUnit.update({
          where: { id: unit.id },
          data: { status: 'delivered', warrantyStart: now, warrantyEnd: validTill },
        });

        const existing = await tx.warrantyCard.findUnique({ where: { orderUnitId: unit.id } });
        if (existing) continue;
        await tx.warrantyCard.create({
          data: {
            orderUnitId: unit.id,
            cardNo: warrantyCardNo(),
            productName: `${item.brandName} ${item.productName}`,
            imei: unit.imei1,
            months: item.warrantyMonths,
            validFrom: now,
            validTill,
            isExtended: Boolean(item.protectionPlanId),
          },
        });
      }
    }

    const isCod = current.paymentMethod === 'cod';

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: 'delivered',
        deliveredAt: now,
        // COD money changes hands at the doorstep — this is the moment it's real.
        ...(isCod
          ? { paymentStatus: 'paid', amountPaidPaise: current.totalPaise, amountDuePaise: 0 }
          : {}),
        events: {
          create: {
            status: 'delivered',
            note: isCod ? 'Delivered — cash collected' : 'Delivered',
            actorId: actor.actorId ?? null,
            actorType: actor.actorType ?? 'courier',
          },
        },
        shipments: {
          updateMany: {
            where: { orderId },
            data: { status: 'delivered', deliveredAt: now },
          },
        },
      },
      include: { items: true },
    });
  });

  // Referral commission and loyalty both key off a completed sale, and both are
  // safe to fail — neither should be able to un-deliver a delivered order.
  await Promise.allSettled([
    creditLoyalty(order.id, order.userId, order.totalPaise, settings.loyaltyEarnRateBps),
    (async () => {
      const { processOrderCommission } = await import('./referral');
      await processOrderCommission(order.id);
    })(),
    notify({
      userId: order.userId,
      ...templates.orderDelivered({ orderNo: order.orderNo }),
      channels: ['email', 'push'],
    }),
  ]);

  return order;
}

/**
 * Credits points and promotes the tier if lifetime spend crossed a threshold.
 *
 * `loyaltyEarnRateBps` is basis points of order value, and one point is worth
 * one rupee of spend at the default rate — so the division by 100 converts
 * paise to rupees, and points are floored rather than rounded (never award a
 * point that wasn't fully earned).
 */
async function creditLoyalty(
  orderId: string,
  userId: string,
  totalPaise: number,
  earnRateBps: number,
) {
  const points = Math.floor((totalPaise * earnRateBps) / 10_000 / 100);

  await db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        loyaltyPoints: { increment: points },
        lifetimeSpendPaise: { increment: totalPaise },
      },
      select: { loyaltyPoints: true, lifetimeSpendPaise: true, loyaltyTier: true },
    });

    if (points > 0) {
      await tx.loyaltyTransaction.create({
        data: {
          userId,
          orderId,
          points,
          direction: 'earn',
          description: 'Points earned on a delivered order',
          balanceAfter: user.loyaltyPoints,
        },
      });
    }

    // Tiers only ever go up — a refund shouldn't demote someone who already
    // received the benefits of the tier they earned.
    const earned = tierForSpend(user.lifetimeSpendPaise);
    if (
      LOYALTY_TIERS.indexOf(earned) >
      LOYALTY_TIERS.indexOf(user.loyaltyTier as LoyaltyTier)
    ) {
      await tx.user.update({ where: { id: userId }, data: { loyaltyTier: earned } });
    }
  });
}

export function tierForSpend(lifetimeSpendPaise: number): LoyaltyTier {
  let best: LoyaltyTier = 'silver';
  for (const tier of LOYALTY_TIERS) {
    if (lifetimeSpendPaise >= LOYALTY_TIER_META[tier].minSpendPaise) best = tier;
  }
  return best;
}

// ── Cancel ────────────────────────────────────────────────────────────

export type CancelResult = {
  orderId: string;
  refundPaise: number;
  walletRefundPaise: number;
  gatewayRefundPaise: number;
};

/**
 * Cancellation, in the only order that keeps the books straight:
 *
 *   1. release the stock reservation      (so someone else can buy it)
 *   2. return the coupon                  (usage counter, per-user limit)
 *   3. reverse referral commission        (before refunding — the money may
 *                                          still be sitting in a hold bucket)
 *   4. refund what was actually collected — wallet money back to the wallet,
 *      gateway money back through the gateway
 *
 * Anything already dispatched is not a cancellation; that's a return, which
 * needs the device physically back before money moves.
 */
export async function cancelOrder(input: {
  orderId: string;
  reason: string;
  cancelledBy: 'customer' | 'admin' | 'system';
  actorId?: string | null;
}): Promise<CancelResult> {
  if (!input.reason.trim()) throw new AppError('A cancellation reason is required.');

  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });
    if (!order) throw new AppError('Order not found.', 404);
    assertTransition(order.status, 'cancelled');

    for (const item of order.items) {
      const allocations = await allocationsFor(tx, item.id);
      if (allocations.length) await releaseReservation(tx, item.variantId, allocations);
    }
    await tx.orderUnit.updateMany({
      where: { orderItem: { orderId: order.id } },
      data: { status: 'returned' },
    });

    await releaseCoupon(tx, order.id);

    // Wallet money returns instantly; it never left our books.
    const walletRefund = order.walletAppliedPaise;
    if (walletRefund > 0) {
      await credit(
        {
          userId: order.userId,
          type: 'refund',
          amountPaise: walletRefund,
          description: `Wallet amount returned — order ${order.orderNo} cancelled`,
          referenceType: 'order',
          referenceId: order.id,
          orderId: order.id,
        },
        tx,
      );
    }

    // Whatever the gateway actually took, minus the wallet portion we just
    // handed back, is what has to travel back out through the gateway.
    const gatewayRefund = Math.max(0, order.amountPaidPaise - walletRefund);

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: input.reason,
        cancelledBy: input.cancelledBy,
        paymentStatus: order.amountPaidPaise > 0 ? 'refunded' : 'pending',
        refundedPaise: walletRefund,
        amountDuePaise: 0,
      },
    });

    await logEvent(tx, order.id, 'cancelled', `Cancelled — ${input.reason}`, {
      actorId: input.actorId ?? null,
      actorType: input.cancelledBy,
    });

    // EMI schedules die with the order; leaving them would keep dunning a
    // customer for instalments on something they never received.
    await tx.emiInstalment.deleteMany({ where: { orderId: order.id, status: 'upcoming' } });

    return {
      order,
      walletRefundPaise: walletRefund,
      gatewayRefundPaise: gatewayRefund,
    };
  });

  // Commission reversal reads and writes wallet buckets of a *different* user
  // (the referrer), so it runs outside the order transaction to keep the write
  // lock short.
  await reverseCommissionForOrder(result.order.id, `Order ${result.order.orderNo} cancelled`);

  if (result.gatewayRefundPaise > 0) {
    const { refundOrderPayment } = await import('./payments');
    await refundOrderPayment({
      orderId: result.order.id,
      amountPaise: result.gatewayRefundPaise,
      reason: input.reason,
    }).catch((err) => {
      // A failed gateway refund must stay visible rather than vanish — the
      // admin Payments dashboard lists these for retry.
      console.error(`[orders] gateway refund failed for ${result.order.orderNo}:`, err);
    });
  }

  await notify({
    userId: result.order.userId,
    ...templates.orderCancelled({
      orderNo: result.order.orderNo,
      reason: input.reason,
      refundPaise: result.walletRefundPaise + result.gatewayRefundPaise,
    }),
    channels: ['email', 'sms'],
  });

  return {
    orderId: result.order.id,
    refundPaise: result.walletRefundPaise + result.gatewayRefundPaise,
    walletRefundPaise: result.walletRefundPaise,
    gatewayRefundPaise: result.gatewayRefundPaise,
  };
}

/** Whether the customer is still allowed to cancel this themselves. */
export function customerCanCancel(status: string): boolean {
  return ['pending', 'confirmed', 'packed'].includes(status);
}

// ── Return ────────────────────────────────────────────────────────────

/**
 * A return puts stock back on the shelf and refunds, but only inside the
 * window. Unlike a cancellation the goods have to come back, so the stock
 * movement is an inbound `return`, not a released reservation.
 */
export async function returnOrder(input: {
  orderId: string;
  reason: string;
  actorId?: string | null;
  restock?: boolean;
}) {
  const settings = await getSettings();

  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: { include: { units: true } } },
    });
    if (!order) throw new AppError('Order not found.', 404);
    assertTransition(order.status, 'returned');

    if (order.deliveredAt) {
      const deadline = addDays(order.deliveredAt, settings.returnWindowDays);
      if (new Date() > deadline) {
        throw new AppError(
          `The ${settings.returnWindowDays}-day return window for this order closed on ${deadline.toDateString()}.`,
          409,
        );
      }
    }

    if (input.restock !== false) {
      for (const item of order.items) {
        // Returned units go back to the warehouse that shipped them.
        const byWarehouse = new Map<string, number>();
        for (const u of item.units) {
          if (u.warehouseId) byWarehouse.set(u.warehouseId, (byWarehouse.get(u.warehouseId) ?? 0) + 1);
        }
        for (const [warehouseId, quantity] of byWarehouse) {
          await tx.inventoryStock.upsert({
            where: { warehouseId_variantId: { warehouseId, variantId: item.variantId } },
            create: { warehouseId, variantId: item.variantId, quantity },
            update: { quantity: { increment: quantity } },
          });
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              warehouseId,
              type: 'return',
              quantity,
              reason: `Returned with ${order.orderNo}`,
              referenceType: 'order',
              referenceId: order.id,
              actorId: input.actorId ?? null,
            },
          });
        }
      }
    }

    await tx.orderUnit.updateMany({
      where: { orderItem: { orderId: order.id } },
      data: { status: 'returned' },
    });

    const walletRefund = order.walletAppliedPaise;
    if (walletRefund > 0) {
      await credit(
        {
          userId: order.userId,
          type: 'refund',
          amountPaise: walletRefund,
          description: `Wallet amount returned — order ${order.orderNo} returned`,
          referenceType: 'order',
          referenceId: order.id,
          orderId: order.id,
        },
        tx,
      );
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'returned',
        cancelReason: input.reason,
        paymentStatus: 'refunded',
        refundedPaise: walletRefund,
      },
    });

    await logEvent(tx, order.id, 'returned', `Returned — ${input.reason}`, {
      actorId: input.actorId ?? null,
      actorType: 'admin',
    });

    return { order, walletRefundPaise: walletRefund };
  });

  await reverseCommissionForOrder(result.order.id, `Order ${result.order.orderNo} returned`);

  const gatewayRefund = Math.max(
    0,
    result.order.amountPaidPaise - result.walletRefundPaise,
  );
  if (gatewayRefund > 0) {
    const { refundOrderPayment } = await import('./payments');
    await refundOrderPayment({
      orderId: result.order.id,
      amountPaise: gatewayRefund,
      reason: input.reason,
    }).catch((err) => {
      console.error(`[orders] gateway refund failed for ${result.order.orderNo}:`, err);
    });
  }

  return { orderId: result.order.id, refundPaise: result.walletRefundPaise + gatewayRefund };
}

// ── Reads ─────────────────────────────────────────────────────────────

export async function getOrder(orderId: string, userId?: string | null) {
  const [order, settings] = await Promise.all([
    db.order.findFirst({
      where: { id: orderId, ...(userId ? { userId } : {}) },
      include: {
        items: {
          include: {
            units: { include: { warrantyCard: true } },
            variant: { select: { id: true, product: { select: { slug: true } } } },
          },
        },
        events: { orderBy: { createdAt: 'desc' } },
        shipments: { orderBy: { createdAt: 'desc' } },
        invoice: true,
        payments: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        emiSchedule: { orderBy: { seqNo: 'asc' } },
        address: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    getSettings(),
  ]);
  if (!order) throw new AppError('Order not found.', 404);

  const returnDeadline = order.deliveredAt
    ? addDays(order.deliveredAt, settings.returnWindowDays)
    : null;

  return {
    ...order,
    deliveryAddress: parseJson<Record<string, string | null>>(order.addressSnapshot, {}),
    canCancel: customerCanCancel(order.status),
    canReturn:
      order.status === 'delivered' && returnDeadline !== null && new Date() <= returnDeadline,
    returnDeadline,
  };
}

export async function getOrderByNo(orderNo: string, userId?: string | null) {
  const found = await db.order.findUnique({ where: { orderNo }, select: { id: true } });
  if (!found) throw new AppError('Order not found.', 404);
  return getOrder(found.id, userId);
}

export async function listOrders(
  userId: string,
  opts: { take?: number; skip?: number; status?: string } = {},
) {
  const where: Prisma.OrderWhereInput = {
    userId,
    ...(opts.status && opts.status !== 'all' ? { status: opts.status } : {}),
  };

  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      take: opts.take ?? 10,
      skip: opts.skip ?? 0,
      include: {
        items: { select: { productName: true, brandName: true, variantLabel: true, quantity: true, imageGradient: true } },
        invoice: { select: { invoiceNo: true } },
      },
    }),
    db.order.count({ where }),
  ]);

  return { rows, total };
}

/** Public tracking timeline — safe to expose without authentication. */
export async function trackOrder(orderNo: string) {
  const order = await db.order.findUnique({
    where: { orderNo },
    select: {
      orderNo: true,
      status: true,
      courier: true,
      awb: true,
      trackingUrl: true,
      placedAt: true,
      expectedDeliveryAt: true,
      deliveredAt: true,
      events: {
        orderBy: { createdAt: 'asc' },
        select: { status: true, note: true, location: true, createdAt: true },
      },
      items: { select: { productName: true, brandName: true, quantity: true, imageGradient: true } },
    },
  });
  if (!order) throw new AppError('We could not find that order number.', 404);
  return order;
}

/** EMI status tracker for the customer account area. */
export async function getEmiSchedule(userId: string) {
  const orders = await db.order.findMany({
    where: { userId, paymentMethod: 'emi', status: { notIn: ['cancelled'] } },
    orderBy: { placedAt: 'desc' },
    include: {
      emiSchedule: { orderBy: { seqNo: 'asc' } },
      items: { select: { productName: true, brandName: true }, take: 1 },
    },
  });

  const now = new Date();
  return orders.map((o) => {
    const paid = o.emiSchedule.filter((i) => i.status === 'paid');
    const overdue = o.emiSchedule.filter((i) => i.status !== 'paid' && i.dueDate < now);
    const next = o.emiSchedule.find((i) => i.status !== 'paid') ?? null;

    return {
      orderId: o.id,
      orderNo: o.orderNo,
      title: o.items[0] ? `${o.items[0].brandName} ${o.items[0].productName}` : o.orderNo,
      tenure: o.emiTenure ?? o.emiSchedule.length,
      monthlyPaise: o.emiMonthlyPaise ?? next?.amountPaise ?? 0,
      paidCount: paid.length,
      paidPaise: paid.reduce((s, i) => s + i.amountPaise, 0),
      remainingPaise: o.emiSchedule
        .filter((i) => i.status !== 'paid')
        .reduce((s, i) => s + i.amountPaise, 0),
      overdueCount: overdue.length,
      nextInstalment: next,
      schedule: o.emiSchedule,
    };
  });
}

/** Marks an instalment paid, and flags anything past its due date as overdue. */
export async function settleInstalment(instalmentId: string) {
  const row = await db.emiInstalment.findUnique({ where: { id: instalmentId } });
  if (!row) throw new AppError('Instalment not found.', 404);
  if (row.status === 'paid') return row;
  return db.emiInstalment.update({
    where: { id: instalmentId },
    data: { status: 'paid', paidAt: new Date() },
  });
}

export async function flagOverdueInstalments(): Promise<number> {
  const res = await db.emiInstalment.updateMany({
    where: { status: 'upcoming', dueDate: { lt: new Date() } },
    data: { status: 'overdue' },
  });
  return res.count;
}

export async function getReviewableOrders(userId: string) {
  const deliveredItems = await db.orderItem.findMany({
    where: { order: { userId, status: 'delivered' }, isAccessory: false },
    orderBy: { order: { deliveredAt: 'desc' } },
    take: 50,
    select: {
      id: true,
      productName: true,
      brandName: true,
      variant: { select: { productId: true } },
      order: { select: { orderNo: true, id: true } },
    },
  });

  const reviewed = await db.review.findMany({
    where: { userId },
    select: { productId: true },
  });
  const reviewedSet = new Set(reviewed.map((r) => r.productId));

  const seenProducts = new Set<string>();
  return deliveredItems
    .filter((item) => {
      const pid = item.variant.productId;
      if (reviewedSet.has(pid) || seenProducts.has(pid)) return false;
      seenProducts.add(pid);
      return true;
    })
    .map((item) => ({
      orderItemId: item.id,
      orderId: item.order.id,
      orderNo: item.order.orderNo,
      productId: item.variant.productId,
      productName: item.productName,
      brandName: item.brandName,
      variantLabel: '',
      imageGradient: '',
    }));
}

export async function getMyReviews(userId: string) {
  return db.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true, brand: { select: { name: true } } } },
    },
  }) as Promise<Array<{ id: string; productId: string; product: { name: string; brand: { name: string } } | null; rating: number; title: string | null; body: string; status: string; createdAt: Date }>>;
}
