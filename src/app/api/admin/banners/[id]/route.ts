import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();
    const { id } = await params;
    const body = await request.json();

    const banner = await db.banner.findUnique({ where: { id } });
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const updated = await db.banner.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
        ...(body.eyebrow !== undefined && { eyebrow: body.eyebrow }),
        ...(body.ctaLabel !== undefined && { ctaLabel: body.ctaLabel }),
        ...(body.ctaHref !== undefined && { ctaHref: body.ctaHref }),
        ...(body.gradient !== undefined && { gradient: body.gradient }),
        ...(body.accent !== undefined && { accent: body.accent }),
        ...(body.placement !== undefined && { placement: body.placement }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.startsAt !== undefined && { startsAt: body.startsAt ? new Date(body.startsAt) : null }),
        ...(body.endsAt !== undefined && { endsAt: body.endsAt ? new Date(body.endsAt) : null }),
      },
    });

    return NextResponse.json({ banner: updated });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status });
    }
    console.error('Failed to update banner:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();
    const { id } = await params;

    const banner = await db.banner.findUnique({ where: { id } });
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    await db.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status });
    }
    console.error('Failed to delete banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
