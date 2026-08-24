import { route, ok, query } from '@/lib/api';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { getWalletTransactions } from '@/lib/services/wallet';

const Schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  type: z.string().optional(),
});

export const GET = route(async (req: Request) => {
  const user = await requireUser();
  const input = await query(req, Schema);
  const result = await getWalletTransactions(user.id, {
    page: input.page,
    perPage: 20,
    type: input.type === 'all' ? undefined : input.type,
  });
  return ok(result);
});