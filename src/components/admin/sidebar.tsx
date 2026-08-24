'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { activeNavItem, visibleNav, type NavGroup } from './nav-config';

/** Kept here so the shell can offset `<main>` by exactly the rail width. */
export const SIDEBAR_W = '16rem';
export const SIDEBAR_RAIL_W = '4.5rem';

const STORAGE_KEY = 'voltage.admin.sidebar';

/**
 * Collapse state lives in `localStorage` rather than a cookie: it is a personal
 * viewport preference, not something the server needs to render. Reading it in
 * an effect (never during render) keeps the server and client markup identical
 * on first paint — the `ready` flag then suppresses the width transition so the
 * restored rail does not animate open on every navigation.
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* private mode or blocked storage — the default expanded rail is fine */
    }
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* preference simply will not persist */
      }
      return next;
    });
  }, []);

  return { collapsed, toggle, ready };
}

export function AdminSidebar({
  permissions,
  collapsed,
  onToggle,
  ready = true,
}: {
  permissions: string[];
  collapsed: boolean;
  onToggle: () => void;
  ready?: boolean;
}) {
  return (
    <aside
      aria-label="Admin sections"
      style={{ width: collapsed ? SIDEBAR_RAIL_W : SIDEBAR_W }}
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-abyss/80 backdrop-blur-xl lg:flex',
        ready && 'transition-[width] duration-300 ease-out',
      )}
    >
      <BrandMark collapsed={collapsed} />
      <AdminNav permissions={permissions} collapsed={collapsed} className="flex-1 overflow-y-auto px-2.5 py-4" />
      <div className="border-t border-line p-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className={cn(
            'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" aria-hidden />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/** Typographic brand mark — there are no image assets in this build. */
export function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn('flex h-16 shrink-0 items-center border-b border-line px-4', collapsed && 'justify-center px-0')}>
      <Link
        href="/admin"
        className="group flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-volt-400/60"
        aria-label="VOLTAGE admin home"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-volt-400/12 text-volt-300 ring-1 ring-inset ring-volt-400/25 transition-colors group-hover:bg-volt-400/20">
          <Zap className="size-4" aria-hidden />
        </span>
        {!collapsed && (
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-[0.18em] text-ink uppercase">Voltage</span>
            <span className="block text-[10px] font-medium tracking-wider text-ink-4 uppercase">Control room</span>
          </span>
        )}
      </Link>
    </div>
  );
}

/**
 * The nav list itself. Shared by the fixed desktop rail and the mobile drawer,
 * which is why it takes `onNavigate` — the drawer has to close on selection.
 */
export function AdminNav({
  permissions,
  collapsed = false,
  onNavigate,
  className,
}: {
  permissions: string[];
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const groups: NavGroup[] = useMemo(() => visibleNav(permissions), [permissions]);
  const active = useMemo(() => activeNavItem(pathname, groups), [pathname, groups]);

  if (!groups.length) {
    return (
      <nav className={className}>
        <p className="px-2.5 text-xs leading-relaxed text-ink-3">
          Your role has no admin modules enabled yet. Ask a Super Admin to grant access.
        </p>
      </nav>
    );
  }

  return (
    <nav className={className}>
      {groups.map((group) => (
        <div key={group.id} className="mb-4 last:mb-0">
          {collapsed ? (
            <div className="mx-2.5 mb-2 h-px bg-line" aria-hidden />
          ) : (
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-[0.14em] text-ink-4 uppercase">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = active?.href === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-volt-400/12 text-volt-200 ring-1 ring-inset ring-volt-400/25'
                        : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
                    )}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-volt-400"
                        aria-hidden
                      />
                    )}
                    <Icon
                      className={cn('size-4 shrink-0', isActive ? 'text-volt-300' : 'text-ink-3 group-hover:text-ink-2')}
                      aria-hidden
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {collapsed && <span className="sr-only">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
