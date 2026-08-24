import { route, body, clientIp, deviceHint } from '@/lib/api';
import { z } from 'zod';
import { consumeResetToken, hashPassword, verifyOtp, createSession } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  token: z.string().min(1).optional(),
  password: z.string().min(8),
  // OTP-based reset
  identifier: z.string().optional(),
  code: z.string().length(6).optional(),
}).refine((d) => d.token || (d.identifier && d.code), { message: 'Token or OTP required' });

export const POST = route(async (req) => {
  const { token, password, identifier, code } = await body(req, schema);

  let userId: string | null = null;

  if (token) {
    userId = await consumeResetToken(token);
  } else if (identifier && code) {
    const result = await verifyOtp(identifier, 'reset', code);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.reason }, { status: 400 });
    }
    const user = await db.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }], status: 'active' },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  if (!userId) {
    return Response.json({ ok: false, error: 'Invalid or expired reset token.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  await db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });

  await createSession(userId, { ip: clientIp(req), userAgent: req.headers.get('user-agent'), device: deviceHint(req) });

  return Response.json({ ok: true, data: null });
});