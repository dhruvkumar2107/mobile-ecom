import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { AuthError } from './auth';

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; fields?: Record<string, string> };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, init);
}

export function fail(error: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json<ApiErr>({ ok: false, error, fields }, { status });
}

/** Domain errors that are safe to surface verbatim to the client. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function flattenZod(err: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || 'form';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

/**
 * Wraps a route handler so every thrown error becomes a predictable JSON
 * envelope instead of an opaque 500. Unknown errors are logged server-side and
 * reported generically — never leak stack traces or Prisma internals.
 */
export function route<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<Response>,
) {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      if (err instanceof AuthError) return fail(err.message, err.status);
      if (err instanceof AppError) return fail(err.message, err.status, err.fields);
      if (err instanceof ZodError) {
        return fail('Please check the highlighted fields.', 422, flattenZod(err));
      }
      console.error('[api]', req.method, new URL(req.url).pathname, err);
      return fail('Something went wrong on our end. Please try again.', 500);
    }
  };
}

/** Parses and validates a JSON body, throwing ZodError for `route` to format. */
export async function body<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError('Expected a JSON body.', 400);
  }
  return schema.parse(raw);
}

export function query<T>(req: Request, schema: ZodSchema<T>): T {
  const url = new URL(req.url);
  const obj: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const all = url.searchParams.getAll(key);
    obj[key] = all.length > 1 ? all : all[0];
  }
  return schema.parse(obj);
}

export function clientIp(req: Request): string | null {
  const h = req.headers;
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return h.get('x-real-ip') ?? null;
}

/**
 * Coarse device fingerprint for referral fraud signals. Deliberately weak —
 * it flags for review, it never blocks on its own.
 */
export function deviceHint(req: Request): string {
  const ua = req.headers.get('user-agent') ?? '';
  const lang = req.headers.get('accept-language') ?? '';
  let h = 0;
  const s = `${ua}|${lang}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `dev_${(h >>> 0).toString(36)}`;
}

// ── In-memory rate limiter ────────────────────────────────────────────
// Adequate for a single-node prototype. Swap for Redis before running
// multiple instances, since each process keeps its own counters.

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function enforceRateLimit(key: string, limit: number, windowMs: number): void {
  if (!rateLimit(key, limit, windowMs)) {
    throw new AppError('Too many attempts. Please wait a minute and try again.', 429);
  }
}

// Opportunistic cleanup so the map can't grow without bound.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }, 300000).unref?.();
}
