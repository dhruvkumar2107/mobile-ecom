/**
 * Granular permission model backing Staff/Role Management.
 * A permission is "<module>.<action>"; `*` is a superuser wildcard.
 */

export const PERMISSION_MODULES = [
  'dashboard',
  'products',
  'orders',
  'customers',
  'warranty',
  'pricing',
  'marketing',
  'inventory',
  'reviews',
  'staff',
  'reports',
  'settings',
  'payments',
  'referrals',
  'payouts',
  'serviceability',
] as const;
export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_ACTIONS = ['read', 'write', 'approve'] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type Permission = `${PermissionModule}.${PermissionAction}` | '*';

export const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard',
  products: 'Product Management',
  orders: 'Order Management',
  customers: 'Customer Management',
  warranty: 'Warranty & Service',
  pricing: 'Pricing Engine',
  marketing: 'Marketing',
  inventory: 'Inventory',
  reviews: 'Reviews Moderation',
  staff: 'Staff & Roles',
  reports: 'Reports',
  settings: 'Settings',
  payments: 'Payments',
  referrals: 'Referral Management',
  payouts: 'Wallet & Payouts',
  serviceability: 'Address / Serviceability',
};

/** Only these modules gate a distinct "approve" step. */
export const APPROVAL_MODULES: PermissionModule[] = ['payouts', 'referrals', 'warranty', 'reviews'];

export function allPermissions(): Permission[] {
  const out: Permission[] = [];
  for (const m of PERMISSION_MODULES) {
    out.push(`${m}.read`, `${m}.write`);
    if (APPROVAL_MODULES.includes(m)) out.push(`${m}.approve`);
  }
  return out;
}

export const ROLE_PRESETS: Record<
  string,
  { name: string; description: string; permissions: Permission[] }
> = {
  superadmin: {
    name: 'Super Admin',
    description: 'Unrestricted access to every module including settings and payouts.',
    permissions: ['*'],
  },
  operations: {
    name: 'Operations Manager',
    description: 'Runs orders, inventory, warranty and serviceability day to day.',
    permissions: [
      'dashboard.read',
      'orders.read',
      'orders.write',
      'products.read',
      'inventory.read',
      'inventory.write',
      'warranty.read',
      'warranty.write',
      'warranty.approve',
      'serviceability.read',
      'serviceability.write',
      'customers.read',
      'reports.read',
    ],
  },
  finance: {
    name: 'Finance',
    description: 'Owns payments, payout approvals, referral commissions and GST reports.',
    permissions: [
      'dashboard.read',
      'payments.read',
      'payments.write',
      'payouts.read',
      'payouts.write',
      'payouts.approve',
      'referrals.read',
      'referrals.write',
      'referrals.approve',
      'reports.read',
      'orders.read',
      'customers.read',
    ],
  },
  support: {
    name: 'Customer Support',
    description: 'Reads orders and customers, handles tickets and review moderation.',
    permissions: [
      'dashboard.read',
      'orders.read',
      'customers.read',
      'customers.write',
      'warranty.read',
      'warranty.write',
      'reviews.read',
      'reviews.write',
      'reviews.approve',
      'payments.read',
      'payouts.read',
    ],
  },
  warehouse: {
    name: 'Warehouse',
    description: 'Stock, purchase orders and dispatch only. No pricing or customer PII.',
    permissions: [
      'inventory.read',
      'inventory.write',
      'orders.read',
      'orders.write',
      'products.read',
    ],
  },
  merchandiser: {
    name: 'Merchandiser',
    description: 'Catalog, pricing, campaigns and the homepage builder.',
    permissions: [
      'dashboard.read',
      'products.read',
      'products.write',
      'pricing.read',
      'pricing.write',
      'marketing.read',
      'marketing.write',
      'reviews.read',
      'reports.read',
    ],
  },
};

export function hasPermission(
  granted: string[] | null | undefined,
  required: Permission,
): boolean {
  if (!granted?.length) return false;
  if (granted.includes('*')) return true;
  if (granted.includes(required)) return true;
  // write implies read; approve implies write implies read
  const [mod, action] = required.split('.');
  if (action === 'read') {
    return granted.includes(`${mod}.write`) || granted.includes(`${mod}.approve`);
  }
  if (action === 'write') return granted.includes(`${mod}.approve`);
  return false;
}

export function canAccessModule(granted: string[] | null | undefined, mod: PermissionModule) {
  return hasPermission(granted, `${mod}.read`);
}
