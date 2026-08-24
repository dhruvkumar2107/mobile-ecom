#!/usr/bin/env tsx
/**
 * Setup the Turso production database
 * This script will:
 * 1. Apply the database schema to Turso
 * 2. Seed the database with initial data
 * 
 * Run this ONCE when setting up your Turso database for the first time
 * 
 * Usage:
 *   TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npm run setup:turso
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { execSync } from 'child_process';

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !authToken) {
    console.error('❌ Missing environment variables');
    console.error('');
    console.error('Required:');
    console.error('  TURSO_DATABASE_URL - Your Turso database URL');
    console.error('  TURSO_AUTH_TOKEN - Your Turso auth token');
    console.error('');
    console.error('Usage:');
    console.error('  TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npm run setup:turso');
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         VOLTAGE - Turso Database Setup                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🌍 Connecting to Turso...');
  console.log(`   URL: ${tursoUrl}`);
  console.log('');

  // Create adapter for Turso
  const adapter = new PrismaLibSQL(
    createClient({ url: tursoUrl, authToken })
  );

  const prisma = new PrismaClient({ adapter });

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful');
    console.log('');

    // Apply schema using prisma db push
    console.log('📋 Applying database schema...');
    execSync('prisma db push --accept-data-loss --skip-generate', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: tursoUrl + '?authToken=' + authToken,
      },
    });
    console.log('✅ Schema applied');
    console.log('');

    // Run seed
    console.log('🌱 Seeding database...');
    execSync('tsx prisma/seed.ts', {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('');
    console.log('✅ Database seeded successfully');
    console.log('');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎉 Setup Complete!                                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Next steps:');
    console.log('1. Add these environment variables to Vercel:');
    console.log(`   TURSO_DATABASE_URL=${tursoUrl}`);
    console.log(`   TURSO_AUTH_TOKEN=${authToken}`);
    console.log('2. Deploy your application');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

