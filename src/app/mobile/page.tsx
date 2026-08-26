'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Bell, Menu, Filter } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { CategoryChips, defaultCategories } from '@/components/mobile/CategoryChips';
import { BannerCarousel, defaultBanners } from '@/components/mobile/BannerCarousel';
import { ProductCard } from '@/components/mobile/ProductCard';
import { ProductCardSkeleton } from '@/components/mobile/Skeleton';
import { HapticButton } from '@/components/mobile/HapticButton';

const trendingProducts = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    price: 159900,
    originalPrice: 169900,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
    rating: 4.8,
    reviewCount: 2341,
    badge: 'New',
    discountPercent: 6,
  },
  {
    id: '2',
    name: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    price: 139999,
    originalPrice: 149999,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80',
    rating: 4.7,
    reviewCount: 1876,
    discountPercent: 7,
  },
  {
    id: '3',
    name: 'MacBook Air M3',
    brand: 'Apple',
    price: 114900,
    originalPrice: 124900,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    rating: 4.9,
    reviewCount: 3421,
    discountPercent: 8,
  },
  {
    id: '4',
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    price: 29990,
    originalPrice: 34990,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80',
    rating: 4.8,
    reviewCount: 5632,
    badge: 'Bestseller',
    discountPercent: 14,
  },
  {
    id: '5',
    name: 'iPad Pro 12.9" M2',
    brand: 'Apple',
    price: 99900,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80',
    rating: 4.7,
    reviewCount: 1245,
  },
  {
    id: '6',
    name: 'Pixel 8 Pro',
    brand: 'Google',
    price: 106999,
    originalPrice: 112999,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80',
    rating: 4.6,
    reviewCount: 987,
    discountPercent: 5,
  },
  {
    id: '7',
    name: 'AirPods Pro 2',
    brand: 'Apple',
    price: 24900,
    originalPrice: 26900,
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80',
    rating: 4.8,
    reviewCount: 8765,
    badge: 'Hot',
    discountPercent: 7,
  },
  {
    id: '8',
    name: 'Dell XPS 15',
    brand: 'Dell',
    price: 189990,
    originalPrice: 209990,
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80',
    rating: 4.5,
    reviewCount: 567,
    discountPercent: 10,
  },
];

