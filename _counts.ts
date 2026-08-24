import { PrismaClient } from '@prisma/client';
async function main() {
  const p = new PrismaClient();
  const rows = await p.$queryRawUnsafe<{name:string}[]>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name`);
  let total = 0; const nonEmpty: string[] = [];
  for (const {name} of rows) {
    const r = await p.$queryRawUnsafe<{c:number|bigint}[]>(`SELECT COUNT(*) as c FROM "${name}"`);
    const c = Number(r[0].c); total += c;
    if (c > 0) nonEmpty.push(`${name}=${c}`);
  }
  console.log(`tables=${rows.length} nonEmpty=${nonEmpty.length} totalRows=${total}`);
  console.log(nonEmpty.join('  '));
  await p.$disconnect();
}
main();
