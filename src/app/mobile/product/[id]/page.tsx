import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/services/catalog';
import { db } from '@/lib/db';
import ProductDetailClient from './ProductDetailClient';
import { unstable_cache } from 'next/cache';

async function getProduct(slug: string) {
  try {
    const product = await getProductBySlug(slug);
    return product;
  } catch {
    return null;
  }
}

async function getReviews(productId: string) {
  try {
    const reviews = await db.review.findMany({
      where: { productId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });
    return reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title || '',
      text: r.body,
      date: r.createdAt.toISOString(),
      user: r.user?.name || 'Anonymous',
    }));
  } catch {
    return [];
  }
}

async function getRelatedProducts(categoryId: string, currentId: string) {
  try {
    const products = await db.product.findMany({
      where: { categoryId, status: 'active', id: { not: currentId } },
      include: {
        brand: true,
        variants: { where: { isActive: true }, take: 1 },
      },
      take: 6,
    });
    return products.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand.name,
      price: (p.variants[0]?.pricePaise || p.pricePaise) / 100,
      originalPrice: (p.variants[0]?.mrpPaise || p.mrpPaise) / 100,
      image: p.imageUrl || '/icon.svg',
      slug: p.slug,
      rating: p.ratingAvg,
      reviewCount: p.reviewCount,
    }));
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await unstable_cache(
    () => getProduct(id),
    [`product-${id}`],
    { revalidate: 120, tags: ['products'] }
  )();

  if (!product) notFound();

  const [reviews, relatedProducts] = await Promise.all([
    getReviews(product.id),
    getRelatedProducts(product.category.id, product.id),
  ]);

  const defaultVariant = product.variants.find(v => v.id === product.defaultVariantId) || product.variants[0];

  return (
    <ProductDetailClient
      product={{
        id: product.id,
        name: product.name,
        tagline: product.tagline || '',
        description: product.description || '',
        brand: product.brand.name,
        brandId: product.brand.id,
        category: product.category.name,
        imageUrl: product.imageUrl || '',
        badges: product.badges,
        highlights: product.highlights,
        warrantyMonths: product.warrantyMonths,
        ratingAvg: product.ratingAvg,
        reviewCount: product.reviewCount,
        soldCount: product.soldCount,
        slug: product.slug,
        priceRange: product.priceRange,
      }}
      variants={product.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        colorName: v.colorName,
        colorHex: v.colorHex,
        colorHex2: v.colorHex2 || null,
        finish: v.finish || '',
        ramGb: v.ramGb,
        storageGb: v.storageGb,
        mrpPaise: v.mrpPaise,
        pricePaise: v.pricePaise,
        finalPaise: v.finalPaise,
        discountPercent: v.discountPercent,
        inStock: v.inStock,
        lowStock: v.lowStock,
        imageUrl: v.imageUrl ?? null,
        isDefault: v.isDefault,
      }))}
      colors={product.colors.map(c => ({ ...c, finish: c.finish || '' }))}
      ramOptions={product.ramOptions}
      storageOptions={product.storageOptions}
      specGroups={product.specGroups.map(g => ({
        groupName: g.groupName,
        rows: g.rows.map(r => ({
          key: r.key,
          label: r.label,
          value: r.value,
          unit: r.unit || '',
          isKeySpec: r.isKeySpec,
        })),
      }))}
      keySpecs={product.keySpecs.map(s => ({
        key: s.key,
        label: s.label,
        value: s.value,
        unit: s.unit || '',
        isKeySpec: true,
      }))}
      ratingBreakdown={product.ratingBreakdown}
      defaultVariantId={product.defaultVariantId}
      reviews={reviews}
      relatedProducts={relatedProducts}
    />
  );
}
