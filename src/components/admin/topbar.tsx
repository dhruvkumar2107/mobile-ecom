'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, ExternalLink, LogOut, Menu, Plug, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/lib/rbac';
import { Avatar, Tooltip } from '@/components/ui/misc';
import { activeNavItem, visibleNav } from './nav-config';

/** Exactly the fields §7 hands the shell — nothing here needs the full user row. */
export type AdminUser = {
  name: string | null;
  email: string | null;
  role: string;
  staffRoleName: string | null;
  permissions: string[];
};

/**
 * Plain, serialisable mirror of `driverStatus()` from `@/lib/gateways`. Declared
 * locally on purpose: the gateway module reads `process.env` and constructs the
 * Razorpay client, so it must never be pulled into the client bundle. The server
 * layout calls it and passes the result down as a prop.
 */
export type GatewayDriverStatus = {
  payments: { driver: string; live: boolean };
  payouts: { driver: string; live: boolean };
  verification: { driver: string; live: boolean };
  razorpayConfigured?: boolean;
  webhookConfigured?: boolean;
  xAccountConfigured?: boolean;
};

export function AdminTopbar({
  user,
  gateways,
  onOpenNav,
  breadcrumb,
}: {
  user: AdminUser;
  gateways?: GatewayDriverStatus | null;
  onOpenNav: () => void;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open admin navigation"
          className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          {breadcrumb ?? <AdminBreadcrumb permissions={user.permissions} />}
        </div>

        {hasPermission(user.permissions, 'orders.read') && <AdminSearch />}
        {gateways && <GatewayBadge status={gateways} />}
        <UserMenu user={user} />
      </div>
    </header>
  );
}

/**
 * Derived from the nav config so every new admin page inherits a breadcrumb for
 * free. Pages needing something richer pass `breadcrumb` in instead.
 */
function AdminBreadcrumb({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const groups = visibleNav(permissions);
  const active = activeNavItem(pathname, groups);
  const group = active ? groups.find((g) => g.items.some((i) => i.href === active.href)) : null;
  const isHome = active?.href === '/admin';

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link
        href="/admin"
        className={cn(
          'shrink-0 font-medium transition-colors',
          isHome || !active ? 'text-ink' : 'text-ink-3 hover:text-ink',
        )}
      >
        Admin
      </Link>
      {active && !isHome && (
        <>
          {group && group.id !== 'overview' && (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-ink-4" aria-hidden />
              <span className="hidden shrink-0 text-ink-3 sm:inline">{group.label}</span>
            </>
          )}
          <ChevronRight className="size-3.5 shrink-0 text-ink-4" aria-hidden />
          <span className="truncate font-medium text-ink" aria-current="page">
            {active.label}
          </span>
        </>
      )}
    </nav>
  );
}

/**
 * Operators hunt for orders by ID, phone or email all day, so the global field
 * goes straight to the order list rather than pretending to search everything.
 * The GET action keeps it working if the JS handler never runs.
 */
function AdminSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);

  // "/" jumps to search, the convention every operator already knows — but not
  // while they are typing into some other field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (el instanceof HTMLElement && el.isContentEditable) return;
      e.preventDefault();
      input.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <form
      action="/admin/orders"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        if (term) router.push(`/admin/orders?q=${encodeURIComponent(term)}`);
      }}
      role="search"
      className="hidden md:block"
    >
      <label htmlFor="admin-search" className="sr-only">
        Search orders
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-4"
          aria-hidden
        />
        <input
          ref={input}
          id="admin-search"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search orders"
          className="h-9 w-44 rounded-lg bg-panel-2/70 pr-9 pl-9 text-sm text-ink ring-1 ring-inset ring-line transition-all outline-none placeholder:text-ink-4 focus:w-64 focus:ring-2 focus:ring-volt-400/60 lg:w-56 lg:focus:w-72 [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-line-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-4"
        >
          /
        </kbd>
      </div>
    </form>
  );
}

/** Which payment stack is actually wired up — the one status nobody should guess. */
function GatewayBadge({ status }: { status: GatewayDriverStatus }) {
  const live = [status.payments.live, status.payouts.live, status.verification.live];
  const allLive = live.every(Boolean);
  const anyLive = live.some(Boolean);
  const label = allLive ? 'Live' : anyLive ? 'Part live' : 'Simulated';
  const tone = allLive
    ? 'bg-good-400/12 text-good-400 ring-good-400/25'
    : anyLive
      ? 'bg-warn-400/12 text-warn-400 ring-warn-400/25'
      : 'bg-ink-4/12 text-ink-2 ring-ink-4/25';

  return (
    <Tooltip
      side="bottom"
      content={
        <span className="block text-left">
          <span className="block">Payments · {status.payments.driver}</span>
          <span className="block">Payouts · {status.payouts.driver}</span>
          <span className="block">Verification · {status.verification.driver}</span>
        </span>
      }
    >
      <Link
        href="/admin/settings"
        className={cn(
          'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide whitespace-nowrap ring-1 ring-inset transition-opacity hover:opacity-85 sm:inline-flex',
          tone,
        )}
      >
        <Plug className="size-3" aria-hidden />
        Gateways · {label}
      </Link>
    </Tooltip>
  );
}

function UserMenu({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const roleLabel = user.staffRoleName ?? (user.role === 'admin' ? 'Super Admin' : 'Staff');

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* fall through — the navigation below re-checks the session anyway */
    }
    // Hard navigation: it drops every cached server payload the admin holds.
    window.location.href = '/login';
  }

  return (
    <div ref={wrap} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-xl pr-1.5 pl-1 transition-colors hover:bg-panel-2 sm:pr-2.5"
      >
        <Avatar name={user.name ?? user.email ?? 'Voltage'} size="sm" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[9rem] truncate text-xs font-medium text-ink">
            {user.name ?? user.email ?? 'Staff'}
          </span>
          <span className="block max-w-[9rem] truncate text-[10px] tracking-wide text-ink-3 uppercase">
            {roleLabel}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'hidden size-3.5 shrink-0 text-ink-3 transition-transform sm:block',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="animate-rise panel bevel absolute top-full right-0 z-50 mt-2 w-60 p-1.5"
        >
          <div className="border-b border-line px-2.5 pt-1.5 pb-2.5">
            <p className="truncate text-sm font-medium text-ink">{user.name ?? 'Staff'}</p>
            <p className="truncate text-xs text-ink-3">{user.email ?? 'No email on file'}</p>
            <p className="mt-1 text-[10px] font-medium tracking-wide text-volt-300 uppercase">
              {roleLabel}
            </p>
          </div>
          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <ExternalLink className="size-4 shrink-0 text-ink-3" aria-hidden />
            View storefront
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-2 transition-colors hover:bg-bad-500/10 hover:text-bad-400 disabled:opacity-50"
          >
            <LogOut className="size-4 shrink-0 text-ink-3" aria-hidden />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
