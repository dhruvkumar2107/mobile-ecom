'use client';

import { forwardRef } from 'react';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from './MobileImage';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const sizeStyles = {
  sm: { px: 8, py: 2, fontSize: 11, gap: 4, dotSize: 6, borderRadius: 6 },
  md: { px: 10, py: 3, fontSize: 12, gap: 6, dotSize: 8, borderRadius: 8 },
  lg: { px: 12, py: 4, fontSize: 13, gap: 8, dotSize: 8, borderRadius: 10 },
};

const variantStyles = {
  default: {
    bg: 'var(--mobile-color-border-light)',
    color: 'var(--mobile-color-text-secondary)',
    border: 'none',
    dotColor: 'var(--mobile-color-text-tertiary)',
  },
  success: {
    bg: 'var(--mobile-color-success-light)',
    color: 'var(--mobile-color-success)',
    border: 'none',
    dotColor: 'var(--mobile-color-success)',
  },
  warning: {
    bg: 'var(--mobile-color-warning-light)',
    color: 'var(--mobile-color-warning)',
    border: 'none',
    dotColor: 'var(--mobile-color-warning)',
  },
  error: {
    bg: 'var(--mobile-color-error-light)',
    color: 'var(--mobile-color-error)',
    border: 'none',
    dotColor: 'var(--mobile-color-error)',
  },
  info: {
    bg: 'var(--mobile-color-plasma-light)',
    color: 'var(--mobile-color-plasma)',
    border: 'none',
    dotColor: 'var(--mobile-color-plasma)',
  },
  accent: {
    bg: 'var(--mobile-color-accent-light)',
    color: 'var(--mobile-color-accent-dark)',
    border: 'none',
    dotColor: 'var(--mobile-color-accent)',
  },
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      removable = false,
      onRemove,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const s = sizeStyles[size];
    const v = variantStyles[variant];

    return (
      <span
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: `${s.gap}px`,
          padding: `${s.py}px ${s.px}px`,
          fontSize: `${s.fontSize}px`,
          fontWeight: 600,
          fontFamily: mobileDesign.typography.fontFamily,
          lineHeight: 1,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          color: v.color,
          backgroundColor: v.bg,
          border: v.border,
          borderRadius: `${s.borderRadius}px`,
          whiteSpace: 'nowrap',
          ...style,
        }}
        className={cn('mobile-badge', className)}
        {...props}
      >
        {dot && (
          <span
            style={{
              width: `${s.dotSize}px`,
              height: `${s.dotSize}px`,
              borderRadius: '50%',
              backgroundColor: v.dotColor,
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
        {removable && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: `${s.dotSize + 4}px`,
              height: `${s.dotSize + 4}px`,
              border: 'none',
              background: 'transparent',
              color: v.color,
              borderRadius: '50%',
              cursor: 'pointer',
              opacity: 0.7,
              transition: `opacity ${mobileDesign.transitions.fast}`,
              padding: 0,
              marginLeft: '2px',
            }}
            aria-label="Remove"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: s.dotSize, height: s.dotSize }} aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const avatarSizes = {
  xs: { size: 24, fontSize: 10, statusSize: 8 },
  sm: { size: 32, fontSize: 12, statusSize: 10 },
  md: { size: 40, fontSize: 14, statusSize: 12 },
  lg: { size: 48, fontSize: 16, statusSize: 14 },
  xl: { size: 64, fontSize: 20, statusSize: 16 },
  '2xl': { size: 80, fontSize: 24, statusSize: 18 },
};

const statusColors = {
  online: 'var(--mobile-color-success)',
  offline: 'var(--mobile-color-text-tertiary)',
  busy: 'var(--mobile-color-error)',
  away: 'var(--mobile-color-warning)',
};

const statusPositions = {
  'bottom-right': { bottom: 0, right: 0 },
  'bottom-left': { bottom: 0, left: 0 },
  'top-right': { top: 0, right: 0 },
  'top-left': { top: 0, left: 0 },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'var(--mobile-color-accent)',
    'var(--mobile-color-plasma)',
    'var(--mobile-color-error)',
    'var(--mobile-color-warning)',
    'var(--mobile-color-success)',
    '#EC4899',
    '#06B6D4',
    '#F97316',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      shape = 'circle',
      status,
      statusPosition = 'bottom-right',
      className,
      style,
      ...props
    },
    ref
  ) => {
    const s = avatarSizes[size];
    const showStatus = !!status;
    const statusColor = status ? statusColors[status] : 'transparent';
    const pos = statusPositions[statusPosition];

    const backgroundColor = name ? getColorFromName(name) : mobileDesign.colors.border;

    return (
      <div
        ref={ref}
        style={{
          position: 'relative',
          width: `${s.size}px`,
          height: `${s.size}px`,
          borderRadius: shape === 'circle' ? '50%' : `${mobileDesign.borderRadius.md}px`,
          backgroundColor,
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style,
        }}
        className={cn('mobile-avatar', className)}
        {...props}
      >
        {src ? (
          <MobileImage
            src={src}
            alt={alt || name || 'Avatar'}
            sizes={`${s.size}px`}
          />
        ) : name ? (
          <span
            style={{
              fontSize: `${s.fontSize}px`,
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              color: 'white',
              lineHeight: 1,
            }}
          >
            {getInitials(name)}
          </span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            style={{
              width: `${s.size * 0.5}px`,
              height: `${s.size * 0.5}px`,
              color: mobileDesign.colors.textTertiary,
            }}
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}

        {showStatus && (
          <span
            style={{
              position: 'absolute',
              width: `${s.statusSize}px`,
              height: `${s.statusSize}px`,
              borderRadius: '50%',
              backgroundColor: statusColor,
              border: `${shape === 'circle' ? '2px' : '1px'} solid var(--mobile-color-surface)`,
              ...pos,
            }}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<AvatarProps & { key: string }>;
  max?: number;
  overlap?: number;
}

export function AvatarGroup({ avatars, max = 5, overlap = 8, className, style, ...props }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div
      style={{
        display: 'inline-flex',
        ...style,
      }}
      className={cn('mobile-avatar-group', className)}
      {...props}
    >
      {visibleAvatars.map((avatar, index) => (
        <div
          key={avatar.key}
          style={{
            zIndex: visibleAvatars.length - index,
            marginLeft: index > 0 ? `-${overlap}px` : 0,
          }}
        >
          <Avatar {...avatar} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          style={{
            marginLeft: `-${overlap}px`,
            zIndex: 0,
          }}
        >
          <Avatar
            name={`+${remainingCount}`}
            size="md"
            style={{ background: mobileDesign.colors.border }}
          />
        </div>
      )}
    </div>
  );
}