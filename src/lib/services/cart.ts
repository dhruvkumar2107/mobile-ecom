import 'server-only';

import { cookies } from 'next/headers';
import { db } from '../db';
import { AppError } from '../api';
import { CART_COOKIE } from '../auth';
import { sessionId as newSessionId } from '../ids';
import {
  getProtectionOptions,
  loadPricingContext,
  protectionPriceFor,
  resolvePrice,
  type PricedResult,
} from './pricing';
import { getSellableMap } from './inventory';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  CART
 * ════════════════════════════════════════════════════════════════════════
 *  A cart stores intent only — variant, quantity, chosen protection plan. It
 *  stores NO money. Every price is recomputed from the pricing engine on each
 *  read, which is what makes a flash sale starting mid-session apply to a cart
 *  that was filled an hour earlier, and stops a stale stored price from being
 *  charged at checkout.
 *
 *  Guests get a cookie-backed cart; signing in merges it into the account cart
 *  rather than discarding either one.
 */

export type CartLine = {
  itemId: string;
  variantId: string;
  productId: string;
  /** Carried so coupon scope rules (brand/category-restricted) can be evaluated. */
  brandId: string;
  categoryId: string;
  slug: string;
  productName: string;
  brandName: string;
  variantLabel: string;
  sku: string;
  colorName: string;
  colorHex: string;
  colorHex2: string | null;
  heroGradient: string;
  quantity: number;
  isAccessory: boolean;
  price: PricedResult;
  lineTotalPaise: number;
  protection: { id: string; name: string; pricePaise: number; durationMonths: number } | null;
  hsnCode: string;
  gstRate: number;
  warrantyMonths: number;
  /** Live stock, so the cart can show "only 2 left" and block over-ordering. */
  sellable: number;
  stockIssue: string | null;
};

export type CartView = {
  cartId: string;
  lines: CartLine[];
  itemCount: number;
  unitCount: number;
  mrpTotalPaise: number;
  subtotalPaise: number;
  savingsPaise: number;
  protectionPaise: number;
  couponCode: string | null;
  hasStockIssues: boolean;
  isEmpty: boolean;
};

// ── Resolution ────────────────────────────────────────────────────────

/** Finds (or creates) the caller's cart. Never throws for a guest. */
export async function resolveCart(userId: string | null): Promise<string> {
  const jar = await cookies();

  if (userId) {
    const existing = await db.cart.findFirst({
      where: { userId, status: 'active' },
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) return existing.id;
    const created = await db.cart.create({ data: { userId, status: 'active' } });
    return created.id;
  }

  const token = jar.get(CART_COOKIE)?.value;
  if (token) {
    const existing = await db.cart.findFirst({
      where: { sessionId: token, status: 'active', userId: null },
    });
    if (existing) return existing.id;
  }

  const sid = token ?? newSessionId();
  const created = await db.cart.create({ data: { sessionId: sid, status: 'active' } });
  jar.set(CART_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
  });
  return created.id;
}

/**
 * Merges a guest cart into the account cart at sign-in. Quantities add up and
 * the guest cart is marked converted — a customer who added a phone before
 * logging in must not lose it.
 */
export async function mergeGuestCart(userId: string): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return;

  const guest = await db.cart.findFirst({
    where: { sessionId: token, status: 'active', userId: null },
    include: { items: true },
  });
  if (!guest || !guest.items.length) return;

  const targetId = await resolveCart(userId);
  if (targetId === guest.id) return;

  for (const item of guest.items) {
    const existing = await db.cartItem.findFirst({
      where: {
        cartId: targetId,
        variantId: item.variantId,
        protectionPlanId: item.protectionPlanId,
      },
    });
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(5, existing.quantity + item.quantity) },
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: targetId,
          variantId: item.variantId,
          quantity: item.quantity,
          protectionPlanId: item.protectionPlanId,
          isAccessory: item.isAccessory,
        },
      });
    }
  }

  await db.cart.update({
    where: { id: guest.id },
    data: { status: 'converted', items: { deleteMany: {} } },
  });
  jar.delete(CART_COOKIE);
}

// ── Read ──────────────────────────────────────────────────────────────

const MAX_PER_LINE = 5;

