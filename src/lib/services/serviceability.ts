import 'server-only';

import { db } from '../db';
import { AppError } from '../api';
import { addDays, isValidPincode, parseJson } from '../utils';
import { getSettings } from './settings';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  SERVICEABILITY & SHIPPING
 * ════════════════════════════════════════════════════════════════════════
 *  A pincode answers four separate questions, and conflating them is how COD
 *  orders end up stuck in a warehouse:
 *
 *    1. do we deliver there at all?
 *    2. is COD allowed there?
 *    3. what is the COD ceiling for that pincode?
 *    4. how long will it take, and what does shipping cost?
 *
 *  Unknown pincodes are handled by prefix-matching a shipping zone rather than
 *  rejecting the order — the pincode table is a curated override list, not an
 *  exhaustive directory of all ~19,000 Indian pincodes.
 */

export type ServiceabilityResult = {
  pincode: string;
  isServiceable: boolean;
  city: string | null;
  state: string | null;
  zone: string;
  codAvailable: boolean;
  codLimitPaise: number;
  expressAvailable: boolean;
  deliveryDays: number;
  expectedBy: Date;
  /** True when we inferred the answer from a zone instead of an exact row. */
  isEstimate: boolean;
  message: string;
};

const ZONE_DEFAULT_DAYS: Record<string, number> = {
  metro: 2,
  tier1: 3,
  tier2: 5,
  remote: 8,
};

/** Cutoff hour after which today no longer counts as a dispatch day. */
const DISPATCH_CUTOFF_HOUR = 16;

function expectedBy(days: number, from = new Date()): Date {
  const base = from.getHours() >= DISPATCH_CUTOFF_HOUR ? addDays(from, 1) : from;
  let d = base;
  let added = 0;
  // Couriers don't deliver on Sundays; walk the calendar rather than guessing.
  while (added < days) {
    d = addDays(d, 1);
    if (d.getDay() !== 0) added += 1;
  }
  return d;
}

export async function checkPincode(rawPincode: string): Promise<ServiceabilityResult> {
  const pincode = rawPincode.trim();
  if (!isValidPincode(pincode)) {
    throw new AppError('Enter a valid 6-digit pincode.', 400, { pincode: 'Invalid pincode' });
  }

  const exact = await db.pincodeServiceability.findUnique({ where: { pincode } });

  if (exact) {
    const days = exact.deliveryDays;
    return {
      pincode,
      isServiceable: exact.isServiceable,
      city: exact.city,
      state: exact.state,
      zone: exact.zone,
      codAvailable: exact.isServiceable && exact.codAvailable,
      codLimitPaise: exact.codLimitPaise,
      expressAvailable: exact.isServiceable && exact.expressAvailable,
      deliveryDays: days,
      expectedBy: expectedBy(days),
      isEstimate: false,
      message: exact.isServiceable
        ? `Delivering to ${exact.city}, ${exact.state}`
        : `We don't deliver to ${exact.city} yet. Sorry.`,
    };
  }

  // Fall back to zone inference by pincode prefix.
  const zone = await findZoneForPincode(pincode);
  const settings = await getSettings();
  const days = zone?.deliveryDays ?? ZONE_DEFAULT_DAYS.tier2;

  return {
    pincode,
    isServiceable: true,
    city: null,
    state: null,
    zone: zone ? zone.name : 'tier2',
    // COD on an unverified pincode is capped conservatively — an unknown
    // location is exactly where COD risk concentrates.
    codAvailable: true,
    codLimitPaise: Math.min(settings.codMaxOrderPaise, 3_000_000),
    expressAvailable: false,
    deliveryDays: days,
    expectedBy: expectedBy(days),
    isEstimate: true,
    message: `Estimated delivery in ${days} working days`,
  };
}

export type ZoneMatch = {
  id: string;
  name: string;
  baseRatePaise: number;
  freeAbovePaise: number;
  codFeePaise: number;
  expressRatePaise: number;
  deliveryDays: number;
};

/** Longest matching prefix wins, so a 3-digit rule beats a 2-digit one. */
export async function findZoneForPincode(pincode: string): Promise<ZoneMatch | null> {
  const zones = await db.shippingZone.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  let best: { zone: (typeof zones)[number]; len: number } | null = null;
  for (const zone of zones) {
    for (const prefix of parseJson<string[]>(zone.pincodePrefixes, [])) {
      if (pincode.startsWith(prefix) && (!best || prefix.length > best.len)) {
        best = { zone, len: prefix.length };
      }
    }
  }
  if (best) return pick(best.zone);

  return zones.length ? pick(zones[0]) : null;
}

