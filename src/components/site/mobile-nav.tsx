'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Cable,
  ChevronRight,
  GitCompare,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Package,
  ShieldCheck,
  Smartphone,
  Tablet,
  Truck,
  Users,
  Wallet,
  Watch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/overlay';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Avatar } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  MOBILE NAV  (+ the shared storefront navigation model)
 * ════════════════════════════════════════════════════════════════════════
 *  The drawer behind the hamburger on small screens: the full category tree,
 *  the utility pages and the account block — everything the desktop header
 *  spreads across a bar and a dropdown, in one scrollable column.
 *
 *  The nav *model* (`SHOP_NAV`, `UTILITY_NAV`, `accountLinksFor`) lives here
 *  rather than in `header.tsx` on purpose: the header renders this drawer, so
 *  the import has to run header → mobile-nav. Putting the lists in the header
 *  would make the dependency circular. One list, one direction, both surfaces
 *  stay in step.
 */

/** The slice of `CurrentUser` the chrome is allowed to see (see §7 contract). */
export type SiteUser = {
  name: string | null;
  email: string | null;
  role: string;
  loyaltyTier: string;
};

type NavIcon = React.ComponentType<{ className?: string }>;
export type NavLink = { label: string; href: string; icon: NavIcon; hint?: string };

export const SHOP_NAV: readonly NavLink[] = [
  { label: 'Phones', href: '/category/phones', icon: Smartphone },
  { label: 'Tablets', href: '/category/tablets', icon: Tablet },
  { label: 'Audio', href: '/category/audio', icon: Headphones },
  { label: 'Wearables', href: '/category/wearables', icon: Watch },
  { label: 'Accessories', href: '/category/accessories', icon: Cable },
];

export const UTILITY_NAV: readonly NavLink[] = [
  { label: 'Compare', href: '/compare', icon: GitCompare, hint: 'Four devices, spec by spec' },
  { label: 'Track order', href: '/track', icon: Truck, hint: 'No sign-in needed' },
];

const SUPPORT_NAV: readonly NavLink[] = [
  { label: 'Service centres', href: '/service-centres', icon: LifeBuoy },
  { label: 'Warranty and repairs', href: '/p/warranty-policy', icon: ShieldCheck },
];

/**
 * Account destinations for a role. Admin is appended only for staff — the link
 * is hidden here *and* every admin route calls `requireStaff()`, because hiding
 * a link is presentation, not access control.
 */
export function accountLinksFor(role: string | null | undefined): NavLink[] {
  const links: NavLink[] = [
    { label: 'Orders', href: '/account/orders', icon: Package },
    { label: 'Wallet', href: '/account/wallet', icon: Wallet },
    { label: 'Referrals', href: '/account/referrals', icon: Users },
  ];
  if (role === 'admin' || role === 'staff') {
    links.push({ label: 'Admin', href: '/admin', icon: LayoutDashboard });
  }
  return links;
}

/**
 * Sign-out is a component rather than a helper because both the desktop account
 * dropdown and this drawer need the same pending state and the same "re-render
 * the server tree afterwards" behaviour.
 */
export function SignOutButton({
  className,
  onDone,
}: {
  className?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const res = await api('/api/auth/logout', { method: 'POST' });
        setPending(false);
        if (!res.ok) {
          toast.error('Could not sign you out', res.error);
          return;
        }
        onDone?.();
        // Leave the account area before refreshing: a signed-out refresh while
        // still on /account would redirect mid-transition.
        router.push('/');
        router.refresh();
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink disabled:opacity-50',
        className,
      )}
    >
      <LogOut className="size-4 shrink-0 text-ink-3" aria-hidden />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-5 pb-1.5 text-[11px] font-medium tracking-[0.14em] text-ink-4 uppercase">
      {children}
    </p>
  );
}

function DrawerLink({
  link,
  active,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
        active
          ? 'bg-volt-400/10 text-ink ring-1 ring-inset ring-volt-400/25'
          : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
      )}
    >
      <Icon className={cn('size-4 shrink-0', active ? 'text-volt-300' : 'text-ink-3')} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{link.label}</span>
        {link.hint && <span className="block text-xs text-ink-4">{link.hint}</span>}
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-4" aria-hidden />
    </Link>
  );
}

export function MobileNav({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: SiteUser | null;
}) {
  const pathname = usePathname();
  const seen = useRef(pathname);

  // Close on navigation. Comparing against the last path seen (rather than
  // firing on mount) keeps the drawer from slamming shut as it opens.
  useEffect(() => {
    if (seen.current !== pathname) {
      seen.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const accountLinks = accountLinksFor(user?.role);

  return (
    <Sheet open={open} onClose={onClose} title="Menu" side="left">
      <nav aria-label="Store navigation" className="-mx-2">
        <SectionLabel>Shop</SectionLabel>
        <div className="space-y-0.5">
          {SHOP_NAV.map((link) => (
            <DrawerLink key={link.href} link={link} active={isActive(link.href)} onNavigate={onClose} />
          ))}
          <DrawerLink
            link={{ label: 'All devices', href: '/products', icon: Package }}
            active={pathname === '/products'}
            onNavigate={onClose}
          />
        </div>

        <SectionLabel>Tools</SectionLabel>
        <div className="space-y-0.5">
          {UTILITY_NAV.map((link) => (
            <DrawerLink key={link.href} link={link} active={isActive(link.href)} onNavigate={onClose} />
          ))}
        </div>

        <SectionLabel>Account</SectionLabel>
        {user ? (
          <>
            <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-panel-2/60 px-3 py-3">
              <Avatar name={user.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{user.name ?? 'Your account'}</p>
                {user.email && <p className="truncate text-xs text-ink-3">{user.email}</p>}
              </div>
              <Badge tone="violet" size="xs" className="capitalize">
                {user.loyaltyTier}
              </Badge>
            </div>
            <div className="space-y-0.5">
              {accountLinks.map((link) => (
                <DrawerLink key={link.href} link={link} active={isActive(link.href)} onNavigate={onClose} />
              ))}
              <SignOutButton onDone={onClose} />
            </div>
          </>
        ) : (
          <div className="space-y-2 px-1 pt-1">
            <ButtonLink href="/login" fullWidth onClick={onClose}>
              Sign in
            </ButtonLink>
            <ButtonLink href="/signup" variant="outline" fullWidth onClick={onClose}>
              Create an account
            </ButtonLink>
            <p className="px-2 pt-1 text-xs leading-relaxed text-ink-4">
              Sign in to track orders, spend wallet credit and earn referral commission.
            </p>
          </div>
        )}

        <SectionLabel>Support</SectionLabel>
        <div className="space-y-0.5 pb-2">
          {SUPPORT_NAV.map((link) => (
            <DrawerLink key={link.href} link={link} active={isActive(link.href)} onNavigate={onClose} />
          ))}
        </div>
      </nav>
    </Sheet>
  );
}
