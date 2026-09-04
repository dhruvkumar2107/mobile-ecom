import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    await requireStaff();
    const { id, variantId } = await params;
    const body = await request.json();

    const variant = await db.productVariant.findFirst({
      where: { id: variantId, productId: id },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const updated = await db.productVariant.update({
      where: { id: variantId },
      data: {
        ...(body.mrpPaise !== undefined && { mrpPaise: body.mrpPaise }),
        ...(body.pricePaise !== undefined && { pricePaise: body.pricePaise }),
        ...(body.sku !== undefined && { sku: body.sku }),
        ...(body.colorName !== undefined && { colorName: body.colorName }),
        ...(body.colorHex !== undefined && { colorHex: body.colorHex }),
        ...(body.ramGb !== undefined && { ramGb: body.ramGb }),
        ...(body.storageGb !== undefined && { storageGb: body.storageGb }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({ variant: updated });
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status });
    }
    console.error('Failed to update variant:', error);
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
  }
}
