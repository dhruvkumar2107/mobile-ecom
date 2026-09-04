import { heading, log, prisma } from './seed/kit';
import bcrypt from 'bcryptjs';
import { referralCode } from '@/lib/ids';

import { seedFoundation } from './seed/foundation';
import { seedCatalog } from './seed/catalog';
import { seedBanners } from './seed/banners';

const MODULES = [
  ['Foundation — settings, roles, warehouses, zones, pincodes', seedFoundation],
  ['Catalogue — brands, categories, specs, products, variants', seedCatalog],
  ['Banners — hero banners for homepage carousel', seedBanners],
  ['Admin Users — superadmin with all permissions', seedAdminUsers],
] as const satisfies ReadonlyArray<readonly [string, () => Promise<void>]>;

async function wipe(): Promise<void> {
  // Delete in dependency order to avoid FK constraints
  const orderedTables = [
    // Child tables first
    'Session', 'OtpCode', 'PasswordResetToken', 'OAuthAccount',
    'CartItem', 'Cart', 'WishlistItem', 'Wishlist',
    'OrderItem', 'OrderUnit', 'OrderStatusEvent', 'Shipment', 'Invoice', 'WarrantyCard', 'EmiInstalment', 'PaymentAttempt', 'Refund', 'Order',
    'Review', 'ProductSpecValue', 'AccessoryLink', 'ProductVariant', 'FlashSaleItem', 'FlashSale',
    'CouponRedemption', 'Coupon', 'EmiPlan', 'ExchangeDevice', 'ProtectionPlan', 'PricingRule',
    'ReferralCommission', 'Referral', 'ReferralRule',
    'WalletTransaction', 'WithdrawalRequest', 'Payout', 'Wallet',
    'LoyaltyTransaction', 'Address', 'SavedCard', 'SavedUpi', 'BankAccount', 'BankVerificationLog',
    'InventoryStock', 'ServiceCenterBrand', 'ServiceCenter',
    'PincodeServiceability', 'ShippingZone', 'Warehouse', 'Supplier', 'TaxRule',
    'SpecDefinition', 'Category', 'Brand',
    'Product',  // Add Product table
    'Banner',
    'User', 'StaffRole', 'Setting',
    'WebhookEvent',
  ];

  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
  try {
    for (const name of orderedTables) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
      } catch {
        // Table might not exist, continue
      }
    }
  } finally {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  }

  log(`Cleared tables`);
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

async function seedAdminUsers(): Promise<void> {
  const passwordHash = await bcrypt.hash('Voltage@2024', 11);
  const referralCodeVal = referralCode('Super Admin');

  const superadminRole = await prisma.staffRole.findUnique({ where: { slug: 'superadmin' } });

  const user = await prisma.user.upsert({
    where: { email: 'admin@voltage.store' },
    update: {
      passwordHash,
      role: 'admin',
      staffRole: superadminRole ? { connect: { id: superadminRole.id } } : undefined,
      emailVerifiedAt: new Date(),
      status: 'active',
    },
    create: {
      name: 'Super Admin',
      email: 'admin@voltage.store',
      passwordHash,
      referralCode: referralCodeVal,
      role: 'admin',
      staffRole: superadminRole ? { connect: { id: superadminRole.id } } : undefined,
      emailVerifiedAt: new Date(),
      status: 'active',
    },
  });

  // Create wallet for superadmin
  await prisma.wallet.upsert({
    where: { userId: user.id },
    create: { userId: user.id, balancePaise: 0, pendingPaise: 0 },
    update: {},
  });

  log('Admin user created: admin@voltage.store / Voltage@2024 (Super Admin — all permissions)');
}