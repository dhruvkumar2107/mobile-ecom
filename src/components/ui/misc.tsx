'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, Copy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Client-side tab strip for panels whose content is already loaded. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Array<{ key: T; label: string; count?: number }>;
  active: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'relative shrink-0 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
            active === t.key ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
          )}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="tabular ml-1.5 rounded-full bg-panel-2 px-1.5 py-0.5 text-[10px] text-ink-3">
              {t.count}
            </span>
          )}
          {active === t.key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-volt-400" />}
        </button>
      ))}
    </div>
  );
}

/**
 * URL-driven tab strip. Admin lists filter server-side, so the tab has to be a
 * link — a client state toggle would need the data fetched twice.
 */
export function LinkTabs({
  tabs,
  param = 'tab',
  className,
}: {
  tabs: Array<{ value: string; label: string; count?: number }>;
  param?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(param) ?? tabs[0]?.value ?? '';

  const hrefFor = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === (tabs[0]?.value ?? '')) next.delete(param);
    else next.set(param, value);
    next.delete('page');
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => {
        const active = current === t.value;
        return (
          <Link
            key={t.value}
            href={hrefFor(t.value)}
            className={cn(
              'relative shrink-0 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {t.label}
            {typeof t.count === 'number' && t.count > 0 && (
              <span className="tabular ml-1.5 rounded-full bg-panel-2 px-1.5 py-0.5 text-[10px] text-ink-3">
                {t.count}
              </span>
            )}
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-volt-400" />}
          </Link>
        );
      })}
    </div>
  );
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
  count,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn('border-b border-line last:border-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          {title}
          {typeof count === 'number' && count > 0 && (
            <span className="tabular rounded-full bg-volt-400/12 px-1.5 text-[10px] text-volt-300">{count}</span>
          )}
        </span>
        <ChevronDown
          className={cn('size-4 shrink-0 text-ink-3 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export function Rating({
  value,
  count,
  size = 'sm',
  showValue = true,
  className,
}: {
  value: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md';
  showValue?: boolean;
  className?: string;
}) {
  const px = { xs: 'size-3', sm: 'size-3.5', md: 'size-4' }[size];
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              px,
              i <= rounded
                ? 'fill-warn-400 text-warn-400'
                : i - 0.5 === rounded
                  ? 'fill-warn-400/50 text-warn-400'
                  : 'text-ink-4',
            )}
            aria-hidden
          />
        ))}
      </span>
      {showValue && value > 0 && (
        <span className="tabular text-xs font-medium text-ink-2">{value.toFixed(1)}</span>
      )}
      {typeof count === 'number' && (
        <span className="tabular text-xs text-ink-4">
          ({count.toLocaleString('en-IN')})
        </span>
      )}
    </span>
  );
}

/** CSS-only tooltip. No positioning library for a hint that is always short. */
export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
}) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 w-max max-w-[15rem] -translate-x-1/2 rounded-lg bg-panel-2 px-2.5 py-1.5 text-xs leading-snug text-ink-2 opacity-0 ring-1 ring-inset ring-line-2 shadow-lift transition-opacity duration-150 group-hover/tip:opacity-100',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        {content}
      </span>
    </span>
  );
}

export function CopyButton({
  value,
  label = 'Copy',
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked — the value is on screen anyway */
        }
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink',
        className,
      )}
    >
      <Copy className="size-3.5" aria-hidden />
      {done ? 'Copied' : label}
    </button>
  );
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dims = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' }[size];
  const letters =
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'V';

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={cn('shrink-0 rounded-full object-cover ring-1 ring-line-2', dims, className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-volt-500/25 to-plasma-500/25 font-semibold text-volt-200 ring-1 ring-inset ring-line-2',
        dims,
        className,
      )}
    >
      {letters}
    </span>
  );
}
