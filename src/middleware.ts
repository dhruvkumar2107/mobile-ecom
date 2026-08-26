import { NextResponse, type NextRequest } from 'next/server';

/**
 * Sends phone traffic to the /mobile app and keeps tablets/desktops on the
 * main site.
 *
 * Deliberately conservative:
 *  - only rewrites GET navigations for the marketing/shop surface
 *  - never touches /api, /admin, /account, auth flows or static assets
 *  - `?desktop=1` (persisted in a cookie) is an explicit opt-out, so a phone
 *    user who wants the full site is not trapped in a redirect loop
 */

const MOBILE_UA =
  /android.+mobile|iphone|ipod|blackberry|iemobile|opera mini|windows phone|webos/i;

// Paths that must always render the desktop/shared experience.
const EXCLUDED_PREFIXES = [
  '/mobile',
  '/api',
  '/admin',
  '/account',
  '/login',
  '/register',
  '/signin',
  '/signup',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
];

/** Root and shop paths that have a hand-built mobile counterpart. */
const MOBILE_ROUTES: Array<{ test: RegExp; to: (m: RegExpMatchArray) => string }> = [
  { test: /^\/$/, to: () => '/mobile' },
  { test: /^\/products?\/([^/]+)\/?$/, to: (m) => `/mobile/product/${m[1]}` },
  { test: /^\/(products|shop|catalog)\/?$/, to: () => '/mobile/search' },
  { test: /^\/search\/?$/, to: () => '/mobile/search' },
  { test: /^\/cart\/?$/, to: () => '/mobile/cart' },
  { test: /^\/checkout\/?$/, to: () => '/mobile/checkout' },
  { test: /^\/wishlist\/?$/, to: () => '/mobile/wishlist' },
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (request.method !== 'GET') return NextResponse.next();
  if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  // Files with an extension are assets, not navigations.
  if (/\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();

  // Explicit opt-out, sticky for the session.
  if (searchParams.get('desktop') === '1') {
    const res = NextResponse.next();
    res.cookies.set('prefer-desktop', '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
    return res;
  }
  if (request.cookies.get('prefer-desktop')?.value === '1') return NextResponse.next();

  const ua = request.headers.get('user-agent') ?? '';
  if (!MOBILE_UA.test(ua)) return NextResponse.next();

  for (const route of MOBILE_ROUTES) {
    const match = pathname.match(route.test);
    if (match) {
      const url = request.nextUrl.clone();
      url.pathname = route.to(match);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Skip the matcher entirely for Next internals and image assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
