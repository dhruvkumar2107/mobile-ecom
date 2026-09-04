import { prisma } from './kit';

const BANNERS = [
  {
    title: 'iPhone 15 Pro Max',
    subtitle: 'Titanium. So strong. So light. So Pro.',
    eyebrow: 'New Launch',
    ctaLabel: 'Shop Now',
    ctaHref: '/mobile/product/apple-iphone-15-pro-max',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accent: '#2874F0',
    placement: 'hero',
    sortOrder: 1,
    isActive: true,
  },
  {
    title: 'Galaxy S24 Ultra',
    subtitle: 'Galaxy AI is here. The next chapter of mobile.',
    eyebrow: 'Samsung',
    ctaLabel: 'Explore',
    ctaHref: '/mobile/product/samsung-galaxy-s24-ultra',
    gradient: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #2d1b69 100%)',
    accent: '#1428A0',
    placement: 'hero',
    sortOrder: 2,
    isActive: true,
  },
  {
    title: 'Monsoon Mega Sale',
    subtitle: 'Up to 60% off on top brands. Limited period offer.',
    eyebrow: 'Sale',
    ctaLabel: 'Shop Deals',
    ctaHref: '/mobile/products?sort=discount',
    gradient: 'linear-gradient(135deg, #FF6B00 0%, #FF9F00 50%, #FFE500 100%)',
    accent: '#FF9F00',
    placement: 'hero',
    sortOrder: 3,
    isActive: true,
  },
  {
    title: 'OnePlus 12',
    subtitle: 'The new standard of flagship. Snapdragon 8 Gen 3.',
    eyebrow: 'OnePlus',
    ctaLabel: 'Buy Now',
    ctaHref: '/mobile/product/oneplus-12',
    gradient: 'linear-gradient(135deg, #FF1010 0%, #CC0000 50%, #990000 100%)',
    accent: '#FF1010',
    placement: 'hero',
    sortOrder: 4,
    isActive: true,
  },
  {
    title: 'Audio Festival',
    subtitle: 'Premium headphones & earbuds starting at ₹999',
    eyebrow: 'Audio',
    ctaLabel: 'Shop Audio',
    ctaHref: '/mobile/category/audio',
    gradient: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #333333 100%)',
    accent: '#F58220',
    placement: 'hero',
    sortOrder: 5,
    isActive: true,
  },
  {
    title: 'Exchange & Save',
    subtitle: 'Get up to ₹45,000 off on your old device',
    eyebrow: 'Exchange',
    ctaLabel: 'Check Value',
    ctaHref: '/mobile',
    gradient: 'linear-gradient(135deg, #26A541 0%, #1B7A30 50%, #0D5A20 100%)',
    accent: '#26A541',
    placement: 'hero',
    sortOrder: 6,
    isActive: true,
  },
];

export async function seedBanners(): Promise<void> {
  for (const banner of BANNERS) {
    const existing = await prisma.banner.findFirst({ where: { title: banner.title } });
    if (!existing) {
      await prisma.banner.create({ data: banner });
    }
  }
  console.log(`Seeded ${BANNERS.length} banners`);
}
