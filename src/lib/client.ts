/**
 * ════════════════════════════════════════════════════════════════════════
 *  CLIENT FETCH
 * ════════════════════════════════════════════════════════════════════════
 *  The browser-side counterpart to `src/lib/api.ts`. Every route handler in
 *  VOLTAGE answers with the same envelope — `{ ok: true, data }` or
 *  `{ ok: false, error, fields? }` — so a client component should never have to
 *  look at `res.status`, parse JSON itself, or wrap a call in try/catch.
 *
 *  Two deliberate properties:
 *
 *   1. **It never throws.** A 422 with field errors, a 500, a dropped
 *      connection and an HTML error page all come back as `{ ok: false }` with
 *      customer-facing copy. Callers branch on `result.ok` and nothing else, so
 *      a forgotten catch can't leave a button spinning forever.
 *   2. **It never imports the server.** This module is pulled into client
 *      bundles, so it may not touch anything under `src/lib/services` or
 *      `src/lib/auth.ts` — those are `server-only`.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

export type ApiInit = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  json?: unknown;
  signal?: AbortSignal;
};

const OFFLINE = 'Could not reach VOLTAGE. Check your connection and try again.';
const CANCELLED = 'Request cancelled.';
const UNEXPECTED = 'Something went wrong on our end. Please try again.';

/**
 * A non-envelope body means the response never reached `route()` — a 404 on a
 * mistyped path, a proxy error page, a rewritten HTML shell. Map the status to
 * copy the customer can act on rather than showing them the raw body.
 */
function messageForStatus(status: number): string {
  if (status === 401) return 'Please sign in to continue.';
  if (status === 403) return 'You do not have access to that.';
  if (status === 404) return 'That is no longer available.';
  if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
  return UNEXPECTED;
}

function isEnvelope(value: unknown): value is ApiResult<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.ok === true) return 'data' in v;
  if (v.ok === false) return typeof v.error === 'string';
  return false;
}

export async function api<T = unknown>(path: string, init: ApiInit = {}): Promise<ApiResult<T>> {
  // A body implies a write — saves every caller repeating `method: 'POST'`.
  const method = init.method ?? (init.json === undefined ? 'GET' : 'POST');

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      // Session and cart live in httpOnly cookies; without this a same-origin
      // fetch in some browsers/embeds would look like a signed-out request.
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: init.json === undefined ? undefined : JSON.stringify(init.json),
      signal: init.signal,
      // Mutations and cart/auth reads must never be served from the HTTP cache.
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, error: CANCELLED };
    }
    return { ok: false, error: OFFLINE };
  }

  let raw: string;
  try {
    raw = await res.text();
  } catch {
    return { ok: false, error: res.ok ? UNEXPECTED : messageForStatus(res.status) };
  }

  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (isEnvelope(parsed)) return parsed as ApiResult<T>;

  return { ok: false, error: res.ok ? UNEXPECTED : messageForStatus(res.status) };
}