export async function getCart(
  cartId: string,
  opts: { loyaltyTier?: string | null } = {},
): Promise<CartView> {
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { addedAt: 'asc' },
        include: {
          protectionPlan: true,
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  brandId: true,
                  categoryId: true,
                  hsnCode: true,
                  gstRate: true,
                  warrantyMonths: true,
                  heroGradient: true,
                  status: true,
                  brand: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) throw new AppError('Cart not found.', 404);

  const [pricing, stockMap] = await Promise.all([
    loadPricingContext(),
    getSellableMap(cart.items.map((i) => i.variantId)),
  ]);

  const lines: CartLine[] = [];

  for (const item of cart.items) {
    const v = item.variant;
    const p = v.product;

    const price = resolvePrice(
      v,
      {
        brandId: p.brandId,
        categoryId: p.categoryId,
        productId: p.id,
        variantId: v.id,
        quantity: item.quantity,
        loyaltyTier: opts.loyaltyTier,
      },
      pricing,
    );

    const sellable = stockMap.get(v.id) ?? 0;

    let stockIssue: string | null = null;
    if (p.status === 'archived' || !v.isActive) {
      stockIssue = 'No longer available';
    } else if (sellable === 0) {
      stockIssue = 'Out of stock';
    } else if (sellable < item.quantity) {
      stockIssue = `Only ${sellable} left`;
    }

    const protectionPaise = item.protectionPlan
      ? await protectionPriceFor(item.protectionPlan.id, price.finalPaise)
      : 0;

    lines.push({
      itemId: item.id,
      variantId: v.id,
      productId: p.id,
      brandId: p.brandId,
      categoryId: p.categoryId,
      slug: p.slug,
      productName: p.name,
      brandName: p.brand.name,
      variantLabel: variantLabel(v),
      sku: v.sku,
      colorName: v.colorName,
      colorHex: v.colorHex,
      colorHex2: v.colorHex2,
      heroGradient: p.heroGradient,
      quantity: item.quantity,
      isAccessory: item.isAccessory,
      price,
      lineTotalPaise: price.finalPaise * item.quantity,
      protection: item.protectionPlan
        ? {
            id: item.protectionPlan.id,
            name: item.protectionPlan.name,
            pricePaise: protectionPaise,
            durationMonths: item.protectionPlan.durationMonths,
          }
        : null,
      hsnCode: p.hsnCode,
      gstRate: p.gstRate,
      warrantyMonths: p.warrantyMonths,
      sellable,
      stockIssue,
    });
  }

  const subtotalPaise = lines.reduce((s, l) => s + l.lineTotalPaise, 0);
  const mrpTotalPaise = lines.reduce((s, l) => s + l.price.mrpPaise * l.quantity, 0);
  const protectionPaise = lines.reduce((s, l) => s + (l.protection?.pricePaise ?? 0), 0);

  return {
    cartId: cart.id,
    lines,
    itemCount: lines.length,
    unitCount: lines.reduce((s, l) => s + l.quantity, 0),
    mrpTotalPaise,
    subtotalPaise,
    savingsPaise: mrpTotalPaise - subtotalPaise,
    protectionPaise,
    couponCode: cart.couponCode,
    hasStockIssues: lines.some((l) => l.stockIssue),
    isEmpty: lines.length === 0,
  };
}

export function variantLabel(v: {
  ramGb: number | null;
  storageGb: number | null;
  colorName: string;
}): string {
  const parts: string[] = [];
  if (v.ramGb) parts.push(`${v.ramGb} GB RAM`);
  if (v.storageGb) {
    parts.push(v.storageGb >= 1024 ? `${v.storageGb / 1024} TB` : `${v.storageGb} GB`);
  }
  parts.push(v.colorName);
  return parts.join(' · ');
}

// ── Mutations ─────────────────────────────────────────────────────────

