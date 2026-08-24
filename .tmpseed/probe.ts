import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const tables = await db.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name`);
  console.log('tables:', tables.length);
  let total = 0;
  for (const t of tables) {
    const rows = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT COUNT(*) as c FROM "${t.name}"`);
    const c = Number(Object.values(rows[0]!)[0]);
    total += c;
    if (c > 0) console.log(String(c).padStart(6), t.name);
  }
  console.log('total rows:', total);
}
main().catch(e => console.error('ERR', e)).finally(() => db.$disconnect());
