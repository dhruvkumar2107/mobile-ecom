import { unstable_cache } from 'next/cache';
import { listProducts, type ProductCard } from '@/lib/services/catalog';
import { db } from '@/lib/db';
import MobileHomeClient from './MobileHomeClient';

async function getCachedProducts(): Promise<ProductCard[]> {
  const result = await listProducts({ perPage: 12, sort: 'popular' });
  return result.items;
}

async function getBanners() {
  try {
    const banners = await db.banner.findMany({
      where: {
        isActive: true,
        placement: 'hero',
        OR: [
          { startsAt: null },
          { startsAt: { lte: new Date() } },
        ],
        AND: [
          { endsAt: null },
          { endsAt: { gte: new Date() } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      take: 6,
    });
    if (banners.length === 0) {
      return [
        { id: '1', image: '', title: 'iPhone 15 Pro Max', subtitle: 'Titanium. So strong. So light. So Pro.', ctaText: 'Shop Now', ctaHref: '/mobile', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', backgroundColor: '#2874F0' },
        { id: '2', image: '', title: 'Galaxy S24 Ultra', subtitle: 'Galaxy AI is here', ctaText: 'Explore', ctaHref: '/mobile', gradient: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #2d1b69 100%)', backgroundColor: '#1428A0' },
        { id: '3', image: '', title: 'Monsoon Mega Sale', subtitle: 'Up to 60% off on top brands', ctaText: 'Shop Deals', ctaHref: '/mobile', gradient: 'linear-gradient(135deg, #FF6B00 0%, #FF9F00 50%, #FFE500 100%)', backgroundColor: '#FF9F00' },
      ];
    }
    return banners.map(b => ({
      id: b.id,
      image: '',
      title: b.title,
      subtitle: b.subtitle || undefined,
      ctaText: b.ctaLabel || undefined,
      ctaHref: b.ctaHref || undefined,
      gradient: b.gradient || undefined,
      backgroundColor: b.accent || undefined,
    }));
  } catch {
    return [
      { id: '1', image: '', title: 'iPhone 15 Pro Max', subtitle: 'Titanium. So strong. So light. So Pro.', ctaText: 'Shop Now', ctaHref: '/mobile', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', backgroundColor: '#2874F0' },
      { id: '2', image: '', title: 'Galaxy S24 Ultra', subtitle: 'Galaxy AI is here', ctaText: 'Explore', ctaHref: '/mobile', gradient: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #2d1b69 100%)', backgroundColor: '#1428A0' },
      { id: '3', image: '', title: 'Monsoon Mega Sale', subtitle: 'Up to 60% off on top brands', ctaText: 'Shop Deals', ctaHref: '/mobile', gradient: 'linear-gradient(135deg, #FF6B00 0%, #FF9F00 50%, #FFE500 100%)', backgroundColor: '#FF9F00' },
    ];
  }
}

async function getCategories() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 10,
      select: { id: true, name: true, slug: true, imageUrl: true },
    });
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.imageUrl || '/icon.svg',
    }));
  } catch {
    return [];
  }
}

export default async function MobileHomePage() {
  const [products, banners, categories] = await Promise.all([
    unstable_cache(getCachedProducts, ['mobile-home-products'], { revalidate: 60, tags: ['mobile-home'] })(),
    unstable_cache(getBanners, ['mobile-home-banners'], { revalidate: 300, tags: ['banners'] })(),
    unstable_cache(getCategories, ['mobile-home-categories'], { revalidate: 300, tags: ['categories'] })(),
  ]);

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand.name,
    price: p.finalPaise / 100,
    originalPrice: p.mrpPaise > p.finalPaise ? p.mrpPaise / 100 : undefined,
    image: p.imageUrl || '/icon.svg',
    rating: p.ratingAvg,
    reviewCount: p.reviewCount,
    badge: p.badges[0],
    discountPercent: p.discountPercent,
    slug: p.slug,
  }));

  return (
    <MobileHomeClient
      initialProducts={formattedProducts}
      initialBanners={banners}
      initialCategories={categories}
    />
  );
}
