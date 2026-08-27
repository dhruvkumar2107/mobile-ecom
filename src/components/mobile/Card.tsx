'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from './MobileImage';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  pressable?: boolean;
  onPress?: () => void;
}

const paddingStyles = {
  none: { padding: 0 },
  sm: { padding: `${mobileDesign.spacing.sm}px` },
  md: { padding: `${mobileDesign.spacing.md}px` },
  lg: { padding: `${mobileDesign.spacing.lg}px` },
  xl: { padding: `${mobileDesign.spacing.xl}px` },
};

const variantStyles = {
  default: {
    background: mobileDesign.colors.surface,
    border: `1px solid ${mobileDesign.colors.borderLight}`,
    boxShadow: mobileDesign.shadows.sm,
  },
  elevated: {
    background: mobileDesign.colors.surface,
    border: 'none',
    boxShadow: mobileDesign.shadows.md,
  },
  outlined: {
    background: mobileDesign.colors.surface,
    border: `1px solid ${mobileDesign.colors.border}`,
    boxShadow: 'none',
  },
  filled: {
    background: mobileDesign.colors.background,
    border: 'none',
    boxShadow: 'none',
  },
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      pressable = false,
      onPress,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const v = variantStyles[variant];
    const p = paddingStyles[padding];

    const baseStyle = {
      borderRadius: `${mobileDesign.borderRadius.lg}px`,
      overflow: 'hidden',
      ...v,
      ...p,
      ...style,
    };

    if (pressable && onPress) {
      return (
        <motion.button
          ref={ref as unknown as React.Ref<HTMLButtonElement>}
          onClick={onPress}
          whileTap={{ scale: 0.98 }}
          style={{
            ...baseStyle,
            display: 'flex',
            flexDirection: 'column',
            border: 'none',
            background: v.background,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            padding: 0,
          }}
          className={cn('mobile-card', className)}
          {...(props as Record<string, unknown>)}
        >
          {children}
        </motion.button>
      );
    }

    if (hoverable) {
      return (
        <div
          ref={ref}
          style={{
            ...baseStyle,
            transition: `box-shadow ${mobileDesign.transitions.normal}, transform ${mobileDesign.transitions.normal}`,
          }}
          className={cn('mobile-card', className)}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = mobileDesign.shadows.lg;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = v.boxShadow;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        style={baseStyle}
        className={cn('mobile-card', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  avatar?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, avatar, children, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: `${mobileDesign.spacing.md}px`,
          ...style,
        }}
        className={cn('mobile-card-header', className)}
        {...props}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: `${mobileDesign.spacing.md}px`, flex: 1, minWidth: 0 }}>
          {avatar && (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: `${mobileDesign.borderRadius.md}px`,
                background: mobileDesign.colors.accentLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {avatar}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textPrimary,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                style={{
                  margin: `${mobileDesign.spacing.xs}px 0 0`,
                  fontSize: '13px',
                  fontWeight: 400,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.textSecondary,
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          ...style,
        }}
        className={cn('mobile-card-content', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, divider = true, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: `${mobileDesign.spacing.md}px`,
          paddingTop: `${mobileDesign.spacing.md}px`,
          borderTop: divider ? `1px solid ${mobileDesign.colors.borderLight}` : 'none',
          marginTop: divider ? `${mobileDesign.spacing.md}px` : 0,
          ...style,
        }}
        className={cn('mobile-card-footer', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';


export interface OrderCardProps {
  id: string;
  orderNumber: string;
  date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  items: Array<{
    id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  onPress?: () => void;
  onTrack?: () => void;
  onReorder?: () => void;
  onReturn?: () => void;
}

const statusStyles = {
  pending: { bg: 'var(--mobile-color-warning-light)', color: 'var(--mobile-color-warning)', text: 'Pending' },
  confirmed: { bg: 'var(--mobile-color-accent-light)', color: 'var(--mobile-color-accent)', text: 'Confirmed' },
  shipped: { bg: 'var(--mobile-color-plasma-light)', color: 'var(--mobile-color-plasma)', text: 'Shipped' },
  delivered: { bg: 'var(--mobile-color-success-light)', color: 'var(--mobile-color-success)', text: 'Delivered' },
  cancelled: { bg: 'var(--mobile-color-error-light)', color: 'var(--mobile-color-error)', text: 'Cancelled' },
  returned: { bg: 'var(--mobile-color-border-light)', color: 'var(--mobile-color-text-tertiary)', text: 'Returned' },
};

export function OrderCard({
  id,
  orderNumber,
  date,
  status,
  items,
  total,
  onPress,
  onTrack,
  onReorder,
  onReturn,
}: OrderCardProps) {
  const s = statusStyles[status];

  return (
    <Card variant="default" padding="none" pressable={!!onPress} onPress={onPress}>
      <div style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: `${mobileDesign.spacing.md}px` }}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textPrimary,
              }}
            >
              Order {orderNumber}
            </p>
            <p
              style={{
                margin: `${mobileDesign.spacing.xs}px 0 0`,
                fontSize: '13px',
                fontWeight: 400,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textSecondary,
              }}
            >
              {date}
            </p>
          </div>
          <span
            style={{
              padding: `${mobileDesign.spacing.xs}px ${mobileDesign.spacing.md}px`,
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              lineHeight: 1,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: s.color,
              background: s.bg,
              borderRadius: `${mobileDesign.borderRadius.full}px`,
            }}
          >
            {s.text}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.sm}px` }}>
          {items.filter(Boolean).slice(0, 3).map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: `${mobileDesign.spacing.md}px`,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '56px',
                  borderRadius: `${mobileDesign.borderRadius.md}px`,
                  background: mobileDesign.colors.borderLight,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <MobileImage src={item.image} alt="" sizes="56px" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: mobileDesign.typography.fontFamily,
                    color: mobileDesign.colors.textPrimary,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.name}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '13px',
                    fontWeight: 400,
                    fontFamily: mobileDesign.typography.fontFamily,
                    color: mobileDesign.colors.textSecondary,
                  }}
                >
                  Qty: {item.quantity} • ₹{item.price.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {items.length > 3 && (
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.accent,
              }}
            >
              +{items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: `${mobileDesign.spacing.md}px`,
            paddingTop: `${mobileDesign.spacing.md}px`,
            borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
          }}
        >
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: mobileDesign.typography.fontFamily,
              color: mobileDesign.colors.textPrimary,
            }}
          >
            Total: ₹{total.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: `${mobileDesign.spacing.sm}px` }}>
            {onTrack && status !== 'delivered' && status !== 'cancelled' && (
              <button
                onClick={(e) => { e.stopPropagation(); onTrack(); }}
                style={{
                  padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.md}px`,
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: mobileDesign.typography.fontFamily,
                  borderRadius: `${mobileDesign.borderRadius.md}px`,
                  border: `1px solid ${mobileDesign.colors.border}`,
                  background: 'transparent',
                  color: mobileDesign.colors.textSecondary,
                  cursor: 'pointer',
                }}
              >
                Track
              </button>
            )}
            {onReorder && (
              <button
                onClick={(e) => { e.stopPropagation(); onReorder(); }}
                style={{
                  padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.md}px`,
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: mobileDesign.typography.fontFamily,
                  borderRadius: `${mobileDesign.borderRadius.md}px`,
                  border: 'none',
                  background: mobileDesign.colors.accentLight,
                  color: mobileDesign.colors.accent,
                  cursor: 'pointer',
                }}
              >
                Reorder
              </button>
            )}
            {onReturn && status === 'delivered' && (
              <button
                onClick={(e) => { e.stopPropagation(); onReturn(); }}
                style={{
                  padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.md}px`,
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: mobileDesign.typography.fontFamily,
                  borderRadius: `${mobileDesign.borderRadius.md}px`,
                  border: 'none',
                  background: mobileDesign.colors.errorLight,
                  color: mobileDesign.colors.error,
                  cursor: 'pointer',
                }}
              >
                Return
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}