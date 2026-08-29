import { route, body, clientIp, deviceHint } from '@/lib/api';
import { z } from 'zod';
import { hashPassword, issueOtp, allocateReferralCode } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).max(15).optional().nullable(),
  password: z.string().min(8),
  referralCode: z.string().optional().nullable(),
}).refine((d) => d.email || d.phone, { message: 'Email or phone is required', path: ['email'] });

export const POST = route(async (req) => {
  const { name, email, phone, password, referralCode } = await body(req, schema);

  const existing = await db.user.findFirst({
    where: { OR: [{ email: email ?? undefined }, { phone: phone ?? undefined }].filter(Boolean) as any },
    select: { id: true },
  });
  if (existing) {
    return Response.json({ ok: false, error: 'An account with this email or phone already exists.' }, { status: 409 });
  }

  let referredById: string | null = null;
  if (referralCode) {
    const referrer = await db.user.findUnique({ where: { referralCode }, select: { id: true } });
    if (referrer) referredById = referrer.id;
  }

  const passwordHash = await hashPassword(password);
  const code = await allocateReferralCode(name);

  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: email?.toLowerCase() ?? null,
      phone: phone?.replace(/\D/g, '') ?? null,
      passwordHash,
      referralCode: code,
      referredById,
      signupIp: clientIp(req),
      signupDevice: deviceHint(req),
    },
    select: { id: true, email: true, phone: true },
  });

  const identifier = email ?? phone!;
  const channel = email ? 'email' : 'sms';
  const otp = await issueOtp(identifier, channel, 'signup', clientIp(req));

  return Response.json({ ok: true });
});