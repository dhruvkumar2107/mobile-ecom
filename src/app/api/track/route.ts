import { route, ok, query, AppError } from '@/lib/api';
import { z } from 'zod';
import { trackOrder } from '@/lib/services/orders';

const Schema = z.object({
  orderNo: z.string().min(1),
});

export const GET = route(async (req: Request) => {
  const input = await query(req, Schema);
  const order = await trackOrder(input.orderNo.trim().toUpperCase());
  return ok(order);
});