'use client';

import Link from 'next/link';
import { ChevronRight, Package, Smartphone, Tablet, Headphones, Watch, Cable, ShieldCheck, Truck, Zap, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryGridProps } from './types';

const CATEGORY_STYLES: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; hoverRing: string }> = {
  phones: { icon: Smartphone, bg: 'bg-cyan-500/10', text: 'text-cyan-400', hoverRing: 'hover:ring-cyan-400/30' },
  tablets: { icon: Tablet, bg: 'bg-amber-500/10', text: 'text-amber-400', hoverRing: 'hover:ring-amber-400/30' },
  audio: { icon: Headphones, bg: 'bg-purple-500/10', text: 'text-purple-400', hoverRing: 'hover:ring-purple-400/30' },
  wearables: { icon: Watch, bg: 'bg-emerald-500/10', text: 'text-emerald-400', hoverRing: 'hover:ring-emerald-400/30' },
  accessories: { icon: Cable, bg: 'bg-rose-500/10', text: 'text-rose-400', hoverRing: 'hover:ring-rose-400/30' },
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => {
        const style = CATEGORY_STYLES[category.slug] || { icon: Package, bg: 'bg-gray-500/10', text: 'text-gray-400', hoverRing: 'hover:ring-gray-400/30' };
        const Icon = style.icon;
        return (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className={`group panel bevel relative p-5 transition-all duration-300 hover:shadow-lift hover:ring-1 ${style.hoverRing} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void`}
            role="listitem"
          >
            <div className={`mb-3 flex size-12 items-center justify-center rounded-xl ${style.bg} ${style.text} group-hover:scale-110 transition-all duration-300`}>
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