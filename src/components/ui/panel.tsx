import { cn } from '@/lib/utils';
import { Badge } from './badge';

export { Badge } from './badge';

export function PanelFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between border-t border-line px-5 py-3', className)}>
      {children}
    </div>
  );
}

export function Panel({
  children,
  className,
  flat,
  bevel = true,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  flat?: boolean;
  bevel?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside' | 'li';
}) {
  return (
    <Tag className={cn(flat ? 'panel-flat' : 'panel', bevel && 'bevel', 'overflow-hidden', className)}>
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-volt-400/10 text-volt-300">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function PanelBody({
  children,
  className,
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return <div className={cn(pad && 'p-5', className)}>{children}</div>;
}

/** Page-level heading used by every account and admin screen. */
export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1.5">{breadcrumb}</div>}
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-3">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/** Labelled key/value row — order summaries, invoices, spec sheets. */
export function Row({
  label,
  value,
  hint,
  strong,
  tone,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  strong?: boolean;
  tone?: 'default' | 'good' | 'bad' | 'muted';
  className?: string;
}) {
  const toneClass =
    tone === 'good'
      ? 'text-good-400'
      : tone === 'bad'
        ? 'text-bad-400'
        : tone === 'muted'
          ? 'text-ink-3'
          : strong
            ? 'text-ink'
            : 'text-ink-2';
  return (
    <div className={cn('flex items-baseline justify-between gap-4 py-1.5', className)}>
      <span className={cn('text-sm', strong ? 'font-medium text-ink' : 'text-ink-3')}>
        {label}
        {hint && <span className="ml-1.5 text-xs text-ink-4">{hint}</span>}
      </span>
      <span className={cn('tabular shrink-0 text-sm', strong && 'font-semibold', toneClass)}>{value}</span>
    </div>
  );
}

export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-4 uppercase tracking-wider">{label}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }
  return <div className={cn('h-px bg-line', className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-panel-2 text-ink-3 ring-1 ring-inset ring-line">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-lg', className)} />;
}

/** Metric tile for dashboards. Delta is rendered from a signed percentage. */
export function StatTile({
  label,
  value,
  sub,
  delta,
  icon,
  tone = 'cyan',
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: number | null;
  icon?: React.ReactNode;
  tone?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose';
  className?: string;
}) {
  const accents = {
    cyan: 'text-volt-300 bg-volt-400/10',
    violet: 'text-plasma-300 bg-plasma-400/10',
    emerald: 'text-good-400 bg-good-400/10',
    amber: 'text-warn-400 bg-warn-400/10',
    rose: 'text-bad-400 bg-bad-400/10',
  } as const;

  return (
    <div className={cn('panel bevel p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-ink-3 uppercase">{label}</p>
        {icon && (
          <span className={cn('flex size-8 items-center justify-center rounded-lg', accents[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="tabular mt-2.5 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {typeof delta === 'number' && Number.isFinite(delta) && (
          <span
            className={cn(
              'tabular text-xs font-medium',
              delta > 0 ? 'text-good-400' : delta < 0 ? 'text-bad-400' : 'text-ink-3',
            )}
          >
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span className="truncate text-xs text-ink-3">{sub}</span>}
      </div>
    </div>
  );
}

/** Thin horizontal meter. `tone` carries meaning, never decoration. */
export function Meter({
  value,
  max = 100,
  tone = 'cyan',
  className,
  showLabel,
}: {
  value: number;
  max?: number;
  tone?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose';
  className?: string;
  showLabel?: boolean;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const fills = {
    cyan: 'bg-volt-400',
    violet: 'bg-plasma-400',
    emerald: 'bg-good-400',
    amber: 'bg-warn-400',
    rose: 'bg-bad-400',
  } as const;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', fills[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="tabular w-9 text-right text-xs text-ink-3">{Math.round(pct)}%</span>}
    </div>
  );
}
