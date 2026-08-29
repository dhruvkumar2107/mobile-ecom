import { route, body, enforceRateLimit, clientIp } from '@/lib/api';
import { z } from 'zod';
import { issueResetToken, issueOtp } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  identifier: z.string().min(1),
  channel: z.enum(['email', 'sms']),
});

export const POST = route(async (req) => {
  const { identifier, channel } = await body(req, schema);

  enforceRateLimit(`pwreset:${identifier}`, 3, 60 * 60 * 1000);

  const user = await db.user.findFirst({
    where: channel === 'email' ? { email: identifier } : { phone: identifier },
    select: { id: true },
  });

  if (!user) {
    return Response.json({ ok: true, data: { devToken: undefined } });
  }

  if (channel === 'email') {
    await issueResetToken(user.id);
  } else {
    await issueOtp(identifier, 'sms', 'reset', clientIp(req));
  }

  return Response.json({ ok: true });
});