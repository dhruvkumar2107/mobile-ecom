'use client';

import { useEffect, useState } from 'react';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { ProductCard } from './card';
import { Clock } from 'lucide-react';

export function RecentlyViewed({ limit = 6 }: { limit?: number }) {
  const { getRecentProducts, hasHydrated } = useRecentlyViewed();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (hasHydrated) {
      const recent = getRecentProducts(limit);
      setProducts(recent);
    }
  }, [hasHydrated, limit, getRecentProducts]);

  if (!hasHydrated || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="size-5 text-ink-3" />
        <h2 className="text-lg font-semibold text-ink">Recently Viewed</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              brand: { name: product.brandName, slug: '', accent: '' },
              imageUrl: product.imageUrl,
              heroGradient: product.heroGradient,
              finalPaise: product.pricePaise,
              mrpPaise: product.mrpPaise,
              pricePaise: product.pricePaise,
              discountPercent: Math.round(
                ((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100
              ),
              colors: [],
              badges: [],
              kind: 'phone',
              ratingAvg: 0,
              reviewCount: 0,
              soldCount: 0,
              inStock: true,
              isPreorder: false,
              lowestEmiPaise: null,
              flashSale: null,
              preorderReleaseAt: null,
            }}
            compact
          />
        ))}
      </div>
    </div>
  );
}
