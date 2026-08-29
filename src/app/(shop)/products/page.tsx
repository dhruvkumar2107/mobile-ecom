import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { listProducts, type ProductFilter, type ListResult } from '@/lib/services/catalog';
import { CATALOG_SORTS, CATALOG_SORT_LABEL } from '@/lib/services/catalog';
import { ProductListingClient } from './ProductListingClient';

export const metadata: Metadata = {
  title: 'All devices',
  description: 'Browse the full VOLTAGE catalogue — phones, tablets, audio, wearables and accessories. Filter by brand, specs, price and more.',
};

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    brand?: string;
    category?: string;
    kind?: string;
    minPrice?: string;
    maxPrice?: string;
    ram?: string;
    storage?: string;
    color?: string;
    badge?: string;
    rating?: string;
    inStock?: string;
    q?: string;
  }>;
}

async function getCachedData(
  filter: ProductFilter,
  loyaltyTier: string | null
): Promise<{ result: ListResult; brands: Array<{ id: string; name: string; slug: string; accent: string }>; categories: Array<{ id: string; name: string; slug: string; icon: string | null }>; kinds: Array<{ id: string; name: string; slug: string }> }> {
  const [result, brands, categories, kinds] = await Promise.all([
    listProducts(filter),
    db.brand.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true, accent: true } }),
    db.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true, icon: true } }),
    db.category.findMany({ where: { isActive: true, parentId: { not: null } }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true } }),
  ]);
  return { result, brands, categories, kinds };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const filter: ProductFilter = {
    page: params.page ? Math.max(1, parseInt(params.page, 10)) : 1,
    perPage: 16,
    sort: (CATALOG_SORTS as readonly string[]).includes(params.sort ?? '') ? (params.sort as ProductFilter['sort']) : 'featured',
    brandSlugs: params.brand ? params.brand.split(',') : undefined,
    categorySlug: params.category,
    kinds: params.kind ? params.kind.split(',') : undefined,
    minPricePaise: params.minPrice ? parseInt(params.minPrice, 10) * 100 : undefined,
    maxPricePaise: params.maxPrice ? parseInt(params.maxPrice, 10) * 100 : undefined,
    ramGb: params.ram ? params.ram.split(',').map(Number) : undefined,
    storageGb: params.storage ? params.storage.split(',').map(Number) : undefined,
    colors: params.color ? params.color.split(',') : undefined,
    badges: params.badge ? params.badge.split(',') : undefined,
    ratingMin: params.rating ? parseInt(params.rating, 10) : undefined,
    inStockOnly: params.inStock === 'true',
    q: params.q,
    loyaltyTier: user?.loyaltyTier ?? null,
  };

  let data: { result: ListResult; brands: any; categories: any; kinds: any };
  try {
    data = await unstable_cache(
      () => getCachedData(filter, user?.loyaltyTier ?? null),
      ['products', JSON.stringify(filter), user?.loyaltyTier ?? 'none'],
      { revalidate: 60, tags: ['products'] }
    )();
  } catch (err) {
    if (err instanceof Error && err.message === 'Category not found.') notFound();
    throw err;
  }

  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductListingClient
        initialResult={data.result}
        initialFilter={filter}
        brands={data.brands}
        categories={data.categories}
        kinds={data.kinds}
        sorts={CATALOG_SORTS}
        sortLabels={CATALOG_SORT_LABEL}
      />
    </Suspense>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-panel-2 shimmer rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="panel bevel rounded-2xl overflow-hidden">
            <div className="aspect-[4/3] bg-panel-2 shimmer" />
            <div className="p-3 space-y-1.5">
              <div className="h-2.5 w-16 rounded bg-panel-2 shimmer" />
              <div className="h-3.5 w-3/4 rounded bg-panel-2 shimmer" />
              <div className="h-5 w-1/2 rounded bg-panel-2 shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}