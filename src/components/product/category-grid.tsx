'use client';

import Link from 'next/link';
import { ChevronRight, Package, Smartphone, Tablet, Headphones, Watch, Cable, ShieldCheck, Truck, Zap, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryGridProps } from './types';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  phones: Smartphone,
  tablets: Tablet,
  audio: Headphones,
  wearables: Watch,
  accessories: Cable,
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.slug] || Package;
        return (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group panel bevel relative p-5 transition-all duration-300 hover:shadow-lift hover:ring-1 hover:ring-volt-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            role="listitem"
          >
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-volt-400/10 text-volt-300 group-hover:bg-volt-400/20 transition-colors">
              <Icon className="size-6" aria-hidden />
            </div>
            <h3 className="text-sm font-semibold text-ink group-hover:text-volt-300 transition-colors">
              {category.name}
            </h3>
            <p className="mt-1 text-xs text-ink-3">{category.productCount} devices</p>
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="size-4 text-volt-300" aria-hidden />
            </div>
          </Link>
        );
      })}
    </div>
  );
}