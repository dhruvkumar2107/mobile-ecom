import { route } from '@/lib/api';
import { db } from '@/lib/db';

export const GET = route(async () => {
  // Check database connectivity
  await db.$queryRaw`SELECT 1`;

  return Response.json({
    ok: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version ?? 'unknown',
    },
  });
});