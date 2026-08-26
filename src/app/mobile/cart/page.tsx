'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Tag, Gift, ChevronDown, ChevronUp, Check, X, Plus, Minus, Shield, Truck, RotateCcw, Heart } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from '@/components/mobile/MobileImage';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { HapticButton, ChipButton } from '@/components/mobile/HapticButton';
import { formatINR } from '@/lib/money';
import { ProductCardSkeleton } from '@/components/mobile/Skeleton';

const cartItems = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    price: 159900,
    originalPrice: 169900,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
    color: 'Natural Titanium',
    storage: '256 GB',
    protectionPlan: 'AppleCare+',
    protectionPrice: 9999,
    quantity: 1,
    inStock: true,
    maxQuantity: 5,
  },
  {
    id: '2',
    name: 'AirPods Pro 2',
    brand: 'Apple',
    price: 24900,
    originalPrice: 26900,
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80',
    color: 'White',
    storage: '',
    protectionPlan: null,
    protectionPrice: 0,
    quantity: 2,
    inStock: true,
    maxQuantity: 10,
  },
  {
    id: '3',
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    price: 29990,
    originalPrice: 34990,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80',
    color: 'Black',
    storage: '',
    protectionPlan: 'Extended Warranty',
    protectionPrice: 2999,
    quantity: 1,
    inStock: false,
    maxQuantity: 0,
  },
];

const savedForLater = [
  {
    id: '4',
    name: 'MacBook Air M3',
    brand: 'Apple',
    price: 114900,
    originalPrice: 124900,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    color: 'Space Gray',
    storage: '512 GB',
  },
];

const shippingThreshold = 49900;
const shippingCost = 0;
const codFee = 49;

