'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CornerDownLeft,
  GitCompare,
  Layers,
  Loader2,
  Search,
  Smartphone,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/money';
import { api } from '@/lib/client';
import { SHOP_NAV } from './mobile-nav';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  SEARCH COMMAND
 * ════════════════════════════════════════════════════════════════════════
 *  Command-palette search over `GET /api/search/suggest`. Cmd/Ctrl-K or `/`
 *  opens it from anywhere on the storefront; arrows walk the results, Enter
 *  opens one, Escape closes.
 *
 *  Built as a bare fixed panel rather than on `Modal` for one reason: a palette
 *  has to sit near the top of the viewport. `Modal` bottom-sheets on mobile,
 *  which on a phone puts the results exactly where the soft keyboard lands.
 *  The Escape / scroll-lock / focus-restore behaviour is reproduced below.
 */

/**
 * Mirrors `Suggestion` in `src/lib/services/catalog.ts`. That module is
 * `server-only`, so the shape is restated here instead of imported — this file
 * ships to the browser.
 */
type Suggestion = {
  type: 'product' | 'brand' | 'category';
  label: string;
  sublabel: string | null;
  href: string;
  pricePaise: number | null;
  accent: string | null;
};

type RowKind = Suggestion['type'] | 'all';

type Row = {
  index: number;
  kind: RowKind;
  href: string;
  label: string;
  sublabel: string | null;
  pricePaise: number | null;
  accent: string | null;
};

const GROUPS: ReadonlyArray<{ kind: RowKind; title: string | null }> = [
  { kind: 'product', title: 'Devices' },
  { kind: 'brand', title: 'Brands' },
  { kind: 'category', title: 'Categories' },
  { kind: 'all', title: null },
];

const ROW_ICON: Record<RowKind, React.ComponentType<{ className?: string }>> = {
  product: Smartphone,
  brand: Tag,
  category: Layers,
  all: Search,
};

/** The suggest endpoint ignores anything shorter, so don't spend the request. */
const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