export default function MobileHomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [cartCount, setCartCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const handleWishlistToggle = useCallback((id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const filteredProducts = trendingProducts.filter((p) =>
    selectedCategory === 'all' || p.brand.toLowerCase().includes(selectedCategory.toLowerCase())
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: mobileDesign.colors.background,
        fontFamily: mobileDesign.typography.fontFamily,
        paddingBottom: `${mobileDesign.touchTarget + mobileDesign.spacing['3xl']}px`,
      }}
    >
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: mobileDesign.zIndex.sticky,
          background: 'rgba(250, 250, 250, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              style={{
                width: `${mobileDesign.touchTarget}px`,
                height: `${mobileDesign.touchTarget}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: `${mobileDesign.borderRadius.md}px`,
                background: mobileDesign.colors.borderLight,
                color: mobileDesign.colors.textPrimary,
                cursor: 'pointer',
              }}
              aria-label="Open menu"
            >
              <Menu style={{ width: 24, height: 24 }} aria-hidden="true" />
            </motion.button>
            <div>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.textTertiary,
                  margin: 0,
                }}
              >
                Delivering to
              </p>
              <motion.div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <MapPin
                  style={{ width: 14, height: 14, color: mobileDesign.colors.accent }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: mobileDesign.typography.fontFamily,
                    color: mobileDesign.colors.textPrimary,
                  }}
                >
                  Mumbai, 400001
                </span>
              </motion.div>
            </div>
          </div>

          <motion.button
            onClick={() => setShowSearch(true)}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              maxWidth: '320px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.md}px`,
              border: 'none',
              borderRadius: `${mobileDesign.borderRadius.full}px`,
              background: mobileDesign.colors.borderLight,
              color: mobileDesign.colors.textTertiary,
              fontSize: '14px',
              fontFamily: mobileDesign.typography.fontFamily,
              cursor: 'pointer',
              transition: `all ${mobileDesign.transitions.fast}`,
            }}
            aria-label="Search products"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowSearch(true)}
          >
            <Search style={{ width: 20, height: 20, flexShrink: 0 }} aria-hidden="true" />
            <span>Search for products...</span>
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              style={{
                width: `${mobileDesign.touchTarget}px`,
                height: `${mobileDesign.touchTarget}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: `${mobileDesign.borderRadius.md}px`,
                background: mobileDesign.colors.borderLight,
                color: mobileDesign.colors.textPrimary,
                cursor: 'pointer',
                position: 'relative',
              }}
              aria-label="Notifications"
            >
              <Bell style={{ width: 22, height: 22 }} aria-hidden="true" />
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: mobileDesign.colors.error,
                }}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              style={{
                width: `${mobileDesign.touchTarget}px`,
                height: `${mobileDesign.touchTarget}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: `${mobileDesign.borderRadius.md}px`,
                background: mobileDesign.colors.borderLight,
                color: mobileDesign.colors.textPrimary,
                cursor: 'pointer',
                position: 'relative',
              }}
              aria-label="Shopping cart"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 22, height: 22 }}
                aria-hidden="true"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '9px',
                    background: mobileDesign.colors.error,
                    color: mobileDesign.colors.textInverse,
                    fontSize: '11px',
                    fontWeight: 700,
                    lineHeight: '18px',
                    textAlign: 'center',
                    padding: '0 4px',
                    boxShadow: mobileDesign.shadows.md,
                  }}
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: mobileDesign.zIndex.modal,
              background: mobileDesign.colors.overlay,
            }}
            onClick={() => setShowSearch(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                background: mobileDesign.colors.surface,
                borderBottomLeftRadius: `${mobileDesign.borderRadius.xl}px`,
                borderBottomRightRadius: `${mobileDesign.borderRadius.xl}px`,
                boxShadow: mobileDesign.shadows.xl,
                padding: `${mobileDesign.spacing.lg}px`,
                paddingTop: `${mobileDesign.spacing['2xl']}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
                    border: 'none',
                    borderRadius: `${mobileDesign.borderRadius.full}px`,
                    background: mobileDesign.colors.borderLight,
                    color: mobileDesign.colors.textTertiary,
                    fontSize: '16px',
                    fontFamily: mobileDesign.typography.fontFamily,
                  }}
                >
                  <Search style={{ width: 22, height: 22 }} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search products, brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      fontSize: '16px',
                      fontFamily: mobileDesign.typography.fontFamily,
                      color: mobileDesign.colors.textPrimary,
                      outline: 'none',
                      width: '100%',
                    }}
                    autoFocus
                    aria-label="Search query"
                  />
                  <Filter style={{ width: 22, height: 22, color: mobileDesign.colors.textTertiary }} aria-hidden="true" />
                </motion.div>
                <HapticButton
                  variant="ghost"
                  onClick={() => setShowSearch(false)}
                  style={{ minWidth: 'auto', padding: '0 16px' }}
                >
                  Cancel
                </HapticButton>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: mobileDesign.typography.fontFamily,
                    color: mobileDesign.colors.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: '12px',
                    paddingLeft: '4px',
                  }}
                >
                  Recent Searches
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['iPhone 15', 'MacBook Air', 'Sony Headphones', 'Samsung Galaxy'].map((term, i) => (
                    <motion.button
                      key={i}
                      onClick={() => { setSearchQuery(term); setShowSearch(false); }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.md}px`,
                        border: `1px solid ${mobileDesign.colors.border}`,
                        borderRadius: `${mobileDesign.borderRadius.full}px`,
                        background: mobileDesign.colors.surface,
                        color: mobileDesign.colors.textSecondary,
                        fontSize: '14px',
                        fontFamily: mobileDesign.typography.fontFamily,
                        cursor: 'pointer',
                        transition: `all ${mobileDesign.transitions.fast}`,
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }} aria-hidden="true"><path d="M18 18L22 22M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      {term}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ paddingTop: `${mobileDesign.spacing.md}px` }}>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          aria-label="Featured banners"
        >
          <BannerCarousel banners={defaultBanners} aspectRatio="16/9" />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ paddingTop: `${mobileDesign.spacing.lg}px` }}
          aria-label="Categories"
        >
          <CategoryChips
            categories={defaultCategories}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            padding: `${mobileDesign.spacing.lg}px ${mobileDesign.spacing.lg}px ${mobileDesign.spacing.md}px`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textPrimary,
                margin: 0,
              }}
            >
              Trending Now
            </h2>
            <HapticButton variant="ghost" size="sm" onClick={() => {}}>
              View All
            </HapticButton>
          </div>

          <motion.div
            style={{
              display: 'flex',
              gap: `${mobileDesign.spacing.md}px`,
              padding: `0 ${mobileDesign.spacing.lg}px`,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
            role="list"
            aria-label="Trending products"
          >
            <div style={{ flexShrink: 0, width: `${mobileDesign.spacing.lg}px` }} />
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                >
                  <ProductCardSkeleton />
                </motion.div>
              ))
            ) : (
              filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                >
                  <ProductCard
                    {...product}
                    onPress={() => {}}
                    onWishlistToggle={handleWishlistToggle}
                    isInWishlist={wishlist.has(product.id)}
                  />
                </motion.div>
              ))
            )}
            <div style={{ flexShrink: 0, width: `${mobileDesign.spacing.lg}px` }} />
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{ paddingTop: `${mobileDesign.spacing.lg}px` }}
        >
          <div style={{ padding: `0 ${mobileDesign.spacing.lg}px ${mobileDesign.spacing.md}px` }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textPrimary,
                margin: 0,
              }}
            >
              Just For You
            </h2>
          </div>
          <div
            style={{
              display: 'flex',
              gap: `${mobileDesign.spacing.md}px`,
              padding: `0 ${mobileDesign.spacing.lg}px`,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            role="list"
          >
            <div style={{ flexShrink: 0, width: `${mobileDesign.spacing.lg}px` }} />
            {trendingProducts.slice(0, 4).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
              >
                <ProductCard
                  {...product}
                  onPress={() => {}}
                  onWishlistToggle={handleWishlistToggle}
                  isInWishlist={wishlist.has(product.id)}
                />
              </motion.div>
            ))}
            <div style={{ flexShrink: 0, width: `${mobileDesign.spacing.lg}px` }} />
          </div>
        </motion.section>
      </main>

      <BottomTabNavigation currentTab="home" cartCount={cartCount} />
    </div>
  );
}