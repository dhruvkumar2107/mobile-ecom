'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, Bell, Heart, ShoppingCart, ChevronRight, X, SlidersHorizontal, Star, Clock, TrendingUp, Mic, ArrowUp, Flame, Zap, Shield, Truck, RotateCcw, Gift, ChevronDown, ChevronUp, Share2, ExternalLink, Info } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { BannerCarousel } from '@/components/mobile/BannerCarousel';
import { ProductCard } from '@/components/mobile/ProductCard';
import { ProductCardSkeleton } from '@/components/mobile/Skeleton';
import { HapticButton } from '@/components/mobile/HapticButton';
import { useCartStore } from '@/stores/cart';
import { formatINR } from '@/lib/money';
import dynamic from 'next/dynamic';

const SpinWheel = dynamic(() => import('@/components/mobile/SpinWheel').then(m => m.SpinWheel), { ssr: false });
const VideoFeed = dynamic(() => import('@/components/mobile/VideoFeed').then(m => m.VideoFeed), { ssr: false });

interface RecentlyViewed {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  slug: string;
  viewedAt: number;
}

function getRecentlyViewed(): RecentlyViewed[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('recently-viewed');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function addToRecentlyViewed(product: { id: string; name: string; brand: string; price: number; originalPrice: number; image: string; slug: string }) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentlyViewed();
    const filtered = existing.filter(p => p.id !== product.id);
    const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, 20);
    localStorage.setItem('recently-viewed', JSON.stringify(updated));
  } catch {}
}

function getWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('mobile-wishlist');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function toggleWishlistItem(id: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getWishlist();
    const updated = existing.includes(id) ? existing.filter(i => i !== id) : [...existing, id];
    localStorage.setItem('mobile-wishlist', JSON.stringify(updated));
    return updated;
  } catch { return []; }
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  discountPercent?: number;
  slug?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  gradient?: string;
  backgroundColor?: string;
}

interface MobileHomeClientProps {
  initialProducts: Product[];
  initialBanners: Banner[];
  initialCategories?: Category[];
}

