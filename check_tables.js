const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasourceUrl: 'file:./dev.db' });
p.$connect().then(() => {
  return p.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
}).then(tables => {
  console.log('Tables in database:', tables.map(t => typeof t === 'object' ? t.name : t));
}).finally(() => {
  p.$disconnect();
});