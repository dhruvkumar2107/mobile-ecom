import 'server-only';

import type { Prisma } from '@prisma/client';
import { db } from '../db';
import { AppError } from '../api';
import { poNo } from '../ids';
import type { StockMovementType } from '../enums';
import { notify, templates } from './notify';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  INVENTORY
 * ════════════════════════════════════════════════════════════════════════
 *  Stock lives per (warehouse, variant) and is split into three numbers:
 *
 *    quantity  physically on the shelf
 *    reserved  committed to orders that haven't shipped yet
 *    damaged   present but unsellable
 *
 *  Sellable = quantity − reserved − damaged. Reservation happens at order
 *  placement, not at dispatch: two customers must not be able to buy the last
 *  unit because neither order had shipped yet.
 *
 *  Every change to `quantity` also writes a StockMovement. Reservations do not
 *  — they're a claim on existing stock, not a movement of it, and logging them
 *  as movements would make the ledger useless for reconciling physical counts.
 */

export type StockView = {
  variantId: string;
  totalQuantity: number;
  reserved: number;
  damaged: number;
  sellable: number;
  isInStock: boolean;
  isLowStock: boolean;
  byWarehouse: {
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    city: string;
    quantity: number;
    reserved: number;
    sellable: number;
    isLow: boolean;
  }[];
};

export async function getStock(variantId: string): Promise<StockView> {
  const rows = await db.inventoryStock.findMany({
    where: { variantId },
    include: { warehouse: { select: { id: true, name: true, code: true, city: true, isActive: true } } },
  });

  const active = rows.filter((r) => r.warehouse.isActive);
  const totalQuantity = active.reduce((s, r) => s + r.quantity, 0);
  const reserved = active.reduce((s, r) => s + r.reserved, 0);
  const damaged = active.reduce((s, r) => s + r.damaged, 0);
  const sellable = Math.max(0, totalQuantity - reserved - damaged);

  return {
    variantId,
    totalQuantity,
    reserved,
    damaged,
    sellable,
    isInStock: sellable > 0,
    isLowStock: sellable > 0 && active.some((r) => r.quantity - r.reserved <= r.lowStockThreshold),
    byWarehouse: active.map((r) => ({
      warehouseId: r.warehouseId,
      warehouseName: r.warehouse.name,
      warehouseCode: r.warehouse.code,
      city: r.warehouse.city,
      quantity: r.quantity,
      reserved: r.reserved,
      sellable: Math.max(0, r.quantity - r.reserved - r.damaged),
      isLow: r.quantity - r.reserved <= r.lowStockThreshold,
    })),
  };
}

/** Batched sellable counts — used by listing pages so they aren't N+1. */
export async function getSellableMap(variantIds: string[]): Promise<Map<string, number>> {
  if (!variantIds.length) return new Map();
  const rows = await db.inventoryStock.findMany({
    where: { variantId: { in: variantIds }, warehouse: { isActive: true } },
    select: { variantId: true, quantity: true, reserved: true, damaged: true },
  });
  const map = new Map<string, number>();
  for (const id of variantIds) map.set(id, 0);
  for (const r of rows) {
    map.set(r.variantId, (map.get(r.variantId) ?? 0) + Math.max(0, r.quantity - r.reserved - r.damaged));
  }
  return map;
}

export async function isAvailable(variantId: string, quantity: number): Promise<boolean> {
  const stock = await getStock(variantId);
  return stock.sellable >= quantity;
}

// ── Reservation ───────────────────────────────────────────────────────

export type Allocation = { warehouseId: string; quantity: number };

/**
 * Reserves stock across warehouses, highest-priority first, and returns the
 * allocation so order units can record which warehouse each unit shipped from.
 *
 * Runs inside the caller's transaction. The per-warehouse `updateMany` carries
 * the availability check in its WHERE clause, so two concurrent checkouts
 * racing for the last unit cannot both succeed — the loser sees count 0 and
 * moves to the next warehouse or fails.
 */
