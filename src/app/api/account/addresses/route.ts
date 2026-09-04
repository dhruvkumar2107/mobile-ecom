import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ addresses: [] });
    }

    const addresses = await db.address.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { isDefault: 'desc' },
    });

    const formatted = addresses.map(a => ({
      id: a.id,
      name: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 || undefined,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: a.isDefault,
      type: a.label as 'home' | 'work' | 'other',
    }));

    return NextResponse.json({ addresses: formatted });
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    return NextResponse.json({ addresses: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please login to save addresses' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, line1, line2, city, state, pincode, type } = body;

    if (!name || !phone || !line1 || !city || !state || !pincode) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 });
    }

    const existingCount = await db.address.count({
      where: { userId: user.id, deletedAt: null },
    });

    const address = await db.address.create({
      data: {
        userId: user.id,
        fullName: name,
        phone,
        line1,
        line2: line2 || null,
        city,
        state,
        pincode,
        label: type || 'home',
        isDefault: existingCount === 0,
      },
    });

    return NextResponse.json({
      address: {
        id: address.id,
        name: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: address.isDefault,
        type: address.label,
      },
    });
  } catch (error) {
    console.error('Failed to create address:', error);
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}