export async function findZoneForState(state: string): Promise<ZoneMatch | null> {
  const zones = await db.shippingZone.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  const norm = state.trim().toLowerCase();
  const hit = zones.find((z) =>
    parseJson<string[]>(z.states, []).some((s) => s.trim().toLowerCase() === norm),
  );
  return hit ? pick(hit) : zones.length ? pick(zones[0]) : null;
}

function pick(z: {
  id: string;
  name: string;
  baseRatePaise: number;
  freeAbovePaise: number;
  codFeePaise: number;
  expressRatePaise: number;
  deliveryDays: number;
}): ZoneMatch {
  return {
    id: z.id,
    name: z.name,
    baseRatePaise: z.baseRatePaise,
    freeAbovePaise: z.freeAbovePaise,
    codFeePaise: z.codFeePaise,
    expressRatePaise: z.expressRatePaise,
    deliveryDays: z.deliveryDays,
  };
}

// ── Shipping quote ────────────────────────────────────────────────────

export type ShippingQuote = {
  shippingPaise: number;
  codFeePaise: number;
  isFreeShipping: boolean;
  deliveryDays: number;
  expectedBy: Date;
  fulfilmentType: 'standard' | 'express';
  zoneName: string;
};

export async function quoteShipping(input: {
  pincode: string;
  subtotalPaise: number;
  express?: boolean;
  isCod?: boolean;
}): Promise<ShippingQuote> {
  const [service, zone, settings] = await Promise.all([
    checkPincode(input.pincode),
    findZoneForPincode(input.pincode),
    getSettings(),
  ]);

  if (!service.isServiceable) {
    throw new AppError(service.message, 400, { pincode: 'Not serviceable' });
  }

  const freeAbove = zone?.freeAbovePaise ?? settings.freeShippingAbovePaise;
  const isFree = input.subtotalPaise >= freeAbove;
  const express = Boolean(input.express) && service.expressAvailable;

  // Express is a paid upgrade even on a free-shipping order — the free
  // threshold buys standard delivery, not the fastest option we have.
  const shippingPaise = express
    ? (zone?.expressRatePaise ?? settings.expressShippingPaise)
    : isFree
      ? 0
      : (zone?.baseRatePaise ?? settings.standardShippingPaise);

  const days = express ? Math.max(1, service.deliveryDays - 1) : service.deliveryDays;

  return {
    shippingPaise,
    codFeePaise: input.isCod ? (zone?.codFeePaise ?? settings.codFeePaise) : 0,
    isFreeShipping: isFree && !express,
    deliveryDays: days,
    expectedBy: expectedBy(days),
    fulfilmentType: express ? 'express' : 'standard',
    zoneName: zone?.name ?? service.zone,
  };
}

/**
 * The COD gate. Returns a reason rather than a bare boolean so checkout can
 * tell the customer *why* COD is greyed out instead of hiding the option.
 */
