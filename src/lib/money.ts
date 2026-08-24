/**
 * Money. Every amount in VOLTAGE is an integer number of paise.
 * Floats are never used for money — `0.1 + 0.2 !== 0.3` is not acceptable
 * when reconciling a payout ledger against a gateway settlement file.
 */

export const PAISE = 100;

export function toPaise(rupees: number): number {
  return Math.round(rupees * PAISE);
}

export function toRupees(paise: number): number {
  return paise / PAISE;
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrFormatterPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,29,900 — the storefront default. */
export function formatINR(paise: number): string {
  return inrFormatter.format(paise / PAISE);
}

/** ₹1,29,900.00 — ledgers, invoices, payout statements. */
export function formatINRExact(paise: number): string {
  return inrFormatterPaise.format(paise / PAISE);
}

/** Compact Indian units for dashboard tiles: ₹1.2Cr, ₹45.3L, ₹12.5K. */
export function formatINRCompact(paise: number): string {
  const rupees = paise / PAISE;
  const abs = Math.abs(rupees);
  if (abs >= 1e7) return `₹${(rupees / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(rupees / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `₹${(rupees / 1e3).toFixed(1)}K`;
  return `₹${Math.round(rupees)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

/** Percent off, rounded the way retail displays it. */
export function discountPercent(mrpPaise: number, pricePaise: number): number {
  if (mrpPaise <= 0 || pricePaise >= mrpPaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}

/**
 * Splits a total into `n` integer parts that sum back exactly to the total.
 * Used for EMI schedules — the last instalment absorbs the rounding remainder
 * so the customer is never charged a stray paisa more than the loan.
 */
export function splitEvenly(totalPaise: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(totalPaise / n);
  const parts = Array<number>(n).fill(base);
  let remainder = totalPaise - base * n;
  for (let i = 0; remainder > 0; i = (i + 1) % n) {
    parts[i] += 1;
    remainder -= 1;
  }
  return parts;
}

/** Applies a percentage in whole numbers, rounding half-up. */
export function percentOf(paise: number, percent: number): number {
  return Math.round((paise * percent) / 100);
}

/** Applies basis points (100 bps = 1%). */
export function bpsOf(paise: number, bps: number): number {
  return Math.round((paise * bps) / 10000);
}

/** Invoice round-off to the nearest rupee, GST style. Returns [total, roundOff]. */
export function roundToRupee(paise: number): [number, number] {
  const rounded = Math.round(paise / PAISE) * PAISE;
  return [rounded, rounded - paise];
}

export function clampPaise(v: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  return Math.min(Math.max(Math.round(v), min), max);
}
