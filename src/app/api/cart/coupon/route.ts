import { route, ok, body } from '@/lib/api';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { resolveCart, getCart, setCartCoupon } from '@/lib/services/cart';

const ApplySchema = z.object({
  couponCode: z.string().min(1).max(32),
});

export const POST = route(async (req: Request) => {
  const user = await getCurrentUser();
  const input = await body(req, ApplySchema);
  const cartId = await resolveCart(user?.id ?? null);

  await setCartCoupon(cartId, input.couponCode);
  const cart = await getCart(cartId, { loyaltyTier: user?.loyaltyTier ?? null });
  return ok(cart);
});

export const DELETE = route(async (req: Request) => {
  const user = await getCurrentUser();
  const cartId = await resolveCart(user?.id ?? null);

  await setCartCoupon(cartId, null);
  const cart = await getCart(cartId, { loyaltyTier: user?.loyaltyTier ?? null });
  return ok(cart);
});