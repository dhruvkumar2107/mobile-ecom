'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { mobileDesign } from '@/lib/mobile-design';
import { cn } from '@/lib/utils';

interface HapticButtonProps extends Omit<HTMLMotionProps<'button'>, 'whileTap'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles = {
  primary: {
    bg: 'var(--mobile-color-accent)',
    color: 'var(--mobile-color-text-inverse)',
    hoverBg: 'var(--mobile-color-accent-dark)',
    pressBg: 'var(--mobile-color-accent-press)',
    border: 'none',
  },
  secondary: {
    bg: 'var(--mobile-color-accent-light)',
    color: 'var(--mobile-color-accent-dark)',
    hoverBg: 'var(--mobile-color-accent)',
    pressBg: 'var(--mobile-color-accent-dark)',
    border: 'none',
  },
  outline: {
    bg: 'transparent',
    color: 'var(--mobile-color-accent)',
    hoverBg: 'var(--mobile-color-accent-light)',
    pressBg: 'var(--mobile-color-accent)',
    border: `1px solid var(--mobile-color-accent)`,
  },
  ghost: {
    bg: 'transparent',
    color: 'var(--mobile-color-text-primary)',
    hoverBg: 'var(--mobile-color-border-light)',
    pressBg: 'var(--mobile-color-border)',
    border: 'none',
  },
  danger: {
    bg: 'var(--mobile-color-error)',
    color: 'var(--mobile-color-text-inverse)',
    hoverBg: '#B91C1C',
    pressBg: '#991B1B',
    border: 'none',
  },
};

const sizeStyles = {
  sm: { px: 16, py: 10, fontSize: 14, gap: 8, minHeight: 40 },
  md: { px: 20, py: 12, fontSize: 15, gap: 10, minHeight: 44 },
  lg: { px: 24, py: 14, fontSize: 16, gap: 12, minHeight: 48 },
  xl: { px: 28, py: 16, fontSize: 17, gap: 12, minHeight: 52 },
};

export function HapticButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  style,
  children,
  ...props
}: HapticButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${s.gap}px`,
        padding: `${s.py}px ${s.px}px`,
        minHeight: `${s.minHeight}px`,
        fontSize: `${s.fontSize}px`,
        fontWeight: 600,
        fontFamily: mobileDesign.typography.fontFamily,
        lineHeight: 1.2,
        letterSpacing: 0.2,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        backgroundColor: v.bg,
        color: v.color,
        border: v.border,
        width: fullWidth ? '100%' : 'auto',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: `background-color ${mobileDesign.transitions.fast}, color ${mobileDesign.transitions.fast}, transform ${mobileDesign.transitions.fast}`,
        ...style,
      }}
      className={cn('haptic-button', className)}
      {...props}
      aria-busy={loading}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: s.minHeight - 8, height: s.minHeight - 8 }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" style={{ width: '100%', height: '100%' }}>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="31.4 31.4"
              style={{ opacity: 0.3 }}
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="12.56 31.4"
            />
          </svg>
        </motion.span>
      ) : (
        <>
          {leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}

export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  className,
  style,
  'aria-label': ariaLabel,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'ghost' | 'outline' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  'aria-label': string;
} & Omit<HTMLMotionProps<'button'>, 'children'>) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${s.minHeight}px`,
        height: `${s.minHeight}px`,
        padding: 0,
        borderRadius: `${mobileDesign.borderRadius.md}px`,
        backgroundColor: v.bg,
        color: v.color,
        border: v.border,
        cursor: 'pointer',
        transition: `background-color ${mobileDesign.transitions.fast}, color ${mobileDesign.transitions.fast}`,
        ...style,
      }}
      className={cn('icon-button', className)}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function ChipButton({
  children,
  selected = false,
  variant = 'default',
  className,
  style,
  ...props
}: {
  children: React.ReactNode;
  selected?: boolean;
  variant?: 'default' | 'accent';
  className?: string;
  style?: React.CSSProperties;
} & Omit<HTMLMotionProps<'button'>, 'children'>) {
  const isAccent = variant === 'accent';

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${mobileDesign.spacing.xs}px ${mobileDesign.spacing.md}px`,
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: mobileDesign.typography.fontFamily,
        lineHeight: 1.3,
        borderRadius: `${mobileDesign.borderRadius.full}px`,
        backgroundColor: selected
          ? isAccent
            ? mobileDesign.colors.accent
            : mobileDesign.colors.textPrimary
          : isAccent
            ? mobileDesign.colors.accentLight
            : mobileDesign.colors.borderLight,
        color: selected
          ? mobileDesign.colors.textInverse
          : isAccent
            ? mobileDesign.colors.accentDark
            : mobileDesign.colors.textSecondary,
        border: 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: `all ${mobileDesign.transitions.fast}`,
        boxShadow: selected ? mobileDesign.shadows.sm : 'none',
        ...style,
      }}
      className={cn('chip-button', className)}
      aria-pressed={selected}
      {...props}
    >
      {children}
    </motion.button>
  );
}