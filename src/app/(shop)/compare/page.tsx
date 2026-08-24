import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { compareProducts, type CompareResult, MAX_COMPARE } from '@/lib/services/catalog';
import { CompareClient } from './CompareClient';

export const metadata: Metadata = {
  title: 'Compare devices',
  description: 'Compare up to four phones, tablets, or accessories side by side. Specs, price, EMI and ratings — all in one view.',
};

interface ComparePageProps {
  searchParams: Promise<{
    p?: string;
  }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const slugs = params.p ? params.p.split(',').slice(0, MAX_COMPARE) : [];

  let result: CompareResult | null = null;
  if (slugs.length >= 2) {
    try {
      result = await compareProducts(slugs, { loyaltyTier: user?.loyaltyTier ?? null });
    } catch {
      result = null;
    }
  }

  const [products, brands] = await Promise.all([
    db.product.findMany({
      where: { status: 'active' },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 50,
      select: { id: true, name: true, slug: true, brand: { select: { name: true } }, heroGradient: true },
    }),
    db.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, accent: true },
    }),
  ]);

  return (
    <CompareClient
      initialResult={result}
      selectedSlugs={slugs}
      allProducts={products}
      allBrands={brands}
      maxCompare={MAX_COMPARE}
    />
  );
}