export async function reserveStock(
  tx: Prisma.TransactionClient,
  variantId: string,
  quantity: number,
  label: string,
): Promise<Allocation[]> {
  const rows = await tx.inventoryStock.findMany({
    where: { variantId, warehouse: { isActive: true } },
    include: { warehouse: { select: { priority: true } } },
    orderBy: { warehouse: { priority: 'desc' } },
  });

  const allocations: Allocation[] = [];
  let remaining = quantity;

  for (const row of rows) {
    if (remaining <= 0) break;
    const free = row.quantity - row.reserved - row.damaged;
    if (free <= 0) continue;
    const take = Math.min(free, remaining);

    const res = await tx.inventoryStock.updateMany({
      where: { id: row.id, quantity: { gte: row.reserved + row.damaged + take } },
      data: { reserved: { increment: take } },
    });
    if (res.count === 0) continue; // lost the race; try the next warehouse

    allocations.push({ warehouseId: row.warehouseId, quantity: take });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new AppError(
      `${label} — only ${quantity - remaining} in stock.`,
      409,
      { variantId: 'Insufficient stock' },
    );
  }

  return allocations;
}

/** Releases a reservation without shipping (cancellation, payment failure). */
export async function releaseReservation(
  tx: Prisma.TransactionClient,
  variantId: string,
  allocations: Allocation[],
): Promise<void> {
  for (const a of allocations) {
    const row = await tx.inventoryStock.findUnique({
      where: { warehouseId_variantId: { warehouseId: a.warehouseId, variantId } },
    });
    if (!row) continue;
    // Never drive `reserved` negative — a double release should be a no-op.
    await tx.inventoryStock.update({
      where: { id: row.id },
      data: { reserved: { decrement: Math.min(row.reserved, a.quantity) } },
    });
  }
}

/**
 * Converts a reservation into an actual outbound movement at dispatch:
 * quantity and reserved both drop, and the ledger records the shipment.
 */
export async function consumeReservation(
  tx: Prisma.TransactionClient,
  variantId: string,
  allocations: Allocation[],
  reference: { type: string; id: string; reason?: string },
): Promise<void> {
  for (const a of allocations) {
    const row = await tx.inventoryStock.findUnique({
      where: { warehouseId_variantId: { warehouseId: a.warehouseId, variantId } },
    });
    if (!row) continue;

    const take = Math.min(a.quantity, row.quantity);
    await tx.inventoryStock.update({
      where: { id: row.id },
      data: {
        quantity: { decrement: take },
        reserved: { decrement: Math.min(row.reserved, a.quantity) },
      },
    });

    await tx.stockMovement.create({
      data: {
        variantId,
        warehouseId: a.warehouseId,
        type: 'outbound',
        quantity: -take,
        reason: reference.reason ?? 'Order dispatched',
        referenceType: reference.type,
        referenceId: reference.id,
      },
    });
  }
}

// ── Adjustments ───────────────────────────────────────────────────────

/** Signed adjustment with a mandatory reason — the audit trail is the point. */
export async function adjustStock(input: {
  variantId: string;
  warehouseId: string;
  delta: number;
  type: StockMovementType;
  reason: string;
  actorId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  toDamaged?: boolean;
}) {
  if (input.delta === 0) throw new AppError('Adjustment cannot be zero.');
  if (!input.reason.trim()) throw new AppError('A reason is required for stock adjustments.');

  return db.$transaction(async (tx) => {
    const row = await tx.inventoryStock.upsert({
      where: {
        warehouseId_variantId: { warehouseId: input.warehouseId, variantId: input.variantId },
      },
      create: {
        warehouseId: input.warehouseId,
        variantId: input.variantId,
        quantity: Math.max(0, input.delta),
        damaged: input.toDamaged ? Math.max(0, input.delta) : 0,
      },
      update: input.toDamaged
        ? { damaged: { increment: input.delta } }
        : { quantity: { increment: input.delta } },
    });

    if (row.quantity < 0 || row.damaged < 0) {
      // Roll the whole transaction back rather than persist a negative shelf.
      throw new AppError('That adjustment would take stock below zero.', 409);
    }

    await tx.stockMovement.create({
      data: {
        variantId: input.variantId,
        warehouseId: input.warehouseId,
        type: input.type,
        quantity: input.delta,
        reason: input.reason,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        actorId: input.actorId ?? null,
      },
    });

    return row;
  });
}

