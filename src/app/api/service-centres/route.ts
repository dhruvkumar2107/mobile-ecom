import { route, ok, query } from '@/lib/api';
import { z } from 'zod';
import { findServiceCentres } from '@/lib/services/serviceability';

const Schema = z.object({
  pincode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  brand: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export const GET = route(async (req: Request) => {
  const input = await query(req, Schema);
  const centres = await findServiceCentres({
    pincode: input.pincode,
    city: input.city,
    state: input.state,
    brandId: input.brand,
    lat: input.lat,
    lng: input.lng,
  });
  return ok(centres);
});