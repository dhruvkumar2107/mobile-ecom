import { cn } from '@/lib/utils';
import type { Tone } from '@/lib/enums';

/**
 * Tone → class map. Kept as a literal map rather than string interpolation so
 * Tailwind's scanner can see every class that ships.
 */
const TONES: Record<Tone, string> = {
  cyan: 'bg-volt-400/12 text-volt-300 ring-volt-400/25',
  emerald: 'bg-good-400/12 text-good-400 ring-good-400/25',
  amber: 'bg-warn-400/12 text-warn-400 ring-warn-400/25',
  rose: 'bg-bad-400/12 text-bad-400 ring-bad-400/25',
  violet: 'bg-plasma-400/12 text-plasma-300 ring-plasma-400/25',
  slate: 'bg-ink-4/12 text-ink-2 ring-ink-4/25',
};

const SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
} as const;

export function Badge({
  children,
  tone = 'slate',
  size = 'sm',
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: keyof typeof SIZES;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Solid accent chip for prices, discounts, "NEW" flags. */
export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-volt-400 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-void uppercase',
        className,
      )}
    >
      {children}
    </span>
  );
}