export default function MobileHomeClient({ initialProducts, initialBanners, initialCategories = [] }: MobileHomeClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewed[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeFlashSaleTab, setActiveFlashSaleTab] = useState<'trending' | 'new' | 'best'>('trending');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setCartCount(totalItems());
    setRecentlyViewed(getRecentlyViewed());
    const wishlistIds = getWishlist();
    setWishlist(new Set(wishlistIds));
  }, [totalItems]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const suggestions = products
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(p => p.name)
        .slice(0, 5);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, products]);

  const handleWishlistToggle = useCallback((id: string) => {
    const updated = toggleWishlistItem(id);
    setWishlist(new Set(updated));
  }, []);

  const handleProductPress = useCallback((product: Product) => {
    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      brand: product.brand || '',
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.image,
      slug: product.slug || product.id,
    });
    window.location.href = `/mobile/product/${product.slug || product.id}`;
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.brand.toLowerCase().includes(selectedCategory.toLowerCase()));

  const quickLinks = [
    { icon: '📱', label: 'Mobiles', color: '#2874F0' },
    { icon: '🎧', label: 'Audio', color: '#FF9F00' },
    { icon: '⌚', label: 'Wearables', color: '#26A541' },
    { icon: '🔌', label: 'Accessories', color: '#FF6161' },
    { icon: '💻', label: 'Laptops', color: '#8B5CF6' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: mobileDesign.colors.background,
        fontFamily: mobileDesign.typography.fontFamily,
        paddingBottom: `${mobileDesign.touchTarget + mobileDesign.spacing['3xl']}px`,
      }}
    >
      {/* Flipkart-style Blue Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: mobileDesign.zIndex.sticky,
          background: mobileDesign.colors.flipkartBlue,
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
          paddingTop: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-top, 0px))`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            onClick={() => setShowSearch(true)}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.95)',
              color: mobileDesign.colors.textTertiary,
              fontSize: '14px',
              fontFamily: mobileDesign.typography.fontFamily,
              cursor: 'pointer',
            }}
            aria-label="Search products"
          >
            <Search style={{ width: 18, height: 18, color: mobileDesign.colors.accent }} />
            <span style={{ flex: 1, textAlign: 'left' }}>Search for Products, Brands and More</span>
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowLocationPicker(true)}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: '50%',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                position: 'relative',
              }}
              aria-label="Select delivery location"
            >
              <MapPin style={{ width: 22, height: 22 }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: '50%',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
              }}
              aria-label="Notifications"
            >
              <Bell style={{ width: 22, height: 22 }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => window.location.href = '/mobile/cart'}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: '50%',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                position: 'relative',
              }}
              aria-label="Shopping cart"
            >
              <ShoppingCart style={{ width: 22, height: 22 }} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 0,
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '9px',
                    background: mobileDesign.colors.flipkartYellow,
                    color: mobileDesign.colors.textPrimary,
                    fontSize: '11px',
                    fontWeight: 700,
                    lineHeight: '18px',
                    textAlign: 'center',
                    padding: '0 4px',
                  }}
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Location Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            padding: '6px 0',
          }}
        >
          <MapPin style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.8)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            Deliver to: <span style={{ fontWeight: 600, color: 'white' }}>Mumbai 400001</span>
          </span>
          <ChevronDown style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.6)' }} />
        </motion.div>
      </motion.header>

      {/* Search Overlay - Flipkart Style */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: mobileDesign.zIndex.modal,
              background: mobileDesign.colors.overlay,
            }}
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              style={{
                background: mobileDesign.colors.flipkartBlue,
                padding: '12px 16px',
                paddingTop: `calc(12px + env(safe-area-inset-top, 0px))`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSearch(false)}
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    borderRadius: '50%',
                    background: 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <X style={{ width: 24, height: 24 }} />
                </motion.button>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'white',
                  borderRadius: '8px',
                }}>
                  <Search style={{ width: 18, height: 18, color: mobileDesign.colors.accent }} />
                  <input
                    type="text"
                    placeholder="Search for Products, Brands and More"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      fontSize: '15px',
                      fontFamily: mobileDesign.typography.fontFamily,
                      color: mobileDesign.colors.textPrimary,
                      outline: 'none',
                    }}
                    autoFocus
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                      <X style={{ width: 18, height: 18, color: mobileDesign.colors.textTertiary }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Suggestions - Flipkart Style */}
              {searchSuggestions.length > 0 && (
                <div style={{
                  background: 'white',
                  borderRadius: '0 0 12px 12px',
                  marginTop: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  {searchSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSearch(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        border: 'none',
                        borderBottom: index < searchSuggestions.length - 1 ? `1px solid ${mobileDesign.colors.borderLight}` : 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Clock style={{ width: 16, height: 16, color: mobileDesign.colors.textTertiary }} />
                      <span style={{ fontSize: '14px', color: mobileDesign.colors.textPrimary, flex: 1 }}>
                        {suggestion}
                      </span>
                      <ExternalLink style={{ width: 14, height: 14, color: mobileDesign.colors.textTertiary }} />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Trending Searches - Flipkart Style */}
              <div style={{ padding: '12px 0 4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame style={{ width: 14, height: 14 }} /> Trending:
                </span>
                {['iPhone 15', 'Galaxy S24', 'OnePlus 12', 'boAt', 'MacBook Air'].map((term) => (
                  <button
                    key={term}
                    onClick={() => { setSearchQuery(term); setShowSearch(false); }}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '12px',
                      background: 'transparent',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Banner Carousel */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.sm}px 0` }}
        >
          <BannerCarousel banners={initialBanners} aspectRatio="16/7" autoPlayInterval={4000} />
        </motion.section>

        {/* Quick Links */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: `${mobileDesign.spacing.lg}px ${mobileDesign.spacing.sm}px`,
            background: 'white',
            margin: `${mobileDesign.spacing.sm}px`,
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {quickLinks.map((link) => (
            <motion.button
              key={link.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = `/mobile/category/${link.label.toLowerCase()}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                minWidth: '60px',
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `${link.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
              }}>
                {link.icon}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: mobileDesign.colors.textPrimary,
                fontFamily: mobileDesign.typography.fontFamily,
              }}>
                {link.label}
              </span>
            </motion.button>
          ))}
        </motion.section>

        {/* Category Chips */}
        {initialCategories.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'flex',
              gap: '8px',
              padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.lg}px`,
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '8px 16px',
                border: selectedCategory === 'all' ? 'none' : `1px solid ${mobileDesign.colors.border}`,
                borderRadius: '20px',
                background: selectedCategory === 'all' ? mobileDesign.colors.accent : 'white',
                color: selectedCategory === 'all' ? 'white' : mobileDesign.colors.textSecondary,
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontFamily: mobileDesign.typography.fontFamily,
              }}
            >
              All
            </button>
            {initialCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                style={{
                  padding: '8px 16px',
                  border: selectedCategory === cat.slug ? 'none' : `1px solid ${mobileDesign.colors.border}`,
                  borderRadius: '20px',
                  background: selectedCategory === cat.slug ? mobileDesign.colors.accent : 'white',
                  color: selectedCategory === cat.slug ? 'white' : mobileDesign.colors.textSecondary,
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontFamily: mobileDesign.typography.fontFamily,
                }}
              >
                {cat.name}
              </button>
            ))}
          </motion.section>
        )}

        {/* Best of Electronics */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
            background: 'white',
            margin: `${mobileDesign.spacing.sm}px`,
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: mobileDesign.colors.textPrimary,
              margin: 0,
            }}>
              Best of Electronics
            </h2>
            <button
              onClick={() => window.location.href = '/mobile/products'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'transparent',
                color: mobileDesign.colors.accent,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              VIEW ALL <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
          }}>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i}><ProductCardSkeleton /></div>
              ))
            ) : (
              filteredProducts.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <ProductCard
                    {...product}
                    onPress={() => handleProductPress(product)}
                    onWishlistToggle={handleWishlistToggle}
                    isInWishlist={wishlist.has(product.id)}
                  />
                </motion.div>
              ))
            )}
          </div>
        </motion.section>

        {/* Top Deals */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ padding: `${mobileDesign.spacing.sm}px` }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #2874F0 0%, #1E5FC0 100%)',
            borderRadius: '12px',
            padding: `${mobileDesign.spacing.lg}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>
                Top Deals
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                Up to 60% off on bestsellers
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/mobile/products?sort=discount'}
              style={{
                padding: '10px 20px',
                background: mobileDesign.colors.flipkartYellow,
                color: mobileDesign.colors.textPrimary,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: mobileDesign.typography.fontFamily,
              }}
            >
              Shop Now
            </motion.button>
          </div>
        </motion.section>

        {/* Trending Products Grid */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
            background: 'white',
            margin: `${mobileDesign.spacing.sm}px`,
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: mobileDesign.colors.textPrimary,
              margin: 0,
            }}>
              Trending Now
            </h2>
            <button
              onClick={() => window.location.href = '/mobile/products?sort=popular'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'transparent',
                color: mobileDesign.colors.accent,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              VIEW ALL <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
          }}>
            {filteredProducts.slice(0, 6).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <ProductCard
                  {...product}
                  onPress={() => handleProductPress(product)}
                  onWishlistToggle={handleWishlistToggle}
                  isInWishlist={wishlist.has(product.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Spin to Win */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ padding: `${mobileDesign.spacing.sm}px` }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSpinWheel(true)}
            style={{
              width: '100%',
              padding: `${mobileDesign.spacing.lg}px`,
              background: 'linear-gradient(135deg, #FF9F00 0%, #FF6B00 100%)',
              borderRadius: '12px',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 159, 0, 0.3)',
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              🎰
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Spin to Win Rewards!</p>
              <p style={{ fontSize: '13px', opacity: 0.8, margin: '2px 0 0' }}>Every spin wins — discounts, free shipping</p>
            </div>
            <ChevronRight style={{ width: 24, height: 24, opacity: 0.8 }} />
          </motion.button>
        </motion.section>

        {/* Just For You */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
            background: 'white',
            margin: `${mobileDesign.spacing.sm}px`,
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: mobileDesign.colors.textPrimary,
            margin: '0 0 12px',
          }}>
            Just For You
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
          }}>
            {products.slice(0, 8).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <ProductCard
                  {...product}
                  onPress={() => handleProductPress(product)}
                  onWishlistToggle={handleWishlistToggle}
                  isInWishlist={wishlist.has(product.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Video Reels */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ padding: `${mobileDesign.spacing.sm}px` }}
        >
          <VideoFeed />
        </motion.section>

        {/* Recently Viewed - Flipkart Style */}
        {recentlyViewed.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            style={{
              padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
              background: 'white',
              margin: `${mobileDesign.spacing.sm}px`,
              borderRadius: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: mobileDesign.colors.textPrimary,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Clock style={{ width: 18, height: 18, color: mobileDesign.colors.accent }} />
                Recently Viewed
              </h2>
              <button
                onClick={() => setRecentlyViewed([])}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: mobileDesign.colors.accent,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear All
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {recentlyViewed.slice(0, 8).map((item, index) => (
                <motion.a
                  key={item.id}
                  href={`/mobile/product/${item.slug}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    minWidth: '120px',
                    maxWidth: '120px',
                    background: mobileDesign.colors.surface,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: `1px solid ${mobileDesign.colors.borderLight}`,
                  }}
                >
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1/1',
                    background: '#F8F8F8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                  }}>
                    <img
                      src={item.image || '/icon.svg'}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                  <div style={{ padding: '6px 8px 8px' }}>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: mobileDesign.colors.textPrimary,
                      margin: '0 0 2px',
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {item.name}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: mobileDesign.colors.textPrimary,
                      margin: 0,
                    }}>
                      {formatINR(item.price)}
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.section>
        )}

        {/* Trust Badges - Flipkart Style */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: `${mobileDesign.spacing.sm}px`,
          }}
        >
          {[
            { icon: <Truck style={{ width: 24, height: 24 }} />, title: 'Free Delivery', subtitle: 'On orders above ₹499' },
            { icon: <Shield style={{ width: 24, height: 24 }} />, title: 'Genuine Products', subtitle: '100% authentic' },
            { icon: <RotateCcw style={{ width: 24, height: 24 }} />, title: 'Easy Returns', subtitle: '7-day return policy' },
          ].map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + index * 0.05 }}
              style={{
                background: 'white',
                borderRadius: '10px',
                padding: '12px 8px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: mobileDesign.colors.accentLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                color: mobileDesign.colors.accent,
              }}>
                {badge.icon}
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: '0 0 2px' }}>
                {badge.title}
              </p>
              <p style={{ fontSize: '10px', color: mobileDesign.colors.textTertiary, margin: 0 }}>
                {badge.subtitle}
              </p>
            </motion.div>
          ))}
        </motion.section>

        {/* Back to Top Button - Flipkart Style */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              style={{
                position: 'fixed',
                bottom: `${mobileDesign.touchTarget + mobileDesign.spacing['2xl']}px`,
                right: '16px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: mobileDesign.colors.accent,
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(40, 116, 240, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: mobileDesign.zIndex.dropdown,
              }}
              aria-label="Scroll to top"
            >
              <ArrowUp style={{ width: 24, height: 24 }} />
            </motion.button>
          )}
        </AnimatePresence>
      </main>

      <BottomTabNavigation currentTab="home" cartCount={cartCount} />
      <SpinWheel isOpen={showSpinWheel} onClose={() => setShowSpinWheel(false)} />
    </div>
  );
}