export async function addToCart(
  cartId: string,
  input: { variantId: string; quantity?: number; protectionPlanId?: string | null },
) {
  const quantity = Math.max(1, Math.min(MAX_PER_LINE, input.quantity ?? 1));

  const variant = await db.productVariant.findUnique({
    where: { id: input.variantId },
    include: { product: { select: { status: true, kind: true, name: true } } },
  });
  if (!variant || !variant.isActive) throw new AppError('That option is unavailable.', 404);
  if (variant.product.status === 'archived') {
    throw new AppError('That product is no longer sold.', 409);
  }

  const stock = await getSellableMap([variant.id]);
  const sellable = stock.get(variant.id) ?? 0;
  // Pre-orders are allowed to exceed stock by design; everything else isn't.
  if (variant.product.status !== 'coming_soon' && sellable <= 0) {
    throw new AppError(`${variant.product.name} is out of stock.`, 409);
  }

  const existing = await db.cartItem.findFirst({
    where: {
      cartId,
      variantId: input.variantId,
      protectionPlanId: input.protectionPlanId ?? null,
    },
  });

  if (existing) {
    const next = Math.min(MAX_PER_LINE, existing.quantity + quantity);
    if (next === existing.quantity) {
      throw new AppError(`You can order up to ${MAX_PER_LINE} of this item.`, 409);
    }
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: next } });
  } else {
    await db.cartItem.create({
      data: {
        cartId,
        variantId: input.variantId,
        quantity,
        protectionPlanId: input.protectionPlanId ?? null,
        isAccessory: variant.product.kind === 'accessory',
      },
    });
  }

  await touch(cartId);
  return { added: true };
}

export async function updateQuantity(cartId: string, itemId: string, quantity: number) {
  if (quantity <= 0) return removeFromCart(cartId, itemId);
  if (quantity > MAX_PER_LINE) {
    throw new AppError(`You can order up to ${MAX_PER_LINE} of this item.`, 409);
  }

  const item = await db.cartItem.findFirst({ where: { id: itemId, cartId } });
  if (!item) throw new AppError('Item not in your cart.', 404);

  const stock = await getSellableMap([item.variantId]);
  const sellable = stock.get(item.variantId) ?? 0;
  if (quantity > sellable) {
    throw new AppError(`Only ${sellable} available.`, 409);
  }

  await db.cartItem.update({ where: { id: itemId }, data: { quantity } });
  await touch(cartId);
  return { updated: true };
}

export async function removeFromCart(cartId: string, itemId: string) {
  const deleted = await db.cartItem.deleteMany({ where: { id: itemId, cartId } });
  if (!deleted.count) throw new AppError('Item not in your cart.', 404);
  await touch(cartId);
  return { removed: true };
}

/** Attaches or swaps the protection plan on a line. */
export async function setProtection(
  cartId: string,
  itemId: string,
  protectionPlanId: string | null,
) {
  const item = await db.cartItem.findFirst({ where: { id: itemId, cartId } });
  if (!item) throw new AppError('Item not in your cart.', 404);

  // The unique index is (cart, variant, plan), so changing the plan can collide
  // with an existing line for the same variant — fold them together instead.
  const clash = await db.cartItem.findFirst({
    where: { cartId, variantId: item.variantId, protectionPlanId, id: { not: itemId } },
  });

  if (clash) {
    await db.$transaction([
      db.cartItem.update({
        where: { id: clash.id },
        data: { quantity: Math.min(MAX_PER_LINE, clash.quantity + item.quantity) },
      }),
      db.cartItem.delete({ where: { id: itemId } }),
    ]);
  } else {
    await db.cartItem.update({ where: { id: itemId }, data: { protectionPlanId } });
  }

  await touch(cartId);
  return { updated: true };
}

export async function setCartCoupon(cartId: string, couponCode: string | null) {
  await db.cart.update({
    where: { id: cartId },
    data: { couponCode: couponCode ? couponCode.trim().toUpperCase() : null },
  });
  return { updated: true };
}

export async function clearCart(cartId: string) {
  await db.cartItem.deleteMany({ where: { cartId } });
  await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });
  return { cleared: true };
}

async function touch(cartId: string) {
  await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
}

// ── Suggestions ───────────────────────────────────────────────────────

/**
 * Accessory bundle suggestions for the cart drawer and checkout upsell:
 * explicitly-linked accessories first, then popular ones for the same brand.
 */
