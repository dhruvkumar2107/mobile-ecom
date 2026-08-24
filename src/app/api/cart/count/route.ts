import { route, ok } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { resolveCart } from '@/lib/services/cart';
import { db } from '@/lib/db';

export const GET = route(async (req: Request) => {
  const user = await getCurrentUser();
  const cartId = await resolveCart(user?.id ?? null);

  const items = await db.cartItem.findMany({
    where: { cartId },
    select: { quantity: true },
  });

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return ok({ count });
});
