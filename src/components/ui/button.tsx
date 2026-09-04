'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  /** The one true CTA — reserve for the primary action on a screen. */
  primary:
    'bg-volt-400 text-void font-semibold hover:bg-volt-300 active:bg-volt-500 shadow-[0_8px_30px_-10px_rgb(34_211_238_/_0.6)] hover:shadow-[0_8px_40px_-8px_rgb(34_211_238_/_0.8)]',
  secondary:
    'bg-panel-2 text-ink ring-1 ring-inset ring-line-2 hover:bg-line hover:ring-line-2',
  outline:
    'bg-transparent text-ink ring-1 ring-inset ring-line-2 hover:bg-panel-2 hover:ring-volt-400/40 hover:shadow-[0_0_20px_-6px_rgb(34_211_238_/_0.2)]',
  ghost: 'bg-transparent text-ink-2 hover:bg-panel-2 hover:text-ink',
  danger:
    'bg-bad-500/12 text-bad-400 ring-1 ring-inset ring-bad-500/30 hover:bg-bad-500/20',
  wallet:
    'bg-plasma-500 text-white font-semibold hover:bg-plasma-400 shadow-[0_8px_30px_-10px_rgb(139_92_246_/_0.6)] hover:shadow-[0_8px_40px_-8px_rgb(139_92_246_/_0.8)]',
  link: 'bg-transparent text-volt-300 underline underline-offset-4 hover:text-volt-200 px-0',
} as const;

const SIZES = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1.5',
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-13 px-7 text-base rounded-xl gap-2.5',
  icon: 'size-9 rounded-lg',
  'icon-sm': 'size-7 rounded-md',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
};

const base =
  'inline-flex items-center justify-center font-medium tracking-tight transition-all duration-200 select-none disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt-400 active:scale-[0.985]';

export const Button = forwardRef<
  HTMLButtonElement,
  BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, icon, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {icon && !loading && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
});

/** Same visual language as Button, rendered as a Next link. */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  prefetch,
  ...rest
}: BaseProps & { href: string; prefetch?: boolean } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(base, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** Small icon-only affordance used in tables and card corners. */
export function IconButton({
  label,
  children,
  className,
  variant = 'ghost',
  size = 'icon',
  ...rest
}: BaseProps & { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(base, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
