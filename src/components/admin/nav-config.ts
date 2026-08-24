import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  FileText,
  GalleryHorizontalEnd,
  IndianRupee,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Megaphone,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  Tags,
  TicketPercent,
  Undo2,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { hasPermission, type Permission } from '@/lib/rbac';

/**
 * The single source of truth for admin navigation. Sidebar, mobile drawer and
 * breadcrumbs all read this, so a new admin screen is one entry here — never a
 * second list to keep in sync.
 */

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Narrowest permission that makes the destination useful. */
  permission: Permission;
};

export type NavGroup = {
  /** Stable key — safe to use for React lists and for group-level UI state. */
  id: string;
  label: string;
  items: NavItem[];
};

/** The dashboard sits at the admin root, so it can only ever match exactly. */
export const ADMIN_HOME = '/admin';

export const ADMIN_NAV: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'dashboard.read' },
    ],
  },
  {
    id: 'catalogue',
    label: 'Catalogue',
    items: [
      { label: 'Products', href: '/admin/products', icon: Smartphone, permission: 'products.read' },
      { label: 'Brands & categories', href: '/admin/catalog', icon: Tags, permission: 'products.read' },
      { label: 'Reviews', href: '/admin/reviews', icon: Star, permission: 'reviews.read' },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag, permission: 'orders.read' },
      { label: 'Customers', href: '/admin/customers', icon: Users, permission: 'customers.read' },
      { label: 'Pricing', href: '/admin/pricing', icon: IndianRupee, permission: 'pricing.read' },
      { label: 'Coupons', href: '/admin/pricing/coupons', icon: TicketPercent, permission: 'pricing.read' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { label: 'Inventory', href: '/admin/inventory', icon: Boxes, permission: 'inventory.read' },
      {
        label: 'Purchase orders',
        href: '/admin/inventory/purchase-orders',
        icon: ClipboardList,
        permission: 'inventory.read',
      },
      { label: 'Serviceability', href: '/admin/serviceability', icon: MapPin, permission: 'serviceability.read' },
      { label: 'Warranty & service', href: '/admin/warranty', icon: Wrench, permission: 'warranty.read' },
      { label: 'Support', href: '/admin/support', icon: LifeBuoy, permission: 'customers.read' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { label: 'Payments', href: '/admin/payments', icon: CreditCard, permission: 'payments.read' },
      { label: 'Refunds', href: '/admin/payments/refunds', icon: Undo2, permission: 'payments.read' },
      { label: 'Wallets', href: '/admin/payouts/wallets', icon: Wallet, permission: 'payouts.read' },
      { label: 'Withdrawals', href: '/admin/payouts', icon: Banknote, permission: 'payouts.read' },
      {
        label: 'Bank verifications',
        href: '/admin/payouts/verifications',
        icon: BadgeCheck,
        permission: 'payouts.read',
      },
      { label: 'Referrals', href: '/admin/referrals', icon: Share2, permission: 'referrals.read' },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    items: [
      { label: 'Marketing', href: '/admin/marketing', icon: Megaphone, permission: 'marketing.read' },
      {
        label: 'Banners',
        href: '/admin/marketing/banners',
        icon: GalleryHorizontalEnd,
        permission: 'marketing.read',
      },
      { label: 'CMS pages', href: '/admin/marketing/pages', icon: FileText, permission: 'marketing.read' },
    ],
  },
  {
    id: 'insight',
    label: 'Insight',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: BarChart3, permission: 'reports.read' },
      { label: 'GST', href: '/admin/reports/gst', icon: FileSpreadsheet, permission: 'reports.read' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { label: 'Staff & roles', href: '/admin/staff', icon: ShieldCheck, permission: 'staff.read' },
      { label: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings.read' },
    ],
  },
];

/**
 * Filters the nav down to what a role can actually open, dropping groups that
 * end up empty. A warehouse user gets a genuinely short sidebar rather than a
 * long list of links that all 403.
 */
export function visibleNav(permissions: string[] | null | undefined): NavGroup[] {
  const out: NavGroup[] = [];
  for (const group of ADMIN_NAV) {
    const items = group.items.filter((item) => hasPermission(permissions, item.permission));
    if (items.length) out.push({ ...group, items });
  }
  return out;
}

/** Every item, flattened — longest href first so prefix matching is greedy. */
export function flatNav(groups: NavGroup[] = ADMIN_NAV): NavItem[] {
  return groups.flatMap((g) => g.items).sort((a, b) => b.href.length - a.href.length);
}

/**
 * Longest-prefix match, so `/admin/payments/refunds` highlights Refunds only
 * and never also lights up Payments. `/admin` is exact-only or it would claim
 * every route beneath it.
 */
export function activeNavItem(
  pathname: string | null | undefined,
  groups: NavGroup[] = ADMIN_NAV,
): NavItem | null {
  if (!pathname) return null;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  for (const item of flatNav(groups)) {
    if (item.href === path) return item;
    if (item.href !== ADMIN_HOME && path.startsWith(`${item.href}/`)) return item;
  }
  return null;
}
