import { unstable_cache } from 'next/cache';
import { listProducts, type ProductCard } from '@/lib/services/catalog';
import MobileHomeClient from './MobileHomeClient';

async function getCachedProducts(): Promise<ProductCard[]> {
  const result = await listProducts({ perPage: 8, sort: 'popular' });
  return result.items;
}

export default async function MobileHomePage() {
  const products = await unstable_cache(getCachedProducts, ['mobile-home-products'], { revalidate: 60, tags: ['mobile-home'] })();

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
  }));

  const formattedBanners = [
    { id: '1', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', title: 'iPhone 15 Pro Max', href: '/products/apple-iphone-15-pro-max' },
    { id: '2', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80', title: 'Galaxy S24 Ultra', href: '/products/samsung-galaxy-s24-ultra' },
    { id: '3', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', title: 'MacBook Air M3', href: '/products/apple-macbook-air-m3' },
  ];

  return <MobileHomeClient initialProducts={formattedProducts} initialBanners={formattedBanners} />;
}