export default function CartPage() {
  const [items, setItems] = useState(cartItems);
  const [savedItems, setSavedItems] = useState(savedForLater);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [swipedItem, setSwipedItem] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (item.price + item.protectionPrice) * item.quantity, 0);
  const savings = items.reduce((sum, item) => sum + ((item.originalPrice - item.price) * item.quantity), 0);
  const protectionTotal = items.reduce((sum, item) => sum + item.protectionPrice * item.quantity, 0);
  const needsShipping = subtotal < shippingThreshold;
  const finalShipping = needsShipping ? shippingCost : 0;
  const total = subtotal + finalShipping + codFee;

  const updateQuantity = useCallback((id: string, newQuantity: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.maxQuantity, newQuantity)) } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setSwipedItem(null);
  }, []);

  const moveToSaved = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setSavedItems(prev => [...prev, { ...item, protectionPlan: null, protectionPrice: 0 }]);
      removeItem(id);
    }
  }, [items, removeItem]);

  const moveToCart = useCallback((id: string) => {
    const item = savedItems.find(i => i.id === id);
    if (item) {
      setItems(prev => [...prev, { ...item, quantity: 1, protectionPlan: null, protectionPrice: 0, inStock: true, maxQuantity: 5 }]);
      setSavedItems(prev => prev.filter(i => i.id !== id));
    }
  }, [savedItems]);

  const applyPromo = useCallback(() => {
    setPromoError('');
    setPromoSuccess('');
    if (!promoCode.trim()) return;
    
    const validPromos: Record<string, { discount: number; type: 'percent' | 'flat' }> = {
      'WELCOME10': { discount: 10, type: 'percent' },
      'SAVE500': { discount: 500, type: 'flat' },
      'FREESHIP': { discount: 0, type: 'flat' },
    };

    const promo = validPromos[promoCode.toUpperCase()];
    if (promo) {
      setAppliedPromo(promoCode.toUpperCase());
      setPromoSuccess(promo.type === 'percent' 
        ? `Applied ${promo.discount}% off!` 
        : promo.discount > 0 
          ? `Applied ₹${promo.discount} off!` 
          : 'Free shipping applied!');
    } else {
      setPromoError('Invalid promo code');
    }
  }, [promoCode]);

  const removePromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoSuccess('');
  }, []);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (touchStart === null) return;
    const diff = touchStart - e.touches[0].clientX;
    if (diff > 80) setSwipedItem(id);
    else if (diff < -20) setSwipedItem(null);
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const promoDiscount = appliedPromo ? 
    (() => {
      const validPromos: Record<string, { discount: number; type: 'percent' | 'flat' }> = {
        'WELCOME10': { discount: 10, type: 'percent' },
        'SAVE500': { discount: 500, type: 'flat' },
        'FREESHIP': { discount: 0, type: 'flat' },
      };
      const promo = validPromos[appliedPromo];
      return promo.type === 'percent' ? Math.round(subtotal * promo.discount / 100) : promo.discount;
    })() : 0;

  const finalTotal = total - promoDiscount;

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily }}>
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            position: 'sticky', top: 0, zIndex: mobileDesign.zIndex.sticky,
            background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: 0 }}>Cart</h1>
        </motion.header>

        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: mobileDesign.colors.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 48, height: 48, color: mobileDesign.colors.textTertiary }}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
          </motion.div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: mobileDesign.colors.textPrimary, marginBottom: '8px' }}>Your cart is empty</h2>
          <p style={{ fontSize: '15px', color: mobileDesign.colors.textSecondary, marginBottom: '24px', maxWidth: '280px' }}>Looks like you haven't added any products yet. Start shopping to fill your cart!</p>
          <HapticButton variant="primary" size="lg" onClick={() => window.history.back()} style={{ minWidth: '200px' }}>
            Continue Shopping
          </HapticButton>
        </div>

        <BottomTabNavigation currentTab="cart" cartCount={0} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily, paddingBottom: `${mobileDesign.touchTarget * 2 + mobileDesign.spacing['3xl']}px` }}>
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
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: 0 }}>
            Cart <span style={{ fontWeight: 400, color: mobileDesign.colors.textTertiary }}>({items.length})</span>
          </h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => window.history.back()}
            style={{
              width: `${mobileDesign.touchTarget}px`, height: `${mobileDesign.touchTarget}px`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: `${mobileDesign.borderRadius.md}px`,
              background: mobileDesign.colors.borderLight, color: mobileDesign.colors.textPrimary, cursor: 'pointer',
            }}
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 24, height: 24 }}><path d="M15 18l-6-6 6-6"/></svg>
          </motion.button>
        </div>
      </motion.header>

      <main style={{ paddingTop: `${mobileDesign.spacing.md}px` }}>
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              style={{ marginBottom: '12px' }}
            >
              <CartItemCard
                item={item}
                swipedItem={swipedItem}
                onTouchStart={(e) => handleTouchStart(e, item.id)}
                onTouchMove={(e) => handleTouchMove(e, item.id)}
                onTouchEnd={handleTouchEnd}
                onQuantityChange={(q) => updateQuantity(item.id, q)}
                onRemove={() => removeItem(item.id)}
                onMoveToSaved={() => moveToSaved(item.id)}
                onWishlistToggle={() => {}}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {savedItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: '24px' }}
          >
            <motion.button
              onClick={() => setShowSaved(!showSaved)}
              whileTap={{ scale: 0.99 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
                border: 'none', background: mobileDesign.colors.surface,
                color: mobileDesign.colors.textPrimary, fontSize: '15px', fontWeight: 600,
                fontFamily: mobileDesign.typography.fontFamily, textAlign: 'left', cursor: 'pointer',
              }}
              aria-expanded={showSaved}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart style={{ width: 18, height: 18, color: mobileDesign.colors.accent }} aria-hidden="true" />
                Saved for Later ({savedItems.length})
              </span>
              <motion.span animate={{ rotate: showSaved ? 180 : 0 }} transition={{ duration: 200 }}>
                <ChevronDown style={{ width: 20, height: 20, color: mobileDesign.colors.textTertiary }} aria-hidden="true" />
              </motion.span>
            </motion.button>

            <AnimatePresence>
              {showSaved && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ padding: `0 ${mobileDesign.spacing.lg}px ${mobileDesign.spacing.lg}px` }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {savedItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          display: 'flex', gap: '12px', padding: `${mobileDesign.spacing.md}px`,
                          background: mobileDesign.colors.surface, borderRadius: `${mobileDesign.borderRadius.lg}px`,
                          boxShadow: mobileDesign.shadows.sm,
                        }}
                      >
                        <div style={{ width: '72px', height: '72px', borderRadius: `${mobileDesign.borderRadius.md}px`, background: mobileDesign.colors.borderLight, flexShrink: 0, overflow: 'hidden' }}>
                          <MobileImage src={item.image} alt="" sizes="72px" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 500, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>{item.brand}</p>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: '0 0 4px', lineHeight: 1.3 }}>{item.name}</h4>
                            <p style={{ fontSize: '12px', color: mobileDesign.colors.textSecondary, margin: 0 }}>{item.color}{item.storage && ` • ${item.storage}`}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <HapticButton variant="primary" size="sm" onClick={() => moveToCart(item.id)} style={{ flex: 1 }}>
                              Move to Cart
                            </HapticButton>
                            <motion.button
                              onClick={() => setSavedItems(prev => prev.filter(i => i.id !== item.id))}
                              whileTap={{ scale: 0.9 }}
                              style={{
                                width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', borderRadius: `${mobileDesign.borderRadius.md}px`,
                                background: mobileDesign.colors.errorLight, color: mobileDesign.colors.error, cursor: 'pointer',
                              }}
                              aria-label="Remove permanently"
                            >
                              <Trash2 style={{ width: 18, height: 18 }} aria-hidden="true" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`, marginTop: '12px' }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Promo Code</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
              placeholder="Enter promo code"
              style={{
                flex: 1, padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
                border: `1px solid ${promoError ? mobileDesign.colors.error : mobileDesign.colors.border}`,
                borderRadius: `${mobileDesign.borderRadius.md}px`, background: mobileDesign.colors.surface,
                fontSize: '15px', fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary,
                outline: 'none',
              }}
              aria-label="Promo code"
            />
            {appliedPromo ? (
              <motion.button
                onClick={removePromo}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
                  border: 'none', borderRadius: `${mobileDesign.borderRadius.md}px`,
                  background: mobileDesign.colors.errorLight, color: mobileDesign.colors.error,
                  fontSize: '14px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, cursor: 'pointer',
                }}
              >
                Remove
              </motion.button>
            ) : (
              <HapticButton onClick={applyPromo} disabled={!promoCode.trim()} style={{ minWidth: '100px' }}>
                Apply
              </HapticButton>
            )}
          </div>
          {promoError && <p style={{ marginTop: '8px', fontSize: '13px', color: mobileDesign.colors.error }}>{promoError}</p>}
          {promoSuccess && <p style={{ marginTop: '8px', fontSize: '13px', color: mobileDesign.colors.success }}>{promoSuccess}</p>}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}
        >
          <div style={{ background: mobileDesign.colors.surface, borderRadius: `${mobileDesign.borderRadius.lg}px`, boxShadow: mobileDesign.shadows.sm, padding: `${mobileDesign.spacing.lg}px` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{formatINR(subtotal)}</span>
            </div>
            {savings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: mobileDesign.colors.success }}>
                <span style={{ fontSize: '14px' }}>Savings</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>-{formatINR(savings)}</span>
              </div>
            )}
            {protectionTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Protection Plans</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{formatINR(protectionTotal)}</span>
              </div>
            )}
            {appliedPromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: mobileDesign.colors.success }}>
                <span style={{ fontSize: '14px' }}>Promo Discount ({appliedPromo})</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>-{formatINR(promoDiscount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>
                Shipping
                {needsShipping && <span style={{ marginLeft: '4px', fontSize: '11px', color: mobileDesign.colors.accent }}>Free above ₹499</span>}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: needsShipping ? mobileDesign.colors.accent : mobileDesign.colors.success }}>
                {needsShipping ? formatINR(finalShipping) : 'FREE'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>COD Fee</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{formatINR(codFee)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${mobileDesign.colors.border}`, paddingTop: '12px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>Total</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: mobileDesign.colors.accent }}>{formatINR(finalTotal)}</span>
              </div>
              <p style={{ marginTop: '8px', fontSize: '12px', color: mobileDesign.colors.textTertiary, textAlign: 'right' }}>Incl. of all taxes</p>
            </div>
          </div>
        </motion.section>
      </main>

      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: mobileDesign.zIndex.sticky,
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${mobileDesign.colors.borderLight}`, boxShadow: mobileDesign.shadows.lg,
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
          paddingBottom: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-bottom, 0))`,
        }}
      >
        <HapticButton
          variant="primary"
          fullWidth
          size="xl"
          onClick={() => {}}
          disabled={items.length === 0}
          rightIcon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
        >
          Proceed to Checkout · {formatINR(finalTotal)}
        </HapticButton>
      </motion.div>

      <BottomTabNavigation currentTab="cart" cartCount={items.reduce((s, i) => s + i.quantity, 0)} />
    </div>
  );
}

