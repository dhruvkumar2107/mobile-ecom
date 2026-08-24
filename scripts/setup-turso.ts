#!/usr/bin/env tsx
/**
 * Setup the Turso production database
 * This script will:
 * 1. Read the migration SQL file
 * 2. Apply it directly to Turso
 * 3. Seed the database with initial data
 * 
 * Run this ONCE when setting up your Turso database for the first time
 * 
 * Usage:
 *   TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npm run setup:turso
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join } from 'path';
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
  const libsqlClient = createClient({ url: tursoUrl, authToken });
  const adapter = new PrismaLibSQL(libsqlClient);
  const prisma = new PrismaClient({ adapter });

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful');
    console.log('');

    // Read migration file
    console.log('📋 Reading migration SQL...');
    const migrationPath = join(process.cwd(), 'prisma', 'migrations', '20260824155935_init', 'migration.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    
    // Split SQL statements properly
    // Remove comments first, then split by semicolon
    const cleanedSql = migrationSql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`   Found ${statements.length} SQL statements`);
    console.log('');
    
    console.log('🔨 Applying schema to Turso...');
    let appliedCount = 0;
    for (const statement of statements) {
      try {
        await libsqlClient.execute(statement);
        appliedCount++;
        if (appliedCount % 10 === 0) {
          process.stdout.write(`   Applied ${appliedCount}/${statements.length} statements...\r`);
        }
      } catch (error: any) {
        // Ignore "table already exists" errors
        if (!error.message?.includes('already exists')) {
          console.error(`   ⚠️  Error applying statement: ${statement.substring(0, 50)}...`);
          console.error(`      ${error.message}`);
        }
      }
    }
    console.log(`   Applied ${appliedCount}/${statements.length} statements ✅`);
    console.log('');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tables = await prisma.$queryRaw<{name: string}[]>`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name NOT LIKE '_prisma%'
      ORDER BY name
    `;
    console.log(`   Found ${tables.length} tables`);
    console.log('');

    // Run seed
    console.log('🌱 Seeding database...');
    console.log('');
    execSync('npm run db:seed', {
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
    console.log(`   TURSO_AUTH_TOKEN=${authToken.substring(0, 20)}...`);
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