export async function suggestedAccessories(cartId: string, limit = 6) {
  const items = await db.cartItem.findMany({
    where: { cartId },
    include: {
      variant: { select: { productId: true, product: { select: { brandId: true } } } },
    },
  });
  if (!items.length) return [];

  const productIds = [...new Set(items.map((i) => i.variant.productId))];
  const brandIds = [...new Set(items.map((i) => i.variant.product.brandId))];
  const inCart = new Set(productIds);

  const links = await db.accessoryLink.findMany({
    where: { productId: { in: productIds } },
    orderBy: { sortOrder: 'asc' },
    include: {
      accessory: {
        include: {
          brand: { select: { name: true } },
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
    },
    take: limit * 2,
  });

  const suggestions = links
    .map((l) => l.accessory)
    .filter((p) => p.status === 'active' && !inCart.has(p.id) && p.variants.length);

  if (suggestions.length < limit) {
    const filler = await db.product.findMany({
      where: {
        kind: 'accessory',
        status: 'active',
        brandId: { in: brandIds },
        id: { notIn: [...inCart, ...suggestions.map((s) => s.id)] },
      },
      orderBy: [{ soldCount: 'desc' }],
      take: limit - suggestions.length,
      include: {
        brand: { select: { name: true } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });
    suggestions.push(...filler.filter((f) => f.variants.length));
  }

  const pricing = await loadPricingContext();

  return suggestions.slice(0, limit).map((p) => {
    const v = p.variants[0];
    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brandName: p.brand.name,
      tagline: p.tagline,
      heroGradient: p.heroGradient,
      variantId: v.id,
      colorHex: v.colorHex,
      colorHex2: v.colorHex2,
      price: resolvePrice(
        v,
        {
          brandId: p.brandId,
          categoryId: p.categoryId,
          productId: p.id,
          variantId: v.id,
        },
        pricing,
      ),
    };
  });
}

/** Protection plans offered for the most expensive phone in the cart. */
export async function protectionOffersForCart(cartId: string) {
  const view = await getCart(cartId);
  const phoneLines = view.lines.filter((l) => !l.isAccessory);
  if (!phoneLines.length) return [];
  const dearest = phoneLines.reduce((a, b) =>
    b.price.finalPaise > a.price.finalPaise ? b : a,
  );
  const options = await getProtectionOptions(dearest.price.finalPaise);
  return options.map((o) => ({
    ...o,
    isActive: true,
    sortOrder: 0,
    priceType: o.priceType ?? 'percent',
    priceValue: o.priceValue ?? 0,
    appliesToKind: 'phone',
    coverage: o.coverage ?? [],
    forItemId: dearest.itemId,
    forProduct: dearest.productName,
  }));
}

// ── Abandonment ───────────────────────────────────────────────────────

/**
 * Flags carts that have sat untouched past the window. Called by the admin
 * Marketing module's recovery screen, which is also where the reminder is sent
 * from — so no scheduler is required for the feature to work.
 */
export async function sweepAbandonedCarts(olderThanHours = 6): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanHours * 3_600_000);
  const stale = await db.cart.findMany({
    where: {
      status: 'active',
      updatedAt: { lt: cutoff },
      items: { some: {} },
      abandonedCart: null,
    },
    include: {
      items: { include: { variant: { select: { pricePaise: true } } } },
      user: { select: { email: true, phone: true } },
    },
    take: 200,
  });

  for (const cart of stale) {
    const value = cart.items.reduce((s, i) => s + i.variant.pricePaise * i.quantity, 0);
    await db.abandonedCart.create({
      data: {
        cartId: cart.id,
        userId: cart.userId,
        email: cart.user?.email ?? null,
        phone: cart.user?.phone ?? null,
        itemCount: cart.items.length,
        valuePaise: value,
      },
    });
  }

  return stale.length;
}

/** Cart contents for the abandoned-cart recovery email. */
export async function abandonedCartPreview(cartId: string) {
  const items = await db.cartItem.findMany({
    where: { cartId },
    include: {
      variant: {
        include: { product: { select: { name: true, slug: true, heroGradient: true } } },
      },
    },
  });
  return items.map((i) => ({
    name: i.variant.product.name,
    slug: i.variant.product.slug,
    heroGradient: i.variant.product.heroGradient,
    label: variantLabel(i.variant),
    quantity: i.quantity,
    pricePaise: i.variant.pricePaise,
  }));
}
