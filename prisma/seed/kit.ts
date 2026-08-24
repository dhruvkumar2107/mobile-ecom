import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  SEED KIT
 * ════════════════════════════════════════════════════════════════════════
 *  Shared plumbing for the seed modules.
 *
 *  The seed writes rows directly through Prisma rather than calling the
 *  service layer. Two reasons, both deliberate:
 *
 *   1. Every service module opens with `import 'server-only'`, which Next
 *      aliases inside its bundler but plain Node cannot resolve — so the
 *      services are physically unreachable from `tsx prisma/seed.ts`.
 *   2. Even if they were reachable, running fixtures through
 *      `placeOrder`/`initiatePayment` would fire notifications, mutate
 *      coupon counters and hit the gateway adapter. A seed wants inert,
 *      reproducible rows, not business-logic side effects.
 *
 *  The cost is that the small amount of arithmetic the seed needs (GST
 *  extraction, EMI amortisation) is restated here. Both are a handful of
 *  lines and are cross-checked against the service implementations.
 */

/**
 * Same backend choice as src/lib/db.ts: seed whichever database the app will
 * actually read. The Prisma CLI resolves `prisma db push` against the
 * datasource URL and ignores driver adapters, so without this the seed would
 * silently fill the local file while the deployed app read an empty Turso.
 */
function createSeedClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (!tursoUrl) return new PrismaClient();

  const adapter = new PrismaLibSQL(
    createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN }),
  );
  return new PrismaClient({ adapter });
}

export const prisma = createSeedClient();

/** Wall-clock anchor. Everything else is expressed relative to it. */
export const NOW = new Date();

// ─────────────────────────── deterministic randomness ───────────────────

/**
 * mulberry32. A seeded PRNG keeps reruns comparable — a diff between two
 * seeded databases should come from a code change, not from `Math.random`.
 */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

/** Inclusive integer in [min, max]. */
export function int(rand: Rng, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function pick<T>(rand: Rng, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

/** n distinct members, or the whole list when it is shorter than n. */
export function sample<T>(rand: Rng, items: readonly T[], n: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]!);
  }
  return out;
}

export function chance(rand: Rng, probability: number): boolean {
  return rand() < probability;
}

// ─────────────────────────── dates ──────────────────────────────────────

export function daysAgo(n: number, from: Date = NOW): Date {
  return new Date(from.getTime() - n * 86_400_000);
}

export function daysAhead(n: number, from: Date = NOW): Date {
  return new Date(from.getTime() + n * 86_400_000);
}

export function hoursAgo(n: number, from: Date = NOW): Date {
  return new Date(from.getTime() - n * 3_600_000);
}

export function minutesAfter(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 60_000);
}

export function monthsAhead(n: number, from: Date = NOW): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function dayKey(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

// ─────────────────────────── money ──────────────────────────────────────

/** Rupees to paise, written at call sites as `rs(129900)`. */
export function rs(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Mirror of `extractGst` in src/lib/services/gst.ts. Storefront prices are
 * GST-inclusive, so tax comes back out of the gross rather than going on top,
 * which keeps taxable + tax === gross to the paise.
 */
export function gstSplit(grossPaise: number, gstRate: number, isInterState: boolean) {
  const taxable = Math.round((grossPaise * 100) / (100 + gstRate));
  const tax = grossPaise - taxable;
  const half = Math.floor(tax / 2);
  return {
    taxablePaise: taxable,
    taxPaise: tax,
    cgstPaise: isInterState ? 0 : tax - half,
    sgstPaise: isInterState ? 0 : half,
    igstPaise: isInterState ? tax : 0,
  };
}

/** Mirror of `splitEvenly` — the parts always sum back to the total. */
export function splitEvenly(totalPaise: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(totalPaise / n);
  const remainder = totalPaise - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

// ─────────────────────────── logging ────────────────────────────────────

let step = 0;
const t0 = Date.now();

export function log(label: string, count?: number) {
  step += 1;
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const tail = count === undefined ? '' : ` — ${count}`;
  console.log(`  ${String(step).padStart(2, '0')}. ${label}${tail}  (${secs}s)`);
}

export function heading(text: string) {
  console.log(`\n\u001b[36m${text}\u001b[0m`);
}