export async function checkCodEligibility(input: {
  pincode: string;
  orderTotalPaise: number;
  userId?: string | null;
}): Promise<{ allowed: boolean; reason: string | null; limitPaise: number }> {
  const [service, settings] = await Promise.all([checkPincode(input.pincode), getSettings()]);

  if (!service.isServiceable) {
    return { allowed: false, reason: service.message, limitPaise: 0 };
  }
  if (!service.codAvailable) {
    return {
      allowed: false,
      reason: `Cash on delivery isn't available for ${service.city ?? 'this pincode'}.`,
      limitPaise: 0,
    };
  }

  const limit = Math.min(service.codLimitPaise, settings.codMaxOrderPaise);
  if (input.orderTotalPaise > limit) {
    return {
      allowed: false,
      reason: `Cash on delivery is capped at ₹${(limit / 100).toLocaleString('en-IN')} for this pincode. Pay online to continue.`,
      limitPaise: limit,
    };
  }

  if (input.userId) {
    // A customer sitting on undelivered COD orders is the classic COD abuse
    // pattern; make them clear the backlog before adding another.
    const openCod = await db.order.count({
      where: {
        userId: input.userId,
        paymentMethod: 'cod',
        status: { in: ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery'] },
      },
    });
    if (openCod >= 2) {
      return {
        allowed: false,
        reason: 'You already have 2 cash-on-delivery orders in transit. Pay online for this one.',
        limitPaise: limit,
      };
    }

    const refused = await db.order.count({
      where: { userId: input.userId, paymentMethod: 'cod', status: 'returned' },
    });
    if (refused >= 3) {
      return {
        allowed: false,
        reason: 'Cash on delivery is unavailable on this account. Please pay online.',
        limitPaise: limit,
      };
    }
  }

  return { allowed: true, reason: null, limitPaise: limit };
}

// ── Admin ─────────────────────────────────────────────────────────────

export async function listPincodes(opts: {
  search?: string;
  codOnly?: boolean;
  take?: number;
  skip?: number;
} = {}) {
  const where = {
    ...(opts.search
      ? {
          OR: [
            { pincode: { startsWith: opts.search } },
            { city: { contains: opts.search } },
            { state: { contains: opts.search } },
          ],
        }
      : {}),
    ...(opts.codOnly ? { codAvailable: true } : {}),
  };

  const [rows, total] = await Promise.all([
    db.pincodeServiceability.findMany({
      where,
      orderBy: { pincode: 'asc' },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
    }),
    db.pincodeServiceability.count({ where }),
  ]);
  return { rows, total };
}

export async function upsertPincode(input: {
  pincode: string;
  city: string;
  state: string;
  zone?: string;
  isServiceable?: boolean;
  codAvailable?: boolean;
  codLimitPaise?: number;
  expressAvailable?: boolean;
  deliveryDays?: number;
}) {
  if (!isValidPincode(input.pincode)) throw new AppError('Enter a valid 6-digit pincode.');
  const data = {
    city: input.city,
    state: input.state,
    zone: input.zone ?? 'tier2',
    isServiceable: input.isServiceable ?? true,
    codAvailable: input.codAvailable ?? true,
    codLimitPaise: input.codLimitPaise ?? 5_000_000,
    expressAvailable: input.expressAvailable ?? false,
    deliveryDays: input.deliveryDays ?? ZONE_DEFAULT_DAYS[input.zone ?? 'tier2'] ?? 4,
  };
  return db.pincodeServiceability.upsert({
    where: { pincode: input.pincode },
    create: { pincode: input.pincode, ...data },
    update: data,
  });
}

/** Bulk toggle for the admin serviceability grid, e.g. suspend COD in a state. */
export async function bulkSetCod(input: {
  state?: string;
  zone?: string;
  codAvailable: boolean;
}): Promise<number> {
  if (!input.state && !input.zone) {
    throw new AppError('Specify a state or a zone to update.');
  }
  const res = await db.pincodeServiceability.updateMany({
    where: {
      ...(input.state ? { state: input.state } : {}),
      ...(input.zone ? { zone: input.zone } : {}),
    },
    data: { codAvailable: input.codAvailable },
  });
  return res.count;
}

// ── Service centre locator ────────────────────────────────────────────

/**
 * Nearest-first service centres. Distance is great-circle from the pincode's
 * city coordinates when we have them, otherwise we fall back to matching on
 * city and state, which is still useful and never wrong-by-kilometres.
 */
export async function findServiceCentres(input: {
  pincode?: string;
  city?: string;
  state?: string;
  brandId?: string;
  lat?: number;
  lng?: number;
}) {
  const centres = await db.serviceCenter.findMany({
    where: {
      isActive: true,
      ...(input.brandId ? { brands: { some: { brandId: input.brandId } } } : {}),
      ...(input.city ? { city: { contains: input.city } } : {}),
      ...(input.state && !input.city ? { state: { contains: input.state } } : {}),
    },
    include: { brands: { include: { brand: { select: { name: true, slug: true } } } } },
    take: 60,
  });

  const withDistance = centres.map((c) => ({
    ...c,
    brandNames: c.brands.map((b) => b.brand.name),
    distanceKm:
      input.lat != null && input.lng != null && c.latitude != null && c.longitude != null
        ? haversineKm(input.lat, input.lng, c.latitude, c.longitude)
        : null,
  }));

  withDistance.sort((a, b) => {
    if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
    if (a.distanceKm != null) return -1;
    if (b.distanceKm != null) return 1;
    return a.city.localeCompare(b.city);
  });

  return withDistance.slice(0, 20);
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
