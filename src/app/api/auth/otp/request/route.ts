import { route, body, enforceRateLimit, clientIp } from '@/lib/api';
import { z } from 'zod';
import { issueOtp } from '@/lib/auth';

const schema = z.object({
  identifier: z.string().min(1),
  purpose: z.enum(['login', 'signup', 'reset', 'verify_phone']),
  channel: z.enum(['sms', 'email']).optional(),
});

export const POST = route(async (req) => {
  const { identifier, purpose, channel } = await body(req, schema);

  enforceRateLimit(`otp:${identifier}:${purpose}`, 5, 10 * 60 * 1000);

  const ch = channel ?? (identifier.includes('@') ? 'email' : 'sms');
  const otp = await issueOtp(identifier, ch, purpose, clientIp(req));

  return Response.json({ ok: true });
});