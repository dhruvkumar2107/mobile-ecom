import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const filter: ProductFilter = {
    page: params.page ? Math.max(1, parseInt(params.page, 10)) : 1,
    perPage: 12,
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

  let result: ListResult;
  try {
    result = await listProducts(filter);
  } catch (err) {
    if (err instanceof Error && err.message === 'Category not found.') notFound();
    throw err;
  }

  const [brands, categories, kinds] = await Promise.all([
    db.brand.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true, accent: true } }),
    db.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true, icon: true } }),
    db.category.findMany({ where: { isActive: true, parentId: { not: null } }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <ProductListingClient
      initialResult={result}
      initialFilter={filter}
      brands={brands}
      categories={categories}
      kinds={kinds}
      sorts={CATALOG_SORTS}
      sortLabels={CATALOG_SORT_LABEL}
    />
  );
}