export function SearchCommand({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<Element | null>(null);

  const [q, setQ] = useState('');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);

  const term = q.trim();

  // ── Global shortcuts. Mounted whether or not the palette is open, which is
  // why this component renders (and returns null) instead of being unmounted.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onOpen();
        return;
      }
      if (open && e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      // Bare "/" is a search shortcut everywhere except inside a field.
      if (!open && e.key === '/' && !e.metaKey && !e.ctrlKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        onOpen();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpen, onClose]);

  // ── Scroll lock + focus handling while open.
  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      (restoreTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  // ── Debounced suggest. The abort matters as much as the delay: typing
  // "iphone" fires six requests and only the last one may resolve last.
  useEffect(() => {
    if (term.length < MIN_QUERY) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const res = await api<Suggestion[]>(`/api/search/suggest?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setLoading(false);
      if (res.ok) {
        setItems(res.data);
        setError(null);
      } else {
        setItems([]);
        setError(res.error);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const group of GROUPS) {
      if (group.kind === 'all') continue;
      for (const s of items) {
        if (s.type !== group.kind) continue;
        out.push({
          index: out.length,
          kind: s.type,
          href: s.href,
          label: s.label,
          sublabel: s.sublabel,
          pricePaise: s.pricePaise,
          accent: s.accent,
        });
      }
    }
    if (term.length >= MIN_QUERY) {
      out.push({
        index: out.length,
        kind: 'all',
        href: `/products?q=${encodeURIComponent(term)}`,
        label: `Search the full catalogue for “${term}”`,
        sublabel: null,
        pricePaise: null,
        accent: null,
      });
    }
    return out;
  }, [items, term]);

  // Any new result set puts the highlight back on the strongest match.
  useEffect(() => {
    setCursor(0);
  }, [rows.length, term]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  function go(href: string) {
    onClose();
    setQ('');
    setItems([]);
    router.push(href);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!rows.length) {
      if (e.key === 'Enter' && term.length > 0) {
        e.preventDefault();
        go(`/products?q=${encodeURIComponent(term)}`);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % rows.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c - 1 + rows.length) % rows.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setCursor(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setCursor(rows.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(rows[Math.min(cursor, rows.length - 1)]!.href);
    }
  }

  if (!open || typeof document === 'undefined') return null;

  const activeId = rows.length ? `search-row-${Math.min(cursor, rows.length - 1)}` : undefined;
  const showQuickLinks = term.length < MIN_QUERY;
  const noResults = !showQuickLinks && !loading && !error && rows.length <= 1;

  return createPortal(
    <div className="fixed inset-0 z-100">
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search VOLTAGE"
        className="animate-rise panel bevel absolute inset-x-3 top-3 mx-auto flex max-h-[80vh] max-w-2xl flex-col sm:inset-x-4 sm:top-[10vh]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKeyDown}
            type="search"
            role="combobox"
            aria-expanded
            aria-controls="search-results"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Search devices, brands and categories"
            placeholder="Search devices, brands, categories…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-4 [&::-webkit-search-cancel-button]:hidden"
          />
          {loading && <Loader2 className="size-4 shrink-0 animate-spin text-volt-300" aria-hidden />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0 rounded-md p-1 text-ink-4 transition-colors hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div
          ref={listRef}
          id="search-results"
          role="listbox"
          aria-label="Search results"
          className="min-h-0 flex-1 overflow-y-auto p-2"
        >
          {showQuickLinks ? (
            <QuickLinks onNavigate={go} />
          ) : error ? (
            <p className="px-3 py-10 text-center text-sm text-bad-400">{error}</p>
          ) : noResults ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm font-medium text-ink">Nothing matched “{term}”</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink-3">
                Try a model number, a brand, or a spec like 12GB.
              </p>
              <Link
                href={`/products?q=${encodeURIComponent(term)}`}
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-volt-300 hover:text-volt-200"
              >
                Browse the full catalogue
              </Link>
            </div>
          ) : (
            GROUPS.map((group) => {
              const list = rows.filter((r) => r.kind === group.kind);
              if (!list.length) return null;
              return (
                <div key={group.kind} className="pb-1">
                  {group.title && (
                    <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-[0.14em] text-ink-4 uppercase">
                      {group.title}
                    </p>
                  )}
                  {list.map((row) => (
                    <ResultRow
                      key={`${row.kind}-${row.href}-${row.index}`}
                      row={row}
                      active={row.index === Math.min(cursor, rows.length - 1)}
                      onPointerEnter={() => setCursor(row.index)}
                      onSelect={() => go(row.href)}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] text-ink-4 sm:flex">
          <Hint keys={['↑', '↓']}>Navigate</Hint>
          <Hint keys={['↵']}>Open</Hint>
          <Hint keys={['esc']}>Close</Hint>
          <span className="ml-auto">GST-inclusive prices</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Hint({ keys, children }: { keys: string[]; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      {keys.map((k) => (
        <kbd
          key={k}
          className="rounded border border-line-2 bg-panel-2 px-1.5 py-0.5 font-sans text-[10px] text-ink-3"
        >
          {k}
        </kbd>
      ))}
      {children}
    </span>
  );
}

function ResultRow({
  row,
  active,
  onSelect,
  onPointerEnter,
}: {
  row: Row;
  active: boolean;
  onSelect: () => void;
  onPointerEnter: () => void;
}) {
  const Icon = ROW_ICON[row.kind];
  return (
    <Link
      href={row.href}
      id={`search-row-${row.index}`}
      role="option"
      aria-selected={active}
      data-active={active}
      tabIndex={-1}
      onPointerEnter={onPointerEnter}
      onClick={(e) => {
        // Let the router handle it through one path only, so the palette
        // closes and the query resets exactly once.
        e.preventDefault();
        onSelect();
      }}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
        active ? 'bg-volt-400/10 text-ink' : 'text-ink-2',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-line',
          active ? 'text-volt-300' : 'text-ink-3',
        )}
        style={row.accent ? { backgroundColor: `${row.accent}1f` } : undefined}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{row.label}</span>
        {row.sublabel && <span className="block truncate text-xs text-ink-3">{row.sublabel}</span>}
      </span>
      {row.pricePaise !== null && (
        <span className="tabular shrink-0 text-sm font-medium text-ink-2">
          {formatINR(row.pricePaise)}
        </span>
      )}
      {active && <CornerDownLeft className="size-3.5 shrink-0 text-ink-4" aria-hidden />}
    </Link>
  );
}

/** Zero-query state: the palette should still be useful before you type. */
function QuickLinks({ onNavigate }: { onNavigate: (href: string) => void }) {
  const quick = [
    ...SHOP_NAV,
    { label: 'Compare devices', href: '/compare', icon: GitCompare },
    { label: 'Track an order', href: '/track', icon: Truck },
  ];
  return (
    <div className="pb-1">
      <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-[0.14em] text-ink-4 uppercase">
        Jump to
      </p>
      {quick.map((link) => {
        const Icon = link.icon;
        return (
          <button
            key={link.href}
            type="button"
            onClick={() => onNavigate(link.href)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-3 ring-1 ring-inset ring-line">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{link.label}</span>
          </button>
        );
      })}
    </div>
  );
}
