import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Admin data table. A plain semantic table inside a horizontal scroller —
 * every admin list has 6+ columns and forcing them into a card grid on desktop
 * loses the scan-down-a-column reading that makes a table useful.
 */
export function Table({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="-mx-px overflow-x-auto">
      <table className={cn('w-full min-w-full border-collapse text-sm', className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-abyss/90 backdrop-blur">
      <tr className="border-b border-line">{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  align = 'left',
  className,
  width,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  width?: string;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={cn(
        'px-4 py-2.5 text-xs font-medium tracking-wide whitespace-nowrap text-ink-3 uppercase',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-line/70">{children}</tbody>;
}

export function TR({
  children,
  href,
  className,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors',
        (href || onClick) && 'cursor-pointer hover:bg-panel-2/60',
        className,
      )}
      data-href={href}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  align = 'left',
  className,
  colSpan,
  mono,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  colSpan?: number;
  mono?: boolean;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-4 py-3 align-middle text-ink-2',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        mono && 'font-mono text-xs',
        className,
      )}
    >
      {children}
    </td>
  );
}

/** Makes a whole row navigable while keeping the table semantics intact. */
export function CellLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn('font-medium text-ink transition-colors hover:text-volt-300', className)}
    >
      {children}
    </Link>
  );
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center text-sm text-ink-3">
        {message}
      </td>
    </tr>
  );
}

/** Server-rendered pagination — pure links, works with JS disabled. */
export function Pagination({
  page,
  pages,
  total,
  perPage,
  hrefFor,
  className,
}: {
  page: number;
  pages: number;
  total: number;
  perPage: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (pages <= 1) {
    return total > 0 ? (
      <p className={cn('px-4 py-3 text-xs text-ink-3', className)}>
        {total} {total === 1 ? 'result' : 'results'}
      </p>
    ) : null;
  }

  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  // Window of at most 5 page numbers around the current page.
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const nums: number[] = [];
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3',
        className,
      )}
    >
      <p className="tabular text-xs text-ink-3">
        {from}–{to} of {total}
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <PageLink href={hrefFor(Math.max(1, page - 1))} disabled={page === 1}>
          Prev
        </PageLink>
        {start > 1 && <span className="px-1 text-xs text-ink-4">…</span>}
        {nums.map((n) => (
          <PageLink key={n} href={hrefFor(n)} active={n === page}>
            {n}
          </PageLink>
        ))}
        {end < pages && <span className="px-1 text-xs text-ink-4">…</span>}
        <PageLink href={hrefFor(Math.min(pages, page + 1))} disabled={page === pages}>
          Next
        </PageLink>
      </nav>
    </div>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  const cls = cn(
    'tabular inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-xs font-medium transition-colors',
    active
      ? 'bg-volt-400 text-void'
      : disabled
        ? 'cursor-not-allowed text-ink-4'
        : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
  );
  if (disabled) return <span className={cls}>{children}</span>;
  return (
    <Link href={href} className={cls} aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  );
}
