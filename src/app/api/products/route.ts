import { route, query } from '@/lib/api';
import { z } from 'zod';
import { listProducts, type ProductFilter, type ListResult } from '@/lib/services/catalog';

const schema = z.object({
  q: z.string().optional(),
  brandSlugs: z.string().optional(),
  categorySlug: z.string().optional(),
  kinds: z.string().optional(),
  minPricePaise: z.coerce.number().optional(),
  maxPricePaise: z.coerce.number().optional(),
  ramGb: z.string().optional(),
  storageGb: z.string().optional(),
  colors: z.string().optional(),
  badges: z.string().optional(),
  ratingMin: z.coerce.number().optional(),
  inStockOnly: z.coerce.boolean().optional(),
  sort: z.enum(['featured', 'newest', 'price_asc', 'price_desc', 'rating', 'popular', 'discount']).optional(),
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(60).optional(),
  loyaltyTier: z.string().nullable().optional(),
});

export const GET = route(async (req) => {
  const params = query(req, schema);
  const filter: ProductFilter = {
    q: params.q,
    brandSlugs: params.brandSlugs?.split(',').filter(Boolean),
    categorySlug: params.categorySlug,
    kinds: params.kinds?.split(',').filter(Boolean),
    minPricePaise: params.minPricePaise,
    maxPricePaise: params.maxPricePaise,
    ramGb: params.ramGb?.split(',').map(Number).filter(Boolean),
    storageGb: params.storageGb?.split(',').map(Number).filter(Boolean),
    colors: params.colors?.split(',').filter(Boolean),
    badges: params.badges?.split(',').filter(Boolean),
    ratingMin: params.ratingMin,
    inStockOnly: params.inStockOnly,
    sort: params.sort,
    page: params.page,
    perPage: params.perPage,
    loyaltyTier: params.loyaltyTier ?? null,
  };
  const result: ListResult = await listProducts(filter);
  const res = Response.json({ ok: true, data: result });
  // Cache for 30 seconds, stale-while-revalidate for 5 minutes
  res.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
  return res;
});