import { route, ok, body } from '@/lib/api';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const ToggleSchema = z.object({
  productId: z.string().min(1),
});

export const GET = route(async (req: Request) => {
  const user = await getCurrentUser();
  
  if (!user) {
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get or create wishlist
  let wishlist = await db.wishlist.findFirst({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: true,
              variants: {
                where: { isActive: true },
                take: 1,
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      },
    },
  });

  if (!wishlist) {
    wishlist = await db.wishlist.create({
      data: {
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                variants: {
                  where: { isActive: true },
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });
  }

  const items = wishlist.items.map(item => ({
    id: item.id,
    productId: item.productId,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      brandName: item.product.brand.name,
      imageUrl: item.product.imageUrl,
      heroGradient: item.product.heroGradient,
      mrpPaise: item.product.mrpPaise,
      pricePaise: item.product.pricePaise,
      ratingAvg: item.product.ratingAvg,
      inStock: item.product.variants.length > 0 && item.product.variants[0].isActive,
    },
    addedAt: item.addedAt,
  }));

  return ok({ items });
});

export const POST = route(async (req: Request) => {
  const user = await getCurrentUser();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const input = await body(req, ToggleSchema);

  // Get or create wishlist
  let wishlist = await db.wishlist.findFirst({
    where: { userId: user.id },
  });

  if (!wishlist) {
    wishlist = await db.wishlist.create({
      data: { userId: user.id },
    });
  }

  // Check if already in wishlist
  const existing = await db.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId: input.productId,
    },
  });

  if (existing) {
    // Remove from wishlist
    await db.wishlistItem.delete({
      where: { id: existing.id },
    });
    return ok({ added: false, message: 'Removed from wishlist' });
  } else {
    // Add to wishlist
    await db.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: input.productId,
      },
    });
    return ok({ added: true, message: 'Added to wishlist' });
  }
});

export const DELETE = route(async (req: Request) => {
  const user = await getCurrentUser();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const input = await body(req, z.object({ itemId: z.string().min(1) }));

  await db.wishlistItem.delete({
    where: { id: input.itemId },
  });

  return ok({ message: 'Removed from wishlist' });
});
