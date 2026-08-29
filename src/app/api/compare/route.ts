import { route, ok } from '@/lib/api';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { compareProducts } from '@/lib/services/catalog';

export const GET = route(async (req: Request) => {
  const user = await getCurrentUser();
  const url = new URL(req.url);
  const p = url.searchParams.get('p')?.split(',').filter(Boolean).slice(0, 4) ?? [];
  const result = await compareProducts(p, { loyaltyTier: user?.loyaltyTier ?? null });
  return ok(result);
});