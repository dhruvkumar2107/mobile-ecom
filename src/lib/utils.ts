import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Deterministic pseudo-random in [0,1) from a string — stable art per SKU. */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return dateTimeFmt.format(new Date(d));
}

export function relativeTime(d: Date | string): string {
  const then = new Date(d).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

/** Days between now and a future date, floored at 0. */
export function daysUntil(d: Date | string): number {
  const ms = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function addMonths(d: Date, months: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
}

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Safe JSON parse for the JSON-in-TEXT columns SQLite forces on us. */
export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function maskAccount(last4: string | null | undefined): string {
  return last4 ? `•••• •••• ${last4}` : '••••';
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const shown = name.slice(0, 2);
  return `${shown}${'•'.repeat(Math.max(2, name.length - 2))}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  return phone.replace(/^(\+?\d{2})(\d+)(\d{3})$/, (_m, a, mid, z) => `${a}${'•'.repeat(mid.length)}${z}`);
}

export function initials(name: string | null | undefined): string {
  if (!name) return 'V';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Indian mobile: 10 digits starting 6–9, optional +91. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(ten)) return null;
  return `+91${ten}`;
}

export function isValidPincode(pin: string): boolean {
  return /^[1-9]\d{5}$/.test(pin);
}

/** IFSC: 4 letters + 0 + 6 alphanumerics. */
export function isValidIfsc(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
}

export function isValidVpa(vpa: string): boolean {
  return /^[\w.\-]{2,60}@[a-zA-Z]{2,30}$/.test(vpa);
}

/** Luhn check — used to validate the IMEIs we mint per unit sold. */
export function isValidImei(imei: string): boolean {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(imei[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** Builds a Luhn-valid 15-digit IMEI from a 14-digit base. */
export function imeiCheckDigit(base14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = Number(base14[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return String((10 - (sum % 10)) % 10);
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

export function pluralise(n: number, one: string, many?: string): string {
  return n === 1 ? one : (many ?? `${one}s`);
}

/** Groups an array by a derived key, preserving insertion order. */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyOf: (item: T) => K,
): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const item of items) {
    const k = keyOf(item);
    const bucket = out.get(k);
    if (bucket) bucket.push(item);
    else out.set(k, [item]);
  }
  return out;
}

export function sum<T>(items: T[], valueOf: (item: T) => number): number {
  return items.reduce((acc, i) => acc + valueOf(i), 0);
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
