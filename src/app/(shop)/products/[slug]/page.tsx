import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProductBySlug, type ProductDetail } from '@/lib/services/catalog';
import { ProductDetailClient } from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug, { includeDraft: true });
    return {
      title: product.seo.title,
      description: product.seo.description,
      openGraph: {
        title: product.seo.title,
        description: product.seo.description,
        type: 'website',
      },
    };
  } catch {
    return { title: 'Product not found' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  let product: ProductDetail;
  try {
    product = await getProductBySlug(slug, { loyaltyTier: user?.loyaltyTier ?? null });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Product not found.' || err.message === 'This product is no longer available.')) {
      notFound();
    }
    throw err;
  }

  return <ProductDetailClient initialData={product} />;
}