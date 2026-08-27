'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, Tag, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR, formatNumber } from '@/lib/money';
import { DeviceArt, DeviceStage } from './device-art';
import { Panel } from '@/components/ui/panel';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { WishlistButton } from './wishlist-button';
import type { ProductCard as ProductCardType } from '@/lib/services/catalog';

export function ProductCard({
  product,
  compact = false,
}: {
  product: ProductCardType;
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [frame, setFrame] = useState(0);

  const inStock = product.inStock;
  const isPreorder = product.isPreorder;

  const showFlashSale = product.flashSale && new Date(product.flashSale.endsAt).getTime() > Date.now();

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group',
        compact ? 'w-56 shrink-0' : 'w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="listitem"
      aria-label={`${product.name} — ${formatINR(product.finalPaise)}${product.discountPercent ? ` (${product.discountPercent}% off)` : ''}`}
    >
      <Panel flat className="relative h-full overflow-hidden transition-all duration-300 group-hover:shadow-lift group-hover:glass-card">
        {/* Wishlist Button */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <WishlistButton productId={product.id} size="sm" />
        </div>
        <DeviceStage gradient={product.heroGradient} glow={!compact}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="size-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = '/icon.svg';
                e.currentTarget.onerror = null;
              }}
            />
          ) : (
            <DeviceArt
              colorHex={product.colors[0]?.hex || '#06b6d4'}
              colorHex2={product.colors[0]?.hex2 || null}
              kind={product.kind}
              seed={product.slug}
              frame={hovered ? frame : 0}
              brandMark={product.brand.name.length <= 8 ? product.brand.name.toUpperCase() : null}
              className="size-full"
            />
          )}
        </DeviceStage>

        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-void/95 via-void/60 to-transparent">
          {showFlashSale && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-volt-300 animate-pulse-ring">
              <span className="flex h-3 w-3 rounded-full bg-volt-400 animate-pulse" aria-hidden />
              Flash sale ends {new Date(product.flashSale!.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          <div className="flex flex-wrap items-baseline gap-1.5">
            <Badge tone="cyan" size="xs" className="capitalize">
              {product.brand.name}
            </Badge>
            {product.badges.map((b) => (
              <Badge key={b} tone="violet" size="xs">{b}</Badge>
            ))}
            {isPreorder && <Badge tone="amber" size="xs">Pre-order</Badge>}
          </div>

          <h3 className="mt-2 truncate text-sm font-medium text-ink group-hover:text-volt-300 transition-colors">
            {product.name}
          </h3>

          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="tabular text-base font-semibold text-ink">{formatINR(product.finalPaise)}</span>
            {product.mrpPaise > product.finalPaise && (
              <span className="tabular text-sm text-ink-4 line-through">{formatINR(product.mrpPaise)}</span>
            )}
            {product.discountPercent > 0 && (
              <Badge tone="emerald" size="xs" className="ml-auto">
                {product.discountPercent}% off
              </Badge>
            )}
          </div>

          {product.lowestEmiPaise && (
            <p className="mt-1.5 text-[11px] text-ink-3">
              EMI from <span className="font-medium text-ink">{formatINR(product.lowestEmiPaise)}/mo</span>
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-3">
            {product.ratingAvg > 0 && (
              <span className="flex items-center gap-1">
                <BadgeCheck className="size-3 text-good-400" aria-hidden />
                {product.ratingAvg.toFixed(1)} ({formatNumber(product.reviewCount)})
              </span>
            )}
            {product.soldCount > 0 && (
              <span className="flex items-center gap-1">
                <Truck className="size-3" aria-hidden />
                {formatNumber(product.soldCount)} sold
              </span>
            )}
          </div>

          {!inStock && !isPreorder && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-bad-400">
              <Tag className="size-3" aria-hidden />
              Out of stock
            </div>
          )}

          {isPreorder && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-warn-400">
              <Tag className="size-3" aria-hidden />
              Pre-order — ships {product.preorderReleaseAt ? new Date(product.preorderReleaseAt).toLocaleDateString() : 'soon'}
            </div>
          )}

          {compact ? null : (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-4">
              <span className="flex items-center gap-1">
                <BadgeCheck className="size-3 text-good-400" aria-hidden />
                Free delivery
              </span>
              <span className="flex items-center gap-1">
                <Truck className="size-3" aria-hidden />
                14-day returns
              </span>
            </div>
          )}
        </div>

        {(!compact && !inStock && !isPreorder) && (
          <div className="absolute inset-0 flex items-center justify-center bg-void/80 ring-1 ring-bad-400/30 ring-inset">
            <span className="rounded-full bg-bad-400/20 px-3 py-1 text-xs font-medium text-bad-400 ring-1 ring-inset ring-bad-400/40">
              Out of stock
            </span>
          </div>
        )}
      </Panel>
    </Link>
  );
}