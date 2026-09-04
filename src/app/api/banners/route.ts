import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const formatted = banners.map(b => ({
      id: b.id,
      image: '',
      title: b.title,
      subtitle: b.subtitle || undefined,
      ctaText: b.ctaLabel || undefined,
      ctaHref: b.ctaHref || undefined,
      gradient: b.gradient || undefined,
      backgroundColor: b.accent || undefined,
    }));

    return NextResponse.json({ banners: formatted });
  } catch (error) {
    console.error('Failed to fetch banners:', error);
    return NextResponse.json({ banners: [] });
  }
}
