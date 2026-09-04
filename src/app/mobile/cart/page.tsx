'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ChevronLeft, ChevronDown, Check, Minus, Plus, Shield, Truck, RotateCcw, Tag } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from '@/components/mobile/MobileImage';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { HapticButton } from '@/components/mobile/HapticButton';
import { formatINR } from '@/lib/money';
import { useCartStore } from '@/stores/cart';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const totalItems = useCartStore(s => s.totalItems);
  const totalPrice = useCartStore(s => s.totalPrice);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const subtotal = totalPrice();
  const itemCount = totalItems();
  const shipping = subtotal >= 499 ? 0 : 49;
  const total = subtotal + shipping;

  const applyPromo = useCallback(async () => {
    if (!promoCode.trim()) return;
    setIsApplying(true);
    setPromoError('');
    setPromoSuccess('');
    try {
      const res = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (res.ok && data.discount) {
        setAppliedPromo(promoCode.toUpperCase());
        setPromoSuccess(`Applied ${formatINR(data.discount)} off!`);
      } else {
        setPromoError(data.error || 'Invalid promo code');
      }
    } catch {
      setPromoError('Failed to apply promo code');
    }
    setIsApplying(false);
  }, [promoCode]);

  const removePromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoSuccess('');
    setPromoError('');
  }, []);

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily }}>
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            position: 'sticky', top: 0, zIndex: mobileDesign.zIndex.sticky,
            background: mobileDesign.colors.flipkartBlue,
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
            paddingTop: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-top, 0px))`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.button
              onClick={() => window.history.back()}
              whileTap={{ scale: 0.9 }}
              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '50%', background: 'transparent', color: 'white', cursor: 'pointer' }}
            >
              <ChevronLeft style={{ width: 24, height: 24 }} />
            </motion.button>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>My Cart</h1>
          </div>
        </motion.header>

        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: mobileDesign.colors.accentLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 48, height: 48, color: mobileDesign.colors.accent }}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
          </motion.div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: mobileDesign.colors.textPrimary, marginBottom: '8px' }}>Your cart is empty</h2>
          <p style={{ fontSize: '15px', color: mobileDesign.colors.textSecondary, marginBottom: '24px', maxWidth: '280px' }}>
            Looks like you haven't added any products yet. Start shopping!
          </p>
          <HapticButton variant="primary" size="lg" onClick={() => window.location.href = '/mobile'} style={{ minWidth: '200px' }}>
            Continue Shopping
          </HapticButton>
        </div>

        <BottomTabNavigation currentTab="cart" cartCount={0} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: mobileDesign.colors.background, fontFamily: mobileDesign.typography.fontFamily, paddingBottom: `${mobileDesign.touchTarget * 2 + mobileDesign.spacing['3xl']}px` }}>
      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky', top: 0, zIndex: mobileDesign.zIndex.sticky,
          background: mobileDesign.colors.flipkartBlue,
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
          paddingTop: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-top, 0px))`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            onClick={() => window.history.back()}
            whileTap={{ scale: 0.9 }}
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '50%', background: 'transparent', color: 'white', cursor: 'pointer' }}
          >
            <ChevronLeft style={{ width: 24, height: 24 }} />
          </motion.button>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>
            My Cart <span style={{ fontWeight: 400, opacity: 0.8 }}>({itemCount})</span>
          </h1>
        </div>
      </motion.header>

      <main style={{ paddingTop: `${mobileDesign.spacing.sm}px` }}>
        {/* Delivery Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
            background: 'white', marginBottom: `${mobileDesign.spacing.sm}px`,
          }}
        >
          <Truck style={{ width: 18, height: 18, color: mobileDesign.colors.flipkartGreen }} />
          <span style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary }}>
            Delivery to: <span style={{ fontWeight: 600, color: mobileDesign.colors.textPrimary }}>Mumbai 400001</span>
          </span>
        </motion.div>

        {/* Cart Items */}
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              style={{
                background: 'white',
                padding: `${mobileDesign.spacing.lg}px`,
                marginBottom: `${mobileDesign.spacing.sm}px`,
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Image */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '8px',
                  background: '#F8F8F8', flexShrink: 0, overflow: 'hidden', position: 'relative',
                }}>
                  <MobileImage src={item.image || '/icon.svg'} alt={item.name} sizes="80px" />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  {item.brand && (
                    <p style={{ fontSize: '12px', fontWeight: 600, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', margin: '0 0 4px' }}>
                      {item.brand}
                    </p>
                  )}
                  <h4 style={{
                    fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary,
                    margin: '0 0 8px', lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {item.name}
                  </h4>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${mobileDesign.colors.border}`, borderRadius: '8px' }}>
                      <motion.button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        whileTap={{ scale: 0.9 }}
                        disabled={item.quantity <= 1}
                        style={{
                          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: 'none', borderRadius: '8px 0 0 8px', background: 'transparent',
                          color: item.quantity <= 1 ? mobileDesign.colors.textTertiary : mobileDesign.colors.textPrimary,
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Minus style={{ width: 16, height: 16 }} />
                      </motion.button>
                      <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '32px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <motion.button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        whileTap={{ scale: 0.9 }}
                        disabled={item.quantity >= 5}
                        style={{
                          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: 'none', borderRadius: '0 8px 8px 0', background: 'transparent',
                          color: item.quantity >= 5 ? mobileDesign.colors.textTertiary : mobileDesign.colors.textPrimary,
                          cursor: item.quantity >= 5 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Plus style={{ width: 16, height: 16 }} />
                      </motion.button>
                    </div>

                    <motion.button
                      onClick={() => removeItem(item.id)}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '6px 12px', border: 'none', borderRadius: '8px',
                        background: 'transparent', color: mobileDesign.colors.textTertiary,
                        fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      <Trash2 style={{ width: 16, height: 16 }} />
                      Remove
                    </motion.button>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: 0 }}>
                    {formatINR(item.price * item.quantity)}
                  </p>
                  {item.quantity > 1 && (
                    <p style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary, margin: '2px 0 0' }}>
                      {formatINR(item.price)} each
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Promo Code */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: `${mobileDesign.spacing.lg}px`,
            background: 'white',
            marginTop: `${mobileDesign.spacing.sm}px`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Tag style={{ width: 18, height: 18, color: mobileDesign.colors.accent }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: 0 }}>
              Apply Coupon
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
              placeholder="Enter coupon code"
              style={{
                flex: 1, padding: '10px 14px',
                border: `1px solid ${promoError ? mobileDesign.colors.error : mobileDesign.colors.border}`,
                borderRadius: '8px', background: mobileDesign.colors.background,
                fontSize: '14px', fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textPrimary, outline: 'none',
              }}
            />
            {appliedPromo ? (
              <motion.button
                onClick={removePromo}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '10px 16px', border: 'none', borderRadius: '8px',
                  background: mobileDesign.colors.errorLight, color: mobileDesign.colors.error,
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Remove
              </motion.button>
            ) : (
              <HapticButton onClick={applyPromo} disabled={!promoCode.trim() || isApplying} style={{ minWidth: '80px' }}>
                {isApplying ? '...' : 'Apply'}
              </HapticButton>
            )}
          </div>
          {promoError && <p style={{ marginTop: '8px', fontSize: '13px', color: mobileDesign.colors.error }}>{promoError}</p>}
          {promoSuccess && <p style={{ marginTop: '8px', fontSize: '13px', color: mobileDesign.colors.flipkartGreen }}>{promoSuccess}</p>}
        </motion.section>

        {/* Price Details */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            padding: `${mobileDesign.spacing.lg}px`,
            background: 'white',
            marginTop: `${mobileDesign.spacing.sm}px`,
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: '0 0 12px' }}>
            Price Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Price ({itemCount} items)</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{formatINR(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>Delivery Charges</span>
              <span style={{
                fontSize: '14px', fontWeight: 600,
                color: shipping === 0 ? mobileDesign.colors.flipkartGreen : mobileDesign.colors.textPrimary,
              }}>
                {shipping === 0 ? 'FREE' : formatINR(shipping)}
              </span>
            </div>
            {appliedPromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: mobileDesign.colors.flipkartGreen }}>
                <span style={{ fontSize: '14px' }}>Coupon Discount</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>-{promoSuccess.match(/[\d,]+/)?.[0] || '0'}</span>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${mobileDesign.colors.border}`, paddingTop: '12px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>Total Amount</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>{formatINR(total)}</span>
              </div>
            </div>
            {shipping === 0 && (
              <p style={{ fontSize: '13px', color: mobileDesign.colors.flipkartGreen, fontWeight: 600, margin: '4px 0 0' }}>
                You will save {formatINR(49)} on this order
              </p>
            )}
          </div>
        </motion.section>

        {/* Safe & Secure */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: `${mobileDesign.spacing.lg}px`,
            background: 'white', marginTop: `${mobileDesign.spacing.sm}px`,
          }}
        >
          <Shield style={{ width: 18, height: 18, color: mobileDesign.colors.flipkartGreen }} />
          <span style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary }}>
            Safe and Secure Payments. Easy returns. 100% Authentic products.
          </span>
        </motion.div>
      </main>

      {/* Bottom Checkout Bar */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: mobileDesign.zIndex.sticky,
          background: 'white', borderTop: `1px solid ${mobileDesign.colors.border}`,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
          paddingBottom: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-bottom, 0px))`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: 0 }}>
            {formatINR(total)}
          </p>
          <p style={{ fontSize: '12px', color: mobileDesign.colors.flipkartGreen, margin: '2px 0 0', fontWeight: 600 }}>
            {shipping === 0 ? 'FREE Delivery' : ''}
          </p>
        </div>
        <HapticButton
          variant="primary"
          size="xl"
          onClick={() => window.location.href = '/mobile/checkout'}
          style={{
            background: mobileDesign.colors.accent,
            fontWeight: 700,
            minWidth: '160px',
          }}
        >
          Place Order
        </HapticButton>
      </motion.div>

      <BottomTabNavigation currentTab="cart" cartCount={itemCount} />
    </div>
  );
}
