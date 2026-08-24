import { route, body } from '@/lib/api';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { updateSettings, type AppSettings } from '@/lib/services/settings';

const schema = z.object({
  sellerName: z.string().optional(),
  sellerGstin: z.string().optional(),
  sellerState: z.string().optional(),
  sellerAddress: z.string().optional(),
  supportEmail: z.string().email().optional(),
  supportPhone: z.string().optional(),
  freeShippingAbovePaise: z.number().int().nonnegative().optional(),
  standardShippingPaise: z.number().int().nonnegative().optional(),
  expressShippingPaise: z.number().int().nonnegative().optional(),
  codFeePaise: z.number().int().nonnegative().optional(),
  codMaxOrderPaise: z.number().int().nonnegative().optional(),
  walletMaxPercentOnOrder: z.number().int().min(0).max(100).optional(),
  returnWindowDays: z.number().int().positive().optional(),
  payoutMinPaise: z.number().int().nonnegative().optional(),
  payoutMaxPerDayPaise: z.number().int().nonnegative().optional(),
  payoutAutoApproveBelowPaise: z.number().int().nonnegative().optional(),
  payoutRequiresVerifiedBank: z.boolean().optional(),
  loyaltyEarnRateBps: z.number().int().nonnegative().optional(),
  loyaltyRedeemRatePaise: z.number().int().nonnegative().optional(),
  siteTitle: z.string().optional(),
  siteTagline: z.string().optional(),
  announcementText: z.string().optional(),
  announcementEnabled: z.boolean().optional(),
}).partial();

export const PATCH = route(async (req) => {
  const user = await requireStaff('settings.write');
  const patch = await body(req, schema);
  await updateSettings(patch as Partial<AppSettings>, user.id);
  return Response.json({ ok: true, data: null });
});