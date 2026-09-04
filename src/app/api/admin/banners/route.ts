import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireStaff();
    const banners = await db.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ banners });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status });
    }
    return NextResponse.json({ banners: [] });
  }
}

export async function POST(request: Request) {
  try {
    await requireStaff();
    const body = await request.json();
    const { title, subtitle, eyebrow, ctaLabel, ctaHref, gradient, accent, placement, sortOrder } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const banner = await db.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        eyebrow: eyebrow || null,
        ctaLabel: ctaLabel || null,
        ctaHref: ctaHref || null,
        gradient: gradient || 'linear-gradient(135deg, #2874F0 0%, #1E5FC0 100%)',
        accent: accent || '#2874F0',
        placement: placement || 'hero',
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return NextResponse.json({ banner });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status });
    }
    console.error('Failed to create banner:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}
