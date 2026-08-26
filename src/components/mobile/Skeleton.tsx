import { mobileDesign } from '@/lib/mobile-design';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  style,
  variant = 'rect',
  width,
  height,
  borderRadius,
}: {
  className?: string;
  style?: React.CSSProperties;
  variant?: 'rect' | 'circle' | 'text' | 'rounded';
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}) {
  const baseStyle: React.CSSProperties = {
    borderRadius:
      variant === 'circle' ? '50%' : variant === 'rounded' ? '12px' : borderRadius ?? '8px',
    width: width ?? '100%',
    height: height ?? (variant === 'text' ? '16px' : 'auto'),
    minHeight: variant === 'text' ? '16px' : undefined,
  };

  return (
    <div
      style={{ ...baseStyle, ...style }}
      className={cn('mobile-skeleton', className)}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      className="product-card-skeleton"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: mobileDesign.colors.surface,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        boxShadow: mobileDesign.shadows.sm,
        overflow: 'hidden',
        width: '100%',
        maxWidth: '180px',
      }}
    >
      <Skeleton width="100%" height="180px" variant="rounded" />
      <div style={{ padding: `${mobileDesign.spacing.md}px` }}>
        <Skeleton variant="text" width="80%" height="20px" style={{ marginBottom: '8px' }} />
        <Skeleton variant="text" width="60%" height="14px" style={{ marginBottom: '12px' }} />
        <Skeleton variant="text" width="50%" height="18px" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.lg}px` }}>
      <Skeleton width="100%" height="300px" variant="rounded" />
      <div style={{ padding: `0 ${mobileDesign.spacing.lg}px` }}>
        <Skeleton variant="text" width="40%" height="28px" style={{ marginBottom: '8px' }} />
        <Skeleton variant="text" width="60%" height="16px" style={{ marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Skeleton width="60px" height="32px" variant="rounded" />
          <Skeleton width="60px" height="32px" variant="rounded" />
          <Skeleton width="60px" height="32px" variant="rounded" />
        </div>
        <Skeleton variant="text" width="100%" height="16px" style={{ marginBottom: '8px' }} />
        <Skeleton variant="text" width="100%" height="16px" />
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.md}px` }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: `${mobileDesign.spacing.md}px`,
            padding: `${mobileDesign.spacing.md}px`,
            background: mobileDesign.colors.surface,
            borderRadius: `${mobileDesign.borderRadius.lg}px`,
            boxShadow: mobileDesign.shadows.sm,
          }}
        >
          <Skeleton width="80px" height="80px" variant="rounded" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <Skeleton variant="text" width="70%" height="18px" style={{ marginBottom: '8px' }} />
              <Skeleton variant="text" width="50%" height="14px" />
            </div>
            <Skeleton variant="text" width="30%" height="20px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.lg}px` }}>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
        <Skeleton width="32px" height="32px" variant="circle" />
        <Skeleton width="32px" height="32px" variant="circle" />
        <Skeleton width="32px" height="32px" variant="circle" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: `0 ${mobileDesign.spacing.lg}px` }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" width="100%" height="52px" />
        ))}
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div
      style={{
        padding: `${mobileDesign.spacing.lg}px`,
        background: mobileDesign.colors.surface,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        boxShadow: mobileDesign.shadows.sm,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <Skeleton variant="text" width="120px" height="16px" />
        <Skeleton variant="rounded" width="80px" height="24px" />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <Skeleton width="60px" height="60px" variant="rounded" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width="70%" height="16px" />
          <Skeleton variant="text" width="50%" height="14px" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton variant="rounded" width="100px" height="32px" />
        <Skeleton variant="rounded" width="100px" height="32px" />
      </div>
    </div>
  );
}

export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: mobileDesign.colors.background,
        padding: `${mobileDesign.spacing.lg}px`,
        paddingBottom: `${mobileDesign.touchTarget + mobileDesign.spacing['3xl']}px`,
      }}
    >
      {children}
    </div>
  );
}