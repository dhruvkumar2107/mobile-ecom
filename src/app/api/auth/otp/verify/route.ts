import { route, body, clientIp, deviceHint } from '@/lib/api';
import { z } from 'zod';
import { verifyOtp, createSession } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  identifier: z.string().min(1),
  purpose: z.enum(['login', 'signup', 'reset', 'verify_phone']),
  code: z.string().length(6),
});

export const POST = route(async (req) => {
  const { identifier, purpose, code } = await body(req, schema);

  const result = await verifyOtp(identifier, purpose, code);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.reason }, { status: 400 });
  }

  if (purpose === 'login' || purpose === 'signup') {
    const user = await db.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }], status: 'active' },
      select: { id: true },
    });
    if (!user) {
      return Response.json({ ok: false, error: 'Account not found.' }, { status: 404 });
    }
    await createSession(user.id, { ip: clientIp(req), userAgent: req.headers.get('user-agent'), device: deviceHint(req) });
  }

  return Response.json({ ok: true, data: null });
});