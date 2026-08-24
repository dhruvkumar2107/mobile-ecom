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

  // Transform recent products to ProductCard type
  const productCards = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: null,
    kind: 'phone',
    status: 'active',
    brand: { id: '', name: product.brandName, slug: '', accent: '' },
    category: { id: '', name: '', slug: '' },
    heroGradient: product.heroGradient,
    imageUrl: product.imageUrl,
    badges: [],
    highlights: [],
    ratingAvg: 0,
    reviewCount: 0,
    soldCount: 0,
    mrpPaise: product.mrpPaise,
    pricePaise: product.pricePaise,
    finalPaise: product.pricePaise,
    discountPaise: product.mrpPaise - product.pricePaise,
    discountPercent: Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100),
    flashSale: null,
    keySpecs: [],
    colors: [],
    ramOptions: [],
    storageOptions: [],
    variantCount: 1,
    defaultVariantId: '',
    sellable: product.inStock ? 10 : 0,
    inStock: product.inStock,
    isPreorder: false,
    launchDate: null,
    preorderReleaseAt: null,
    lowestEmiPaise: null,
    createdAt: new Date(),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="size-5 text-ink-3" />
        <h2 className="text-lg font-semibold text-ink">Recently Viewed</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {productCards.map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>
    </div>
  );
}