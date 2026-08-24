import { route, ok, body, AppError } from '@/lib/api';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { createWalletTopupOrder } from '@/lib/services/payments';

const Schema = z.object({
  amountPaise: z.number().int().min(1000).max(10_000_000),
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const input = await body(req, Schema);

  const result = await createWalletTopupOrder(user.id, input.amountPaise);
  return ok(result);
});