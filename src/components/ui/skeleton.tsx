'use client';

import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  variant = 'rect',
  style,
}: {
  className?: string;
  variant?: 'rect' | 'circle' | 'text' | 'rounded';
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        'skeleton',
        variant === 'circle' && 'rounded-full',
        variant === 'rounded' && 'rounded-xl',
        variant === 'text' && 'rounded h-4',
        variant === 'rect' && 'rounded-lg',
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeletonDesktop() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-panel-2/50 backdrop-blur-sm">
      <Skeleton variant="rect" className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-1/3 h-3" />
        <Skeleton variant="text" className="w-2/3 h-4" />
        <Skeleton variant="text" className="w-1/2 h-5" />
        <div className="flex gap-2">
          <Skeleton variant="text" className="w-16 h-3" />
          <Skeleton variant="text" className="w-12 h-3" />
        </div>
      </div>
    </div>
  );
}

export function ProductRailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeletonDesktop key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-panel-2/50 backdrop-blur-sm">
      <div className="grid lg:grid-cols-2 gap-8 p-8">
        <div className="space-y-4">
          <Skeleton variant="rounded" className="w-24 h-6" />
          <Skeleton variant="text" className="w-full h-10" />
          <Skeleton variant="text" className="w-3/4 h-10" />
          <Skeleton variant="text" className="w-full h-5" />
          <Skeleton variant="text" className="w-2/3 h-5" />
          <div className="flex gap-3 pt-4">
            <Skeleton variant="rounded" className="w-32 h-10" />
            <Skeleton variant="rounded" className="w-36 h-10" />
          </div>
        </div>
        <Skeleton variant="rect" className="w-full aspect-square" />
      </div>
    </div>
  );
}
