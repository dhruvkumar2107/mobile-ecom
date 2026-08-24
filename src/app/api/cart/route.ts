import { route, ok, body, AppError } from '@/lib/api';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { resolveCart, getCart, updateQuantity, removeFromCart, setProtection } from '@/lib/services/cart';

const UpdateSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(5).optional(),
  protectionPlanId: z.string().nullable().optional(),
});

export const PATCH = route(async (req: Request) => {
  const user = await getCurrentUser();
  const input = await body(req, UpdateSchema);
  const cartId = await resolveCart(user?.id ?? null);

  if (input.quantity !== undefined) {
    await updateQuantity(cartId, input.itemId, input.quantity);
  }
  if (input.protectionPlanId !== undefined) {
    await setProtection(cartId, input.itemId, input.protectionPlanId);
  }

  const cart = await getCart(cartId, { loyaltyTier: user?.loyaltyTier ?? null });
  return ok(cart);
});

export const DELETE = route(async (req: Request) => {
  const user = await getCurrentUser();
  const input = await body(req, z.object({ itemId: z.string().min(1) }));
  const cartId = await resolveCart(user?.id ?? null);

  await removeFromCart(cartId, input.itemId);
  const cart = await getCart(cartId, { loyaltyTier: user?.loyaltyTier ?? null });
  return ok(cart);
});