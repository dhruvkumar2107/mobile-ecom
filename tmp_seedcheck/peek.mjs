import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const u = await p.user.count();
const o = await p.order.count();
const w = await p.walletTransaction.count();
const r = await p.referral.count();
console.log({users:u, orders:o, walletTxns:w, referrals:r});
if (u) {
  const cust = await p.user.findMany({where:{role:'customer'}, select:{email:true, referralCode:true, referredById:true, signupIp:true, signupDevice:true, loyaltyTier:true}, take:8});
  console.log(cust);
}
if (o) {
  const g = await p.order.groupBy({by:['status','paymentStatus'], _count:true});
  console.log(g);
}
await p.$disconnect();