export async function transferStock(input: {
  variantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason: string;
  actorId?: string | null;
}) {
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new AppError('Source and destination warehouses must differ.');
  }
  if (input.quantity <= 0) throw new AppError('Transfer quantity must be positive.');

  return db.$transaction(async (tx) => {
    const from = await tx.inventoryStock.findUnique({
      where: {
        warehouseId_variantId: {
          warehouseId: input.fromWarehouseId,
          variantId: input.variantId,
        },
      },
    });
    const free = from ? from.quantity - from.reserved - from.damaged : 0;
    if (free < input.quantity) {
      throw new AppError(`Only ${free} unreserved units available at the source warehouse.`, 409);
    }

    await tx.inventoryStock.update({
      where: { id: from!.id },
      data: { quantity: { decrement: input.quantity } },
    });
    await tx.inventoryStock.upsert({
      where: {
        warehouseId_variantId: { warehouseId: input.toWarehouseId, variantId: input.variantId },
      },
      create: {
        warehouseId: input.toWarehouseId,
        variantId: input.variantId,
        quantity: input.quantity,
      },
      update: { quantity: { increment: input.quantity } },
    });

    // Two rows, one physical event — the pair reconciles to zero net stock.
    await tx.stockMovement.createMany({
      data: [
        {
          variantId: input.variantId,
          warehouseId: input.fromWarehouseId,
          type: 'transfer',
          quantity: -input.quantity,
          reason: input.reason,
          actorId: input.actorId ?? null,
        },
        {
          variantId: input.variantId,
          warehouseId: input.toWarehouseId,
          type: 'transfer',
          quantity: input.quantity,
          reason: input.reason,
          actorId: input.actorId ?? null,
        },
      ],
    });

    return { transferred: input.quantity };
  });
}

// ── Alerts & reporting ────────────────────────────────────────────────

export async function lowStockRows(threshold?: number) {
  const rows = await db.inventoryStock.findMany({
    where: { warehouse: { isActive: true } },
    include: {
      warehouse: { select: { name: true, code: true, city: true } },
      variant: {
        include: {
          product: { select: { name: true, slug: true, brand: { select: { name: true } } } },
        },
      },
    },
  });

  return rows
    .map((r) => ({
      ...r,
      sellable: Math.max(0, r.quantity - r.reserved - r.damaged),
      limit: threshold ?? r.lowStockThreshold,
    }))
    .filter((r) => r.sellable <= r.limit)
    .sort((a, b) => a.sellable - b.sellable);
}

/** Inventory valuation at cost-equivalent (we use current selling price). */
export async function inventoryValuation() {
  const rows = await db.inventoryStock.findMany({
    where: { warehouse: { isActive: true } },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      variant: {
        select: {
          pricePaise: true,
          mrpPaise: true,
          product: { select: { brand: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  const byWarehouse = new Map<string, { name: string; code: string; units: number; valuePaise: number }>();
  const byBrand = new Map<string, { name: string; units: number; valuePaise: number }>();
  let totalUnits = 0;
  let totalValue = 0;

  for (const r of rows) {
    const value = r.quantity * r.variant.pricePaise;
    totalUnits += r.quantity;
    totalValue += value;

    const w = byWarehouse.get(r.warehouseId) ?? {
      name: r.warehouse.name,
      code: r.warehouse.code,
      units: 0,
      valuePaise: 0,
    };
    w.units += r.quantity;
    w.valuePaise += value;
    byWarehouse.set(r.warehouseId, w);

    const brand = r.variant.product.brand;
    const b = byBrand.get(brand.id) ?? { name: brand.name, units: 0, valuePaise: 0 };
    b.units += r.quantity;
    b.valuePaise += value;
    byBrand.set(brand.id, b);
  }

  return {
    totalUnits,
    totalValuePaise: totalValue,
    byWarehouse: [...byWarehouse.entries()].map(([id, v]) => ({ id, ...v })),
    byBrand: [...byBrand.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.valuePaise - a.valuePaise),
  };
}

/** Notifies everyone waiting on a variant once it's sellable again. */
export async function fireStockAlerts(variantId: string): Promise<number> {
  const stock = await getStock(variantId);
  if (stock.sellable <= 0) return 0;

  const pending = await db.stockAlert.findMany({
    where: { variantId, notifiedAt: null },
    include: { product: { select: { name: true, slug: true } } },
  });
  if (!pending.length) return 0;

  await db.stockAlert.updateMany({
    where: { id: { in: pending.map((p) => p.id) } },
    data: { notifiedAt: new Date() },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  for (const alert of pending) {
    const t = templates.backInStock({
      productName: alert.product.name,
      url: `${base}/product/${alert.product.slug}?variant=${variantId}`,
    });
    await notify({
      userId: alert.userId,
      email: alert.email,
      phone: alert.phone,
      ...t,
      channels: alert.phone ? ['email', 'sms'] : ['email'],
    });
  }

  return pending.length;
}

// ── Purchase orders ───────────────────────────────────────────────────

export async function createPurchaseOrder(input: {
  supplierId: string;
  warehouseId: string;
  expectedAt?: Date | null;
  notes?: string | null;
  createdById?: string | null;
  items: { variantId: string; quantity: number; unitCostPaise: number }[];
}) {
  if (!input.items.length) throw new AppError('A purchase order needs at least one line.');

  const subtotal = input.items.reduce((s, i) => s + i.quantity * i.unitCostPaise, 0);
  const tax = Math.round(subtotal * 0.18);

  return db.purchaseOrder.create({
    data: {
      poNo: poNo(),
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      status: 'draft',
      expectedAt: input.expectedAt ?? null,
      notes: input.notes ?? null,
      createdById: input.createdById ?? null,
      subtotalPaise: subtotal,
      taxPaise: tax,
      totalPaise: subtotal + tax,
      items: {
        create: input.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          unitCostPaise: i.unitCostPaise,
        })),
      },
    },
    include: { items: true },
  });
}

/**
 * Receives stock against a PO. Partial receipts are supported and the PO only
 * closes once every line is fully received — a supplier short-shipping one SKU
 * shouldn't mark the whole order complete.
 */
export async function receivePurchaseOrder(
  poId: string,
  receipts: { itemId: string; quantity: number }[],
  actorId?: string | null,
) {
  return db.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });
    if (!po) throw new AppError('Purchase order not found.', 404);
    if (po.status === 'cancelled') throw new AppError('This purchase order was cancelled.', 409);

    for (const r of receipts) {
      const item = po.items.find((i) => i.id === r.itemId);
      if (!item) throw new AppError('Unknown purchase order line.', 400);
      if (r.quantity <= 0) continue;

      const outstanding = item.quantity - item.receivedQty;
      if (r.quantity > outstanding) {
        throw new AppError(
          `Cannot receive ${r.quantity} of ${item.variantId} — only ${outstanding} outstanding.`,
          400,
        );
      }

      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQty: { increment: r.quantity } },
      });

      await tx.inventoryStock.upsert({
        where: {
          warehouseId_variantId: { warehouseId: po.warehouseId, variantId: item.variantId },
        },
        create: {
          warehouseId: po.warehouseId,
          variantId: item.variantId,
          quantity: r.quantity,
        },
        update: { quantity: { increment: r.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          warehouseId: po.warehouseId,
          type: 'inbound',
          quantity: r.quantity,
          reason: `Received against ${po.poNo}`,
          referenceType: 'purchase_order',
          referenceId: po.id,
          actorId: actorId ?? null,
        },
      });
    }

    const fresh = await tx.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });
    const allReceived = fresh!.items.every((i) => i.receivedQty >= i.quantity);
    const anyReceived = fresh!.items.some((i) => i.receivedQty > 0);

    return tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: allReceived ? 'received' : anyReceived ? 'partially_received' : po.status,
        receivedAt: allReceived ? new Date() : po.receivedAt,
      },
      include: { items: true, supplier: true, warehouse: true },
    });
  });
}
