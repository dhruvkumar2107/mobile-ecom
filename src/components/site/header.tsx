'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, Search, ShoppingBag, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Avatar } from '@/components/ui/misc';
import { BrandMark } from './brand-mark';
import {
  MobileNav,
  SHOP_NAV,
  SignOutButton,
  UTILITY_NAV,
  accountLinksFor,
  type SiteUser,
} from './mobile-nav';
import { SearchCommand } from './search-command';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  SITE HEADER
 * ════════════════════════════════════════════════════════════════════════
 *  The storefront chrome. It renders on every shop page, so it is deliberately
 *  cheap: no motion library, no popover library, no client data fetching. The
 *  only asynchronous thing it owns is the search palette, and that is lazy by
 *  virtue of only fetching once you type.
 *
 *  It takes plain serialisable props — `src/lib/auth.ts` is `server-only`, so
 *  the `(shop)` layout resolves the user and the cart count on the server and
 *  hands down the four fields the chrome actually renders.
 */

export function SiteHeader({
  user,
  cartCount,
  announcement,
}: {
  user: { name: string | null; email: string | null; role: string; loyaltyTier: string } | null;
  cartCount: number;
  announcement: { text: string; enabled: boolean };
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Outside click / Escape for the account dropdown. A whole popover library
  // for one menu is not a trade worth making on a page that must load fast.
  useEffect(() => {
    if (!accountOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  // Any navigation dismisses the menu — otherwise it hangs open over the page
  // you just moved to.
  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  const navLinks = [...SHOP_NAV, ...UTILITY_NAV];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {announcement.enabled && announcement.text && (
        <div className="border-b border-line bg-gradient-to-r from-volt-500/10 via-plasma-500/10 to-volt-500/10">
          <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[12px] leading-snug text-ink-2 sm:px-6 lg:px-8">
            <Zap className="size-3 shrink-0 fill-volt-300 text-volt-300" aria-hidden />
            {announcement.text}
          </p>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-line bg-void/75 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <Link href="/" className="shrink-0 rounded-lg" aria-label="VOLTAGE — home">
              <BrandMark size="sm" className="sm:hidden" />
              <BrandMark size="md" className="hidden sm:inline-flex" />
            </Link>

            <nav aria-label="Primary" className="ml-4 hidden min-w-0 flex-1 overflow-hidden items-center gap-0.5 lg:flex">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative rounded-lg px-2.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors',
                      active ? 'text-ink' : 'text-ink-2 hover:text-ink',
                    )}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute inset-x-2.5 -bottom-[13px] h-0.5 rounded-full bg-volt-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
              {/* Desktop: a field-shaped button. It is a button, not an input —
                  the palette owns the query, so a second focusable field here
                  would only be a place for text to get lost. */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden h-9 w-56 items-center gap-2 rounded-xl bg-panel-2 px-3 text-left text-sm text-ink-4 ring-1 ring-inset ring-line-2 transition-colors hover:ring-volt-400/40 md:flex xl:w-72"
              >
                <Search className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">Search devices</span>
                <kbd className="shrink-0 rounded border border-line-2 bg-abyss px-1.5 py-0.5 font-sans text-[10px] text-ink-3">
                  ⌘K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="flex size-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink md:hidden"
              >
                <Search className="size-5" />
              </button>

              <Link
                href="/cart"
                aria-label={
                  cartCount > 0
                    ? `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`
                    : 'Cart, empty'
                }
                className="relative flex size-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink"
              >
                <ShoppingBag className="size-5" />
                {cartCount > 0 && (
                  <span className="tabular absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-volt-400 px-1 text-[10px] font-bold text-void">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div ref={accountRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((o) => !o)}
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl py-1 pr-1.5 pl-1 transition-colors hover:bg-panel-2',
                      accountOpen && 'bg-panel-2',
                    )}
                  >
                    <Avatar name={user.name} size="sm" />
                    <span className="hidden max-w-28 truncate text-sm font-medium text-ink lg:block">
                      {firstName(user.name)}
                    </span>
                    <ChevronDown
                      className={cn(
                        'hidden size-4 text-ink-3 transition-transform lg:block',
                        accountOpen && 'rotate-180',
                      )}
                      aria-hidden
                    />
                  </button>

                  {accountOpen && (
                    <div
                      role="menu"
                      aria-label="Account"
                      className="animate-rise panel bevel absolute right-0 z-50 mt-2 w-64 p-2"
                    >
                      <div className="border-b border-line px-3 pt-1.5 pb-3">
                        <p className="truncate text-sm font-medium text-ink">
                          {user.name ?? 'Your account'}
                        </p>
                        {user.email && (
                          <p className="truncate text-xs text-ink-3">{user.email}</p>
                        )}
                        <Badge tone="violet" size="xs" className="mt-2 capitalize">
                          {user.loyaltyTier} member
                        </Badge>
                      </div>

                      <div className="py-1">
                        <MenuLink href="/account" onNavigate={() => setAccountOpen(false)}>
                          Account overview
                        </MenuLink>
                        {accountLinksFor(user.role).map((link) => {
                          const Icon = link.icon;
                          return (
                            <MenuLink
                              key={link.href}
                              href={link.href}
                              onNavigate={() => setAccountOpen(false)}
                              icon={<Icon className="size-4 text-ink-3" />}
                            >
                              {link.label}
                            </MenuLink>
                          );
                        })}
                      </div>

                      <div className="border-t border-line pt-1">
                        <SignOutButton onDone={() => setAccountOpen(false)} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    aria-label="Sign in"
                    className="flex size-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink lg:hidden"
                  >
                    <User className="size-5" />
                  </Link>
                  <div className="ml-1 hidden items-center gap-1.5 lg:flex">
                    <Link
                      href="/login"
                      className="rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
                    >
                      Sign in
                    </Link>
                    <ButtonLink href="/signup" size="sm" variant="outline">
                      Create account
                    </ButtonLink>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileNav open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user as SiteUser | null} />
      <SearchCommand
        open={searchOpen}
        onOpen={() => setSearchOpen(true)}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}

function firstName(name: string | null): string {
  if (!name) return 'Account';
  return name.split(/\s+/)[0] || 'Account';
}

function MenuLink({
  href,
  children,
  icon,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink"
    >
      {icon ?? <span className="size-4" aria-hidden />}
      {children}
    </Link>
  );
}
