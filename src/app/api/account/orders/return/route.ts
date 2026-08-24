import { route, ok, body, AppError } from '@/lib/api';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { returnOrder, getOrder } from '@/lib/services/orders';

const Schema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const input = await body(req, Schema);

  const order = await getOrder(input.orderId, user.id).catch(() => null);
  if (!order) throw new AppError('Order not found.', 404);

  if (!order.canReturn) {
    throw new AppError('This order cannot be returned.', 409);
  }

  await returnOrder({
    orderId: input.orderId,
    reason: input.reason,
    actorId: user.id,
    restock: true,
  });

  const updatedOrder = await getOrder(input.orderId, user.id);
  return ok(updatedOrder);
});