import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { listProducts, type ProductFilter, type ListResult } from '@/lib/services/catalog';
import { CATALOG_SORTS, CATALOG_SORT_LABEL } from '@/lib/services/catalog';
import { ProductListingClient } from '@/app/(shop)/products/ProductListingClient';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    brand?: string;
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

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.category.findUnique({
    where: { slug },
    select: { name: true, seoTitle: true, seoDescription: true },
  });
  if (!category) return { title: 'Category not found' };
  const title = category.seoTitle
    ? category.seoTitle.replace(/\s*[—–-]\s*VOLTAGE\s*$/i, '').trim()
    : category.name;
  return {
    title,
    description: category.seoDescription ?? `Shop ${category.name.toLowerCase()} at VOLTAGE. GST invoice, warranty tracked, no-cost EMI, same-day dispatch.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const paramsObj = await searchParams;
  const user = await getCurrentUser();

  const category = await db.category.findUnique({
    where: { slug },
    select: { id: true, name: true, children: { select: { id: true } } },
  });
  if (!category) notFound();

  const filter: ProductFilter = {
    page: paramsObj.page ? Math.max(1, parseInt(paramsObj.page, 10)) : 1,
    perPage: 12,
    sort: (CATALOG_SORTS as readonly string[]).includes(paramsObj.sort ?? '') ? (paramsObj.sort as ProductFilter['sort']) : 'featured',
    categorySlug: slug,
    brandSlugs: paramsObj.brand ? paramsObj.brand.split(',') : undefined,
    kinds: paramsObj.kind ? paramsObj.kind.split(',') : undefined,
    minPricePaise: paramsObj.minPrice ? parseInt(paramsObj.minPrice, 10) * 100 : undefined,
    maxPricePaise: paramsObj.maxPrice ? parseInt(paramsObj.maxPrice, 10) * 100 : undefined,
    ramGb: paramsObj.ram ? paramsObj.ram.split(',').map(Number) : undefined,
    storageGb: paramsObj.storage ? paramsObj.storage.split(',').map(Number) : undefined,
    colors: paramsObj.color ? paramsObj.color.split(',') : undefined,
    badges: paramsObj.badge ? paramsObj.badge.split(',') : undefined,
    ratingMin: paramsObj.rating ? parseInt(paramsObj.rating, 10) : undefined,
    inStockOnly: paramsObj.inStock === 'true',
    q: paramsObj.q,
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{category.name}</h1>
        <p className="mt-1 text-sm text-ink-3">{result.total} {result.total === 1 ? 'device' : 'devices'} found</p>
      </header>

      <Suspense fallback={<CategorySkeleton />}>
        <ProductListingClient
          initialResult={result}
          initialFilter={filter}
          brands={brands}
          categories={categories}
          kinds={kinds}
          sorts={CATALOG_SORTS}
          sortLabels={CATALOG_SORT_LABEL}
        />
      </Suspense>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-panel-2 shimmer rounded" />
      <div className="h-4 w-32 bg-panel-2 shimmer rounded" />
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