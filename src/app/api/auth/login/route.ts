import { route, body, clientIp, deviceHint } from '@/lib/api';
import { z } from 'zod';
import { verifyPassword, createSession } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export const POST = route(async (req) => {
  const { identifier, password } = await body(req, schema);

  const user = await db.user.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: identifier }],
      status: 'active',
    },
    select: { id: true, passwordHash: true, role: true, status: true },
  });

  if (!user || !user.passwordHash) {
    return new Response(null, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return new Response(null, { status: 401 });
  }

  await createSession(user.id, {
    ip: clientIp(req),
    userAgent: req.headers.get('user-agent'),
    device: deviceHint(req),
  });

  return Response.json({ ok: true, data: { devCode: undefined } });
});