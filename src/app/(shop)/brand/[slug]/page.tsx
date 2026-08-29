import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { listProducts, type ProductFilter, type ListResult } from '@/lib/services/catalog';
import { CATALOG_SORTS, CATALOG_SORT_LABEL } from '@/lib/services/catalog';
import { ProductListingClient } from '@/app/(shop)/products/ProductListingClient';

interface BrandPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
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

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await db.brand.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!brand) return { title: 'Brand not found' };
  return {
    title: brand.name,
    description: `Shop ${brand.name} devices at VOLTAGE. GST invoice, warranty tracked, no-cost EMI, same-day dispatch.`,
  };
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const { slug } = await params;
  const paramsObj = await searchParams;
  const user = await getCurrentUser();

  const brand = await db.brand.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!brand) notFound();

  const filter: ProductFilter = {
    page: paramsObj.page ? Math.max(1, parseInt(paramsObj.page, 10)) : 1,
    perPage: 12,
    sort: (CATALOG_SORTS as readonly string[]).includes(paramsObj.sort ?? '') ? (paramsObj.sort as ProductFilter['sort']) : 'featured',
    brandSlugs: [slug],
    categorySlug: paramsObj.category,
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
  } catch {
    notFound();
  }

  const [brands, categories, kinds] = await Promise.all([
    db.brand.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true, accent: true } }),
    db.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true, icon: true } }),
    db.category.findMany({ where: { isActive: true, parentId: { not: null } }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{brand.name}</h1>
        <p className="mt-1 text-sm text-ink-3">{result.total} {result.total === 1 ? 'device' : 'devices'} found</p>
      </header>

      <ProductListingClient
        initialResult={result}
        initialFilter={filter}
        brands={brands}
        categories={categories}
        kinds={kinds}
        sorts={CATALOG_SORTS}
        sortLabels={CATALOG_SORT_LABEL}
      />
    </div>
  );
}
