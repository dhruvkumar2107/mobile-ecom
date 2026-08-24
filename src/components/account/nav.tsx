'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BellRing,
  Banknote,
  CalendarClock,
  Crown,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Star,
  User,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { formatINR, formatNumber } from '@/lib/money';
import { LOYALTY_TIERS, LOYALTY_TIER_META, type LoyaltyTier } from '@/lib/enums';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: typeof Wallet };

/**
 * One flat, ordered list rendered two ways: a sticky rail on desktop and a
 * horizontal snap rail on mobile. The section labels only appear in the desktop
 * column — on a 375px rail they would eat the scroll budget the links need.
 */
const SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Shopping',
    items: [
      { href: '/account', label: 'Overview', icon: LayoutDashboard },
      { href: '/account/orders', label: 'Orders', icon: Package },
      { href: '/account/addresses', label: 'Addresses', icon: MapPin },
    ],
  },
  {
    label: 'Money',
    items: [
      { href: '/account/wallet', label: 'Wallet', icon: Wallet },
      { href: '/account/payout-methods', label: 'Payout methods', icon: Banknote },
      { href: '/account/referrals', label: 'Referrals', icon: Users },
      { href: '/account/loyalty', label: 'Loyalty', icon: Crown },
      { href: '/account/emi', label: 'EMI', icon: CalendarClock },
    ],
  },
  {
    label: 'Devices',
    items: [
      { href: '/account/warranty', label: 'Warranty', icon: ShieldCheck },
      { href: '/account/service', label: 'Service requests', icon: Wrench },
      { href: '/account/reviews', label: 'Reviews', icon: Star },
      { href: '/account/alerts', label: 'Stock alerts', icon: BellRing },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/account/support', label: 'Support', icon: LifeBuoy },
      { href: '/account/profile', label: 'Profile', icon: User },
      { href: '/account/security', label: 'Security', icon: Lock },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

/**
 * Longest-prefix match, so `/account/orders/VLT-2408-4F7K21` lights up Orders
 * rather than Overview — every path under /account is also a prefix match for
 * `/account` itself, and the most specific link has to win.
 */
function activeHref(pathname: string): string {
  let best = '';
  for (const item of ALL_ITEMS) {
    const hit = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (hit && item.href.length > best.length) best = item.href;
  }
  return best;
}

function tierOf(value: string): LoyaltyTier {
  return (LOYALTY_TIERS as readonly string[]).includes(value)
    ? (value as LoyaltyTier)
    : 'silver';
}

export function AccountNav({
  walletBalancePaise,
  loyaltyTier,
  loyaltyPoints,
}: {
  walletBalancePaise: number;
  loyaltyTier: string;
  loyaltyPoints: number;
}) {
  const pathname = usePathname() ?? '/account';
  const current = activeHref(pathname);
  const tier = tierOf(loyaltyTier);
  const meta = LOYALTY_TIER_META[tier];

  return (
    <nav aria-label="Account sections" className="space-y-4">
      {/* Wallet is a violet surface everywhere in VOLTAGE, loyalty included. */}
      <div className="panel bevel overflow-hidden">
        <Link
          href="/account/wallet"
          className="block px-4 py-3.5 transition-colors hover:bg-plasma-500/8"
        >
          <span className="flex items-center gap-2 text-[11px] font-medium tracking-wider text-ink-3 uppercase">
            <Wallet className="size-3.5 text-plasma-300" aria-hidden />
            Wallet balance
          </span>
          <span className="tabular mt-1 block text-xl font-semibold tracking-tight text-plasma-300">
            {formatINR(walletBalancePaise)}
          </span>
        </Link>
        <Link
          href="/account/loyalty"
          className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 transition-colors hover:bg-panel-2"
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-panel-2 px-2 py-0.5 text-[11px] font-medium text-ink-2 ring-1 ring-line-2 ring-inset"
            title={`${meta.label} tier · ${(meta.rewardRateBps / 100).toFixed(1)}% back in points`}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: meta.accent }}
              aria-hidden
            />
            {meta.label}
          </span>
          <span className="tabular text-xs text-ink-3">
            {formatNumber(loyaltyPoints)} pts
          </span>
        </Link>
      </div>

      <div
        className={cn(
          'snap-rail no-scrollbar fade-x -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1',
          'lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0 lg:[mask-image:none]',
        )}
      >
        {SECTIONS.map((section, i) => (
          <div key={section.label} className="contents">
            <p
              className={cn(
                'hidden px-3 pb-1 text-[10px] font-semibold tracking-widest text-ink-4 uppercase lg:block',
                i > 0 && 'lg:mt-5',
              )}
            >
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = current === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors lg:w-full',
                    active
                      ? 'bg-volt-400/10 text-volt-300 ring-1 ring-volt-400/25 ring-inset'
                      : 'text-ink-3 hover:bg-panel-2 hover:text-ink',
                  )}
                >
                  <Icon
                    className={cn('size-4 shrink-0', active ? 'text-volt-300' : 'text-ink-4')}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
