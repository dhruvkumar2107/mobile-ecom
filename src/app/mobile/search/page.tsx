'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, X, Filter, Clock, TrendingUp, Tag, Mic, ChevronDown, ChevronUp, Grid, List } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { HapticButton, ChipButton } from '@/components/mobile/HapticButton';
import { Input } from '@/components/mobile/Input';
import { ProductCard } from '@/components/mobile/ProductCard';
import { ProductCardSkeleton } from '@/components/mobile/Skeleton';
import { CategoryChips, defaultCategories } from '@/components/mobile/CategoryChips';
import dynamic from 'next/dynamic';
import { VoiceSearch } from '@/components/ui/voice-search';

/**
 * The filter sheet is behind a tap, so keep Modal.tsx (and its focus-trap /
 * portal machinery) out of the initial search bundle.
 */
const Sheet = dynamic(() => import('@/components/mobile/Modal').then((m) => m.Sheet), {
  ssr: false,
});
import { Badge } from '@/components/mobile/Badge';
import { formatINR } from '@/lib/money';

const allProducts = [
  { id: '1', name: 'iPhone 15 Pro Max', brand: 'Apple', price: 159900, originalPrice: 169900, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80', rating: 4.8, reviewCount: 2341, badge: 'New', discountPercent: 6, category: 'smartphones' },
  { id: '2', name: 'Galaxy S24 Ultra', brand: 'Samsung', price: 139999, originalPrice: 149999, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80', rating: 4.7, reviewCount: 1876, discountPercent: 7, category: 'smartphones' },
  { id: '3', name: 'MacBook Air M3', brand: 'Apple', price: 114900, originalPrice: 124900, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80', rating: 4.9, reviewCount: 3421, discountPercent: 8, category: 'laptops' },
  { id: '4', name: 'Sony WH-1000XM5', brand: 'Sony', price: 29990, originalPrice: 34990, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80', rating: 4.8, reviewCount: 5632, badge: 'Bestseller', discountPercent: 14, category: 'audio' },
  { id: '5', name: 'iPad Pro 12.9" M2', brand: 'Apple', price: 99900, originalPrice: 109900, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80', rating: 4.7, reviewCount: 1245, discountPercent: 9, category: 'tablets' },
  { id: '6', name: 'Pixel 8 Pro', brand: 'Google', price: 106999, originalPrice: 112999, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80', rating: 4.6, reviewCount: 987, discountPercent: 5, category: 'smartphones' },
  { id: '7', name: 'AirPods Pro 2', brand: 'Apple', price: 24900, originalPrice: 26900, image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80', rating: 4.8, reviewCount: 8765, badge: 'Hot', discountPercent: 7, category: 'audio' },
  { id: '8', name: 'Dell XPS 15', brand: 'Dell', price: 189990, originalPrice: 209990, image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80', rating: 4.5, reviewCount: 567, discountPercent: 10, category: 'laptops' },
  { id: '9', name: 'Apple Watch Series 9', brand: 'Apple', price: 45900, originalPrice: 49900, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', rating: 4.8, reviewCount: 3421, discountPercent: 8, category: 'wearables' },
  { id: '10', name: 'Samsung Galaxy Watch 6', brand: 'Samsung', price: 32999, originalPrice: 36999, image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&q=80', rating: 4.6, reviewCount: 1876, discountPercent: 11, category: 'wearables' },
  { id: '11', name: 'Bose QC Ultra', brand: 'Bose', price: 34900, originalPrice: 39900, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80', rating: 4.7, reviewCount: 2341, discountPercent: 13, category: 'audio' },
  { id: '12', name: 'ASUS ROG Phone 8', brand: 'ASUS', price: 94999, originalPrice: 104999, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80', rating: 4.5, reviewCount: 567, discountPercent: 10, category: 'smartphones' },
];

const recentSearches = ['iPhone 15', 'MacBook Air', 'Sony Headphones', 'Samsung Galaxy', 'iPad Pro'];
const trendingSearches = ['iPhone 15 Pro', 'MacBook Air M3', 'Sony WH-1000XM5', 'Galaxy S24', 'AirPods Pro 2'];

const brands = ['Apple', 'Samsung', 'Sony', 'Google', 'Dell', 'ASUS', 'Bose', 'OnePlus', 'Xiaomi', 'Nothing'];
const categories = ['Smartphones', 'Laptops', 'Audio', 'Wearables', 'Tablets', 'Accessories'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('relevance');
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = allProducts.filter(product => {
    const matchesQuery = !query || product.name.toLowerCase().includes(query.toLowerCase()) || product.brand.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesQuery && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'newest': return b.id.localeCompare(a.id);
      default: return 0;
    }
  });

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      setShowSearchSheet(false);
    }
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const handleRecentClick = useCallback((term: string) => {
    setQuery(term);
    handleSearch();
  }, [handleSearch]);

  useEffect(() => {
    if (showSearchSheet) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showSearchSheet]);

  return (
    <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily, paddingBottom: `${mobileDesign.touchTarget + mobileDesign.spacing['3xl']}px` }}>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'sticky', top: 0, zIndex: mobileDesign.zIndex.sticky,
          background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <motion.button onClick={() => window.history.back()} whileTap={{ scale: 0.9 }} style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '12px', background: mobileDesign.colors.borderLight, color: mobileDesign.colors.textPrimary, cursor: 'pointer' }} aria-label="Go back">
            <ChevronLeft style={{ width: 24, height: 24 }} aria-hidden="true" />
          </motion.button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  ref={inputRef}
                  placeholder="Search products, brands..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  leftIcon={<Search style={{ width: 20, height: 20 }} aria-hidden="true" />}
                  rightIcon={query ? (
                    <motion.button onClick={() => setQuery('')} whileTap={{ scale: 0.9 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', border: 'none', background: 'transparent', color: mobileDesign.colors.textTertiary, borderRadius: '6px', cursor: 'pointer' }} aria-label="Clear search"><X style={{ width: 16, height: 16 }} /></motion.button>
                  ) : null}
                  fullWidth
                  size="md"
                  variant="filled"
                />
                {!query && (
                  <VoiceSearch onResult={(text) => setQuery(text)} />
                )}
              </div>
              <motion.button onClick={() => setShowSearchSheet(true)} whileTap={{ scale: 0.95 }} style={{ padding: '0 16px', height: '44px', border: 'none', borderRadius: '12px', background: mobileDesign.colors.accent, color: mobileDesign.colors.textInverse, fontSize: '14px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Search
              </motion.button>
            </div>
          </div>
          <motion.button onClick={() => setShowFilters(true)} whileTap={{ scale: 0.9 }} style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '12px', background: mobileDesign.colors.borderLight, color: mobileDesign.colors.textPrimary, cursor: 'pointer' }} aria-label="Filters">
            <Filter style={{ width: 22, height: 22 }} aria-hidden="true" />
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence>
        {showSearchSheet && (
          <Sheet
            isOpen={showSearchSheet}
            onClose={() => setShowSearchSheet(false)}
            size="full"
            showDragIndicator
            title="Search"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    ref={inputRef}
                    placeholder="Search products, brands..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    leftIcon={<Search style={{ width: 20, height: 20 }} aria-hidden="true" />}
                    rightIcon={
                      query ? (
                        <motion.button onClick={() => setQuery('')} whileTap={{ scale: 0.9 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', border: 'none', background: 'transparent', color: mobileDesign.colors.textTertiary, borderRadius: '6px', cursor: 'pointer' }} aria-label="Clear search"><X style={{ width: 16, height: 16 }} /></motion.button>
                      ) : null
                    }
                    fullWidth
                    size="lg"
                  />
                  {!query && (
                    <VoiceSearch onResult={(text) => setQuery(text)} />
                  )}
                </div>
                <HapticButton variant="primary" size="lg" onClick={handleSearch} disabled={!query.trim()} loading={isLoading}>Search</HapticButton>
              </div>

              {recentSearches.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Searches</h3>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {recentSearches.map((term, index) => (
                      <motion.button key={index} onClick={() => handleRecentClick(term)} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '9999px', background: mobileDesign.colors.surface, color: mobileDesign.colors.textSecondary, fontSize: '14px', fontFamily: mobileDesign.typography.fontFamily, cursor: 'pointer', transition: `all ${mobileDesign.transitions.fast}` }}>
                        <Clock style={{ width: 16, height: 16, color: mobileDesign.colors.textTertiary }} aria-hidden="true" />
                        {term}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {trendingSearches.length > 0 && (
                <div>
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '12px' }}>Trending Now</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {trendingSearches.map((term, index) => (
                      <motion.button key={index} onClick={() => handleRecentClick(term)} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '9999px', background: mobileDesign.colors.accentLight, color: mobileDesign.colors.accentDark, fontSize: '14px', fontFamily: mobileDesign.typography.fontFamily, cursor: 'pointer', transition: `all ${mobileDesign.transitions.fast}` }}>
                        <TrendingUp style={{ width: 16, height: 16 }} aria-hidden="true" />
                        {term}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '12px' }}>Categories</h3>
                <CategoryChips
                  categories={defaultCategories}
                  selectedId={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>
            </div>
          </Sheet>
        )}
      </AnimatePresence>

      <main style={{ paddingTop: `${mobileDesign.spacing.md}px` }}>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ padding: `0 ${mobileDesign.spacing.lg}px ${mobileDesign.spacing.md}px` }}
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
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: mobileDesign.colors.textSecondary }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                style={{
                  padding: '8px 12px', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '8px',
                  background: mobileDesign.colors.surface, color: mobileDesign.colors.textPrimary,
                  fontSize: '13px', fontFamily: mobileDesign.typography.fontFamily, cursor: 'pointer',
                  appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '32px',
                }}
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button onClick={() => setViewMode('grid')} whileTap={{ scale: 0.95 }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${viewMode === 'grid' ? mobileDesign.colors.accent : mobileDesign.colors.border}`, borderRadius: '8px', background: viewMode === 'grid' ? mobileDesign.colors.accentLight : mobileDesign.colors.surface, color: viewMode === 'grid' ? mobileDesign.colors.accentDark : mobileDesign.colors.textPrimary, cursor: 'pointer' }} aria-label="Grid view">
                <Grid style={{ width: 18, height: 18 }} aria-hidden="true" />
              </motion.button>
              <motion.button onClick={() => setViewMode('list')} whileTap={{ scale: 0.95 }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${viewMode === 'list' ? mobileDesign.colors.accent : mobileDesign.colors.border}`, borderRadius: '8px', background: viewMode === 'list' ? mobileDesign.colors.accentLight : mobileDesign.colors.surface, color: viewMode === 'list' ? mobileDesign.colors.accentDark : mobileDesign.colors.textPrimary, cursor: 'pointer' }} aria-label="List view">
                <List style={{ width: 18, height: 18 }} aria-hidden="true" />
              </motion.button>
            </div>
          </div>

{(() => {
            if (filteredProducts.length === 0) {
              return (
                <div style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: mobileDesign.colors.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Search style={{ width: 36, height: 36, color: mobileDesign.colors.textTertiary }} aria-hidden="true" />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: mobileDesign.colors.textPrimary, marginBottom: '8px' }}>No products found</h2>
                  <p style={{ fontSize: '15px', color: mobileDesign.colors.textSecondary, marginBottom: '24px', maxWidth: '280px' }}>Try adjusting your search or filters to find what you're looking for.</p>
                  <HapticButton variant="outline" size="md" onClick={() => { setQuery(''); setSelectedCategory('all'); }}>
                    Clear Filters
                  </HapticButton>
                </div>
              );
            }
            if (viewMode === 'grid') {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      style={{ width: '100%', maxWidth: '180px', flexShrink: 0 }}
                    >
                      <ProductCard
                        {...product}
                        onPress={() => {}}
                        onWishlistToggle={() => {}}
                        isInWishlist={false}
                        priority={index < 4}
                      />
                    </motion.div>
                  ))}
                </div>
              );
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <ProductCard
                      {...product}
                      onPress={() => {}}
                      onWishlistToggle={() => {}}
                      isInWishlist={false}
                      aspectRatio="4/3"
                      priority={index < 2}
                    />
                  </motion.div>
                ))}
              </div>
            );
          })()}
        </motion.section>
      </main>

      <BottomTabNavigation currentTab="search" cartCount={0} />
    </div>
  );
}