import { heading, log, prisma } from './seed/kit';

import { seedFoundation } from './seed/foundation';
import { seedCatalog } from './seed/catalog';

const MODULES = [
  ['Foundation — settings, roles, warehouses, zones, pincodes', seedFoundation],
  ['Catalogue — brands, categories, specs, products, variants', seedCatalog],
] as const satisfies ReadonlyArray<readonly [string, () => Promise<void>]>;

async function wipe(): Promise<void> {
  const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_prisma%'`,
  );

  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  try {
    for (const { name } of tables) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
    }
  } finally {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  }

  log(`Cleared ${tables.length} tables`);
}

async function main(): Promise<void> {
  heading('VOLTAGE — seeding');

  await wipe();

  for (const [label, run] of MODULES) {
    await run();
    log(label);
  }

  heading('Done');
  console.log(`
  Storefront   http://localhost:3000
  Admin        http://localhost:3000/admin

  Sign in with any account below — password for every seeded user is
  the same, and OTP_DRIVER=console prints login codes to this terminal.

    Super admin      admin@voltage.store        / Voltage@2024
    Operations       ops@voltage.store          / Voltage@2024
    Finance          finance@voltage.store      / Voltage@2024
    Support          support@voltage.store      / Voltage@2024
    Customer         aarav.sharma@gmail.com     / Voltage@2024
`);
}

main()
  .catch((err) => {
    console.error('\n  Seed failed:\n', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());