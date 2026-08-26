'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';

const tabs = [
  { id: 'home', label: 'Home', icon: Home, href: '/mobile' },
  { id: 'search', label: 'Search', icon: Search, href: '/mobile/search' },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, href: '/mobile/wishlist' },
  { id: 'cart', label: 'Cart', icon: ShoppingBag, href: '/mobile/cart' },
  { id: 'profile', label: 'Profile', icon: User, href: '/mobile/profile' },
] as const;

export type MobileTabId = (typeof tabs)[number]['id'];

/** Longest-prefix match, so /mobile/product/123 keeps "Home" lit rather than nothing. */
function tabFromPathname(pathname: string | null): MobileTabId {
  if (!pathname) return 'home';
  const match = [...tabs]
    .filter((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.id ?? 'home';
}

export interface BottomTabNavigationProps {
  /** Override the pathname-derived active tab. Rarely needed. */
  currentTab?: string;
  cartCount?: number;
}

export function BottomTabNavigation({ currentTab, cartCount = 0 }: BottomTabNavigationProps) {
  const pathname = usePathname();
  const activeTab = useMemo(
    () => currentTab ?? tabFromPathname(pathname),
    [currentTab, pathname]
  );

  return (
    <nav
      aria-label="Main navigation"
      className="mobile-tabbar"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: mobileDesign.zIndex.sticky + 50,
        background: 'color-mix(in srgb, var(--mobile-color-surface) 82%, transparent)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <ul
        style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-around',
          listStyle: 'none',
          margin: 0,
          padding: `${mobileDesign.spacing.sm}px`,
          minHeight: `${mobileDesign.touchTarget + 14}px`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const itemWord = cartCount === 1 ? 'item' : 'items';

          return (
            <li key={tab.id} style={{ flex: 1, display: 'flex' }}>
              <Link
                href={tab.href}
                prefetch
                aria-current={isActive ? 'page' : undefined}
                aria-label={
                  tab.id === 'cart' && cartCount > 0
                    ? `${tab.label}, ${cartCount} ${itemWord}`
                    : tab.label
                }
                style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  padding: `${mobileDesign.spacing.xs}px 0 ${mobileDesign.spacing.sm}px`,
                  minWidth: `${mobileDesign.touchTarget}px`,
                  minHeight: `${mobileDesign.touchTarget}px`,
                  color: isActive
                    ? mobileDesign.colors.accent
                    : mobileDesign.colors.textTertiary,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transition: `color ${mobileDesign.transitions.fast}`,
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-tab-pill"
                    transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.7 }}
                    style={{
                      position: 'absolute',
                      inset: '2px 8px',
                      borderRadius: `${mobileDesign.borderRadius.md}px`,
                      background: mobileDesign.colors.accentLight,
                      zIndex: 0,
                    }}
                    aria-hidden="true"
                  />
                )}

                <motion.span
                  animate={{ scale: isActive ? 1.06 : 1, y: isActive ? -1 : 0 }}
                  whileTap={{ scale: 0.86 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                  style={{ position: 'relative', zIndex: 1, display: 'flex' }}
                >
                  <Icon
                    style={{
                      width: 23,
                      height: 23,
                      strokeWidth: isActive ? 2.4 : 1.9,
                      fill: isActive ? 'currentColor' : 'none',
                      fillOpacity: isActive ? 0.14 : 0,
                      transition: 'stroke-width 200ms ease-out, fill-opacity 200ms ease-out',
                    }}
                    aria-hidden="true"
                  />

                  {tab.id === 'cart' && cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -9,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        background: mobileDesign.colors.error,
                        color: mobileDesign.colors.textInverse,
                        fontSize: 10.5,
                        fontWeight: 700,
                        lineHeight: '18px',
                        textAlign: 'center',
                        padding: '0 4px',
                        border: `2px solid ${mobileDesign.colors.surface}`,
                        boxSizing: 'content-box',
                      }}
                      aria-hidden="true"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  )}
                </motion.span>

                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    lineHeight: 1,
                    letterSpacing: 0.2,
                    fontFamily: mobileDesign.typography.fontFamily,
                    transition: `font-weight ${mobileDesign.transitions.fast}`,
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Convenience alias kept for existing call sites. */
export function TabBar(props: BottomTabNavigationProps) {
  return <BottomTabNavigation {...props} />;
}