function CartItemCard({
  item,
  swipedItem,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onQuantityChange,
  onRemove,
  onMoveToSaved,
  onWishlistToggle,
}: {
  item: typeof cartItems[0];
  swipedItem: string | null;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onQuantityChange: (q: number) => void;
  onRemove: () => void;
  onMoveToSaved: () => void;
  onWishlistToggle: () => void;
}) {
  const isSwiped = swipedItem === item.id;
  const x = isSwiped ? -100 : 0;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'relative',
        background: mobileDesign.colors.surface,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        boxShadow: mobileDesign.shadows.sm,
        overflow: 'hidden',
        transform: `translateX(${x}px)`,
        transition: `transform ${mobileDesign.transitions.fast}`,
      }}
    >
      <div style={{ display: 'flex', gap: '12px', padding: `${mobileDesign.spacing.md}px` }}>
        <div style={{ width: '80px', height: '80px', borderRadius: `${mobileDesign.borderRadius.md}px`, background: mobileDesign.colors.borderLight, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
          <MobileImage src={item.image} alt="" sizes="72px" />
          {!item.inStock && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: mobileDesign.colors.error, background: mobileDesign.colors.errorLight, padding: '4px 8px', borderRadius: `${mobileDesign.borderRadius.full}px` }}>Out of Stock</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 500, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px' }}>{item.brand}</p>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: '0 0 4px', lineHeight: 1.3 }}>{item.name}</h4>
            <p style={{ fontSize: '12px', color: mobileDesign.colors.textSecondary, margin: '0 0 8px' }}>
              {item.color}{item.storage && ` • ${item.storage}`}
            </p>
            {item.protectionPlan && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500, color: mobileDesign.colors.accent, background: mobileDesign.colors.accentLight, padding: '2px 8px', borderRadius: `${mobileDesign.borderRadius.full}px` }}>
                <Shield style={{ width: 12, height: 12 }} aria-hidden="true" />
                {item.protectionPlan}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.button
                onClick={() => onQuantityChange(item.quantity - 1)}
                whileTap={{ scale: 0.9 }}
                disabled={item.quantity <= 1 || !item.inStock}
                style={{
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${mobileDesign.colors.border}`, borderRadius: `${mobileDesign.borderRadius.sm}px`,
                  background: mobileDesign.colors.surface, color: item.quantity <= 1 || !item.inStock ? mobileDesign.colors.textTertiary : mobileDesign.colors.textPrimary,
                  cursor: item.quantity <= 1 || !item.inStock ? 'not-allowed' : 'pointer',
                }}
                aria-label="Decrease quantity"
              >
                <Minus style={{ width: 16, height: 16 }} aria-hidden="true" />
              </motion.button>
              <span style={{ fontSize: '15px', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
              <motion.button
                onClick={() => onQuantityChange(item.quantity + 1)}
                whileTap={{ scale: 0.9 }}
                disabled={item.quantity >= item.maxQuantity || !item.inStock}
                style={{
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${mobileDesign.colors.border}`, borderRadius: `${mobileDesign.borderRadius.sm}px`,
                  background: mobileDesign.colors.surface, color: item.quantity >= item.maxQuantity || !item.inStock ? mobileDesign.colors.textTertiary : mobileDesign.colors.textPrimary,
                  cursor: item.quantity >= item.maxQuantity || !item.inStock ? 'not-allowed' : 'pointer',
                }}
                aria-label="Increase quantity"
              >
                <Plus style={{ width: 16, height: 16 }} aria-hidden="true" />
              </motion.button>
            </div>

            <motion.span
              style={{
                fontSize: '17px', fontWeight: 700, fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textPrimary,
              }}
            >
              {formatINR((item.price + item.protectionPrice) * item.quantity)}
            </motion.span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          <motion.button
            onClick={onMoveToSaved}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: `${mobileDesign.borderRadius.md}px`,
              background: mobileDesign.colors.borderLight, color: mobileDesign.colors.textTertiary, cursor: 'pointer',
            }}
            aria-label="Save for later"
          >
            <Heart style={{ width: 18, height: 18 }} aria-hidden="true" />
          </motion.button>
          <motion.button
            onClick={onRemove}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: `${mobileDesign.borderRadius.md}px`,
              background: mobileDesign.colors.errorLight, color: mobileDesign.colors.error, cursor: 'pointer',
            }}
            aria-label="Remove item"
          >
            <Trash2 style={{ width: 18, height: 18 }} aria-hidden="true" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isSwiped && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px',
              background: mobileDesign.colors.error, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderTopRightRadius: `${mobileDesign.borderRadius.lg}px`, borderBottomRightRadius: `${mobileDesign.borderRadius.lg}px`,
            }}
          >
            <motion.button
              onClick={onRemove}
              whileTap={{ scale: 0.9 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: '8px',
              }}
            >
              <Trash2 style={{ width: 24, height: 24 }} aria-hidden="true" />
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Remove</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}