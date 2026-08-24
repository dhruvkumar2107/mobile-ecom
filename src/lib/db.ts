import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client/web';

/**
 * Single Prisma instance. Next dev-mode hot reload would otherwise open a new
 * connection pool on every edit until SQLite starts refusing writes.
 *
 * Two backends, chosen by environment:
 *
 *  • TURSO_DATABASE_URL set → hosted libSQL (Turso). Required on serverless
 *    hosts such as Vercel, where the function filesystem is read-only outside
 *    /tmp and thrown away between invocations, so a `file:` SQLite database is
 *    neither writable nor reliably present at request time.
 *
 *  • otherwise → file-backed SQLite from DATABASE_URL, for local dev and for
 *    container deploys where the file sits on a persistent volume.
 *
 * Turso is wire-compatible with SQLite, so the schema and seed are identical
 * on both paths.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    // The `/web` build talks HTTP, so no native .node binary has to be traced
    // into the serverless bundle.
    const adapter = new PrismaLibSQL(
      createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN }),
    );
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export const db = globalForPrisma.prisma ?? createPrisma();

// Cached in every environment, not just dev: a warm serverless invocation
// should reuse the client rather than stand up a new engine per request.
globalForPrisma.prisma = db;
