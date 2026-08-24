import { route, ok, query, AppError } from '@/lib/api';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { listOrders } from '@/lib/services/orders';

const Schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.string().optional(),
});

export const GET = route(async (req: Request) => {
  const user = await requireUser();
  const input = await query(req, Schema);
  const result = await listOrders(user.id, {
    take: 10,
    skip: ((input.page ?? 1) - 1) * 10,
    status: input.status === 'all' ? undefined : input.status,
  });
  return ok(result);
});