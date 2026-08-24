import { PrismaClient } from '@prisma/client';

/**
 * Single Prisma instance. Next dev-mode hot reload would otherwise open a new
 * connection pool on every edit until SQLite starts refusing writes.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
