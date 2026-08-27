'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, Tag, Truck, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR, formatNumber } from '@/lib/money';
import { DeviceArt, DeviceStage } from './device-art';
import { Panel } from '@/components/ui/panel';
import { Badge } from '@/components/ui/badge';
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

  const inStock = product.inStock;
  const isPreorder = product.isPreorder;
  const showFlashSale = product.flashSale && new Date(product.flashSale.endsAt).getTime() > Date.now();

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group',
        compact ? 'w-40 shrink-0 sm:w-48' : 'w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="listitem"
      aria-label={`${product.name} — ${formatINR(product.finalPaise)}${product.discountPercent ? ` (${product.discountPercent}% off)` : ''}`}
    >
      <Panel flat className="relative h-full overflow-hidden transition-all duration-300 group-hover:shadow-lift group-hover:glass-card rounded-2xl">
        {/* Wishlist Button */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <WishlistButton productId={product.id} size="sm" />
        </div>

        {/* Flash sale badge */}
        {showFlashSale && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-volt-500/90 px-2 py-0.5 text-[10px] font-bold text-void backdrop-blur-sm">
            <Sparkles className="size-2.5" />
            FLASH
          </div>
        )}

        {/* Discount badge */}
        {product.discountPercent > 0 && !showFlashSale && (
          <div className="absolute top-2 left-2 z-10 rounded-full bg-good-500/90 px-2 py-0.5 text-[10px] font-bold text-void backdrop-blur-sm">
            -{product.discountPercent}%
          </div>
        )}

        {/* Product Image - smaller, compact */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-transparent to-panel-2/30">
          <DeviceStage gradient={product.heroGradient} glow={false}>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="size-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
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
                frame={hovered ? 1 : 0}
                brandMark={product.brand.name.length <= 8 ? product.brand.name.toUpperCase() : null}
                className="size-full"
              />
            )}
          </DeviceStage>
        </div>

        {/* Content - compact, dense */}
        <div className="p-3 space-y-1.5">
          {/* Brand + badges row */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-volt-400">
              {product.brand.name}
            </span>
            {product.badges.slice(0, 1).map((b) => (
              <Badge key={b} tone="violet" size="xs">{b}</Badge>
            ))}
          </div>

          {/* Product name */}
          <h3 className="text-sm font-semibold text-ink leading-tight line-clamp-2 group-hover:text-volt-300 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price block */}
          <div className="flex items-baseline gap-1.5">
            <span className="tabular text-lg font-bold text-ink">{formatINR(product.finalPaise)}</span>
            {product.mrpPaise > product.finalPaise && (
              <span className="tabular text-xs text-ink-4 line-through">{formatINR(product.mrpPaise)}</span>
            )}
          </div>

          {/* Rating + sold */}
          <div className="flex items-center gap-2 text-[11px] text-ink-3">
            {product.ratingAvg > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="size-3 fill-warn-400 text-warn-400" />
                {product.ratingAvg.toFixed(1)}
              </span>
            )}
            {product.soldCount > 0 && (
              <span className="text-ink-4">{formatNumber(product.soldCount)} sold</span>
            )}
          </div>

          {/* EMI */}
          {product.lowestEmiPaise && (
            <p className="text-[10px] text-ink-3">
              EMI from <span className="font-semibold text-volt-400">{formatINR(product.lowestEmiPaise)}/mo</span>
            </p>
          )}

          {/* Out of stock overlay */}
          {!inStock && !isPreorder && (
            <div className="flex items-center gap-1 text-[11px] text-bad-400 font-medium">
              <Tag className="size-3" />
              Out of stock
            </div>
          )}

          {/* Free delivery hint */}
          {inStock && !compact && (
            <div className="flex items-center gap-1 text-[10px] text-ink-4 pt-1 border-t border-line/50">
              <Truck className="size-3" />
              Free delivery
            </div>
          )}
        </div>

        {/* Full out-of-stock overlay */}
        {(!compact && !inStock && !isPreorder) && (
          <div className="absolute inset-0 flex items-center justify-center bg-void/80 backdrop-blur-sm ring-1 ring-bad-400/30 ring-inset">
            <span className="rounded-full bg-bad-400/20 px-3 py-1 text-xs font-medium text-bad-400 ring-1 ring-inset ring-bad-400/40">
              Out of stock
            </span>
          </div>
        )}
      </Panel>
    </Link>
  );
}
