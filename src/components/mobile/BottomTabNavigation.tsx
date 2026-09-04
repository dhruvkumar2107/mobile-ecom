'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';

const tabs = [
  { id: 'home', label: 'Home', icon: Home, href: '/mobile' },
  { id: 'search', label: 'Search', icon: Search, href: '/mobile/search' },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, href: '/mobile/wishlist' },
  { id: 'cart', label: 'Cart', icon: ShoppingCart, href: '/mobile/cart' },
  { id: 'profile', label: 'Profile', icon: User, href: '/mobile/profile' },
] as const;

interface BottomTabNavigationProps {
  currentTab: string;
  cartCount?: number;
}

export function BottomTabNavigation({ currentTab, cartCount = 0 }: BottomTabNavigationProps) {
  const pathname = usePathname();

  const isActive = (tabId: string) => {
    if (tabId === 'home') return pathname === '/mobile' || pathname === '/mobile/';
    if (tabId === 'cart') return pathname.startsWith('/mobile/cart') || pathname.startsWith('/mobile/checkout');
    return pathname.startsWith(`/${tabId}`);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: mobileDesign.zIndex.sticky,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '56px',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.id);
          const Icon = tab.icon;
          return (
            <motion.a
              key={tab.id}
              href={tab.href}
              whileTap={{ scale: 0.9 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                width: '64px',
                height: '100%',
                textDecoration: 'none',
                color: active ? mobileDesign.colors.accent : mobileDesign.colors.textTertiary,
                position: 'relative',
              }}
              aria-current={active ? 'page' : undefined}
              aria-label={`${tab.label}${tab.id === 'cart' && cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              {active && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '32px',
                    height: '3px',
                    borderRadius: '0 0 3px 3px',
                    background: mobileDesign.colors.accent,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <div style={{ position: 'relative' }}>
                <Icon
                  style={{
                    width: 22,
                    height: 22,
                    strokeWidth: active ? 2.5 : 2,
                  }}
                />
                {tab.id === 'cart' && cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-10px',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      background: mobileDesign.colors.flipkartRed,
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 700,
                      lineHeight: '18px',
                      textAlign: 'center',
                      padding: '0 4px',
                      boxShadow: '0 2px 4px rgba(255, 97, 97, 0.3)',
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.span>
                )}
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: active ? 700 : 500,
                fontFamily: mobileDesign.typography.fontFamily,
                letterSpacing: 0.2,
              }}>
                {tab.label}
              </span>
            </motion.a>
          );
        })}
      </div>
    </nav>
  );
}

export const TabBar = BottomTabNavigation;
