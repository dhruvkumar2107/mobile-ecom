'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, Trash2, Star } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from '@/components/mobile/MobileImage';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { HapticButton } from '@/components/mobile/HapticButton';
import { formatINR } from '@/lib/money';

const wishlistItems = [
  { id: '1', name: 'iPhone 15 Pro Max', brand: 'Apple', price: 159900, originalPrice: 169900, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80', rating: 4.8, reviewCount: 2341, discount: 6, inStock: true },
  { id: '2', name: 'Galaxy S24 Ultra', brand: 'Samsung', price: 139999, originalPrice: 149999, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80', rating: 4.7, reviewCount: 1876, discount: 7, inStock: true },
  { id: '3', name: 'MacBook Air M3', brand: 'Apple', price: 114900, originalPrice: 124900, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80', rating: 4.9, reviewCount: 3421, discount: 8, inStock: true },
  { id: '4', name: 'Sony WH-1000XM5', brand: 'Sony', price: 29990, originalPrice: 34990, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80', rating: 4.8, reviewCount: 5632, discount: 14, inStock: true },
  { id: '5', name: 'iPad Pro 12.9" M2', brand: 'Apple', price: 99900, originalPrice: 109900, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80', rating: 4.7, reviewCount: 1245, discount: 9, inStock: false },
  { id: '6', name: 'Pixel 8 Pro', brand: 'Google', price: 106999, originalPrice: 112999, image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80', rating: 4.6, reviewCount: 987, discount: 5, inStock: true },
];

export default function WishlistPage() {
  const [items, setItems] = useState(wishlistItems);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const moveToCart = useCallback((id: string) => {
    // In a real app, this would add to cart
    console.log('Add to cart:', id);
  }, []);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.button onClick={() => window.history.back()} whileTap={{ scale: 0.9 }} style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '12px', background: mobileDesign.colors.borderLight, color: mobileDesign.colors.textPrimary, cursor: 'pointer' }} aria-label="Go back">
            <ChevronLeft style={{ width: 24, height: 24 }} aria-hidden="true" />
          </motion.button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: 0, flex: 1, textAlign: 'center' }}>Wishlist</h1>
          {items.length > 0 && (
            <motion.button onClick={clearWishlist} whileTap={{ scale: 0.9 }} style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.error, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              Clear All
            </motion.button>
          )}
        </div>
      </motion.header>

      <main style={{ paddingTop: `${mobileDesign.spacing.md}px` }}>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
        >
          {items.length === 0 ? (
            <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: mobileDesign.colors.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Heart style={{ width: 48, height: 48, color: mobileDesign.colors.textTertiary }} aria-hidden="true" />
                </div>
              </motion.div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: mobileDesign.colors.textPrimary, marginBottom: '8px' }}>Your wishlist is empty</h2>
              <p style={{ fontSize: '15px', color: mobileDesign.colors.textSecondary, marginBottom: '24px', maxWidth: '280px' }}>Save items you love and we'll notify you when they're on sale.</p>
              <HapticButton variant="primary" size="lg" onClick={() => window.location.href = '/mobile'} style={{ minWidth: '200px' }}>
                Start Shopping
              </HapticButton>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ display: 'flex', gap: '12px', padding: '12px', background: mobileDesign.colors.surface, borderRadius: `${mobileDesign.borderRadius.lg}px`, boxShadow: mobileDesign.shadows.sm, border: `1px solid ${mobileDesign.colors.borderLight}` }}
                >
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: mobileDesign.colors.borderLight, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                    <MobileImage src={item.image} alt="" sizes="72px" />
                    {!item.inStock && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: mobileDesign.colors.error, background: mobileDesign.colors.errorLight, padding: '4px 8px', borderRadius: `${mobileDesign.borderRadius.full}px` }}>Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.brand}</p>
                      <h4 style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary, lineHeight: 1.3 }}>{item.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                        <Star className="fill-current" style={{ width: 14, height: 14, color: '#FBBF24' }} aria-hidden="true" />
                        <span style={{ fontSize: '12px', fontWeight: 500, color: mobileDesign.colors.textSecondary }}>{item.rating.toFixed(1)}</span>
                        <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary }}>({item.reviewCount})</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>{formatINR(item.price)}</span>
                        {item.originalPrice > item.price && <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary, textDecoration: 'line-through' }}>{formatINR(item.originalPrice)}</span>}
                        {item.discount > 0 && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: mobileDesign.colors.error, padding: '2px 6px', borderRadius: '4px', background: mobileDesign.colors.errorLight }}>
                            {item.discount}% OFF
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!item.inStock ? (
                          <span style={{ fontSize: '12px', fontWeight: 500, color: mobileDesign.colors.error }}>Out of Stock</span>
                        ) : (
                          <HapticButton variant="primary" size="sm" onClick={() => moveToCart(item.id)} style={{ minWidth: 'auto' }}>
                            Add to Cart
                          </HapticButton>
                        )}
                      </div>
                    </div>
                  </div>
                  <motion.button onClick={() => removeItem(item.id)} whileTap={{ scale: 0.9 }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '8px', background: mobileDesign.colors.errorLight, color: mobileDesign.colors.error, cursor: 'pointer' }} aria-label="Remove from wishlist">
                    <Trash2 style={{ width: 18, height: 18 }} aria-hidden="true" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>

      <BottomTabNavigation currentTab="wishlist" cartCount={0} />
    </div>
  );
}