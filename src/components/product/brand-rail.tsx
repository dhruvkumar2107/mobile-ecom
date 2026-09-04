'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandRailProps } from './types';

export function BrandRail({
  brands,
  limit = 12,
}: BrandRailProps) {
  const visible = brands.slice(0, limit);
  const hasMore = brands.length > limit;

  return (
    <div className="snap-rail no-scrollbar fade-x -mx-4 px-4 pb-4" role="list">
      {visible.map((brand) => (
        <Link
          key={brand.id}
          href={`/brand/${brand.slug}`}
          className="group shrink-0 w-28 sm:w-32 flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-300 hover:bg-panel-2 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
          role="listitem"
        >
          <div
            className="relative size-16 sm:size-20 rounded-xl flex items-center justify-center ring-1 ring-line transition-all duration-300 group-hover:ring-volt-400/50 group-hover:shadow-[0_0_20px_-4px_var(--tw-ring-color)]"
            style={{ backgroundColor: `${brand.accent}15` }}
          >
            <span className="text-lg font-semibold tracking-[0.1em] uppercase transition-transform duration-300 group-hover:scale-110" style={{ color: brand.accent }}>
              {brand.name.charAt(0)}
            </span>
          </div>
          <span className="text-sm font-medium text-ink text-center truncate w-full group-hover:text-volt-300 transition-colors">
            {brand.name}
          </span>
          <span className="text-[11px] text-ink-4">{brand.productCount} devices</span>
        </Link>
      ))}
      {hasMore && (
        <Link
          href="/brands"
          className="shrink-0 w-28 sm:w-32 flex flex-col items-center gap-2 rounded-xl p-3 border border-line border-dashed transition-colors hover:bg-panel-2 hover:border-volt-400/50"
          role="listitem"
        >
          <div className="size-16 sm:size-20 rounded-xl flex items-center justify-center border border-line border-dashed">
            <ChevronRight className="size-5 text-ink-3" aria-hidden />
          </div>
          <span className="text-sm font-medium text-ink-2">All brands</span>
          <span className="text-[11px] text-ink-4">View all</span>
        </Link>
      )}
    </div>
  );
}