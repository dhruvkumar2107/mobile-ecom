'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Share2, Truck, Shield, RotateCcw, Star, Minus, Plus, ChevronDown, ChevronUp, Check, ShoppingBag } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { ProductGallery } from '@/components/mobile/ProductGallery';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { HapticButton, ChipButton } from '@/components/mobile/HapticButton';
import { formatINR } from '@/lib/money';
import { ProductCard } from '@/components/mobile/ProductCard';
import { defaultCategories } from '@/components/mobile/CategoryChips';

const PRODUCT_NAME = 'iPhone 15 Pro Max';

const productImages = [
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
];

const colors = [
  { id: 'natural', name: 'Natural Titanium', hex: '#E8E4E0', hex2: null },
  { id: 'blue', name: 'Blue Titanium', hex: '#4A6FA5', hex2: '#2E4A7A' },
  { id: 'white', name: 'White Titanium', hex: '#F5F5F0', hex2: null },
  { id: 'black', name: 'Black Titanium', hex: '#1C1C1E', hex2: null },
];

const storages = [
  { id: '256', name: '256 GB', price: 0 },
  { id: '512', name: '512 GB', price: 10000 },
  { id: '1tb', name: '1 TB', price: 30000 },
];

const protectionPlans = [
  { id: 'basic', name: 'Basic', price: 0, duration: 12, coverage: ['Manufacturing defects'] },
  { id: 'plus', name: 'Plus', price: 4999, duration: 24, coverage: ['Accidental damage', 'Screen repair', 'Battery replacement'] },
  { id: 'total', name: 'Total', price: 9999, duration: 36, coverage: ['Everything in Plus', 'Theft protection', 'Express replacement', '24/7 priority support'] },
];

const specs = [
  { category: 'Display', items: [{ key: 'size', label: 'Size', value: '6.7" Super Retina XDR' }, { key: 'resolution', label: 'Resolution', value: '2796 x 1290 pixels' }, { key: 'refresh', label: 'Refresh Rate', value: '120Hz ProMotion' }] },
  { category: 'Performance', items: [{ key: 'chip', label: 'Chip', value: 'A17 Pro' }, { key: 'cpu', label: 'CPU', value: '6-core (2 performance + 4 efficiency)' }, { key: 'gpu', label: 'GPU', value: '6-core' }, { key: 'neural', label: 'Neural Engine', value: '16-core' }] },
  { category: 'Camera', items: [{ key: 'main', label: 'Main', value: '48MP Fusion, f/1.78' }, { key: 'ultra', label: 'Ultra Wide', value: '12MP, f/2.2' }, { key: 'tele', label: 'Telephoto', value: '12MP, 5x optical zoom' }, { key: 'video', label: 'Video', value: '4K@60fps ProRes' }] },
  { category: 'Battery', items: [{ key: 'life', label: 'Video Playback', value: 'Up to 29 hours' }, { key: 'charge', label: 'Fast Charge', value: '50% in 30 min (20W)' }, { key: 'mag', label: 'MagSafe', value: 'Up to 15W' }] },
];

const reviews = [
  { id: 1, user: 'Rahul S.', rating: 5, date: '2 days ago', text: 'Absolutely incredible device. The camera quality is unmatched, and the titanium build feels premium in hand. Battery easily lasts a full day with heavy use.', verified: true },
  { id: 2, user: 'Priya M.', rating: 5, date: '1 week ago', text: 'Best phone I have ever owned. The 120Hz display is buttery smooth, and the Action Button is a game changer for shortcuts.', verified: true },
  { id: 3, user: 'Amit K.', rating: 4, date: '2 weeks ago', text: 'Great phone overall. Only minor complaint is the charging speed could be faster compared to competitors. Everything else is perfect.', verified: true },
];

export default function ProductDetailPage() {
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colors[0].id);
  const [selectedStorage, setSelectedStorage] = useState(storages[0].id);
  const [selectedProtection, setSelectedProtection] = useState(protectionPlans[0].id);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['description']));
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [cartCount, setCartCount] = useState(3);

  const basePrice = 159900;
  const storagePrice = storages.find(s => s.id === selectedStorage)?.price || 0;
  const protectionPrice = protectionPlans.find(p => p.id === selectedProtection)?.price || 0;
  const finalPrice = basePrice + storagePrice + protectionPrice;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleAddToCart = () => {
    setCartCount(prev => prev + quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: mobileDesign.colors.background,
        fontFamily: mobileDesign.typography.fontFamily,
        paddingBottom: `${mobileDesign.touchTarget * 2 + mobileDesign.spacing['2xl']}px`,
      }}
    >
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.button
            onClick={() => window.history.back()}
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
            aria-label="Go back"
          >
            <ChevronLeft style={{ width: 24, height: 24 }} aria-hidden="true" />
          </motion.button>

          <h1
            style={{
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              color: mobileDesign.colors.textPrimary,
              margin: 0,
              flex: 1,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              padding: '0 16px',
            }}
          >
            iPhone 15 Pro Max
          </h1>

          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button
              onClick={() => setIsInWishlist(!isInWishlist)}
              whileTap={{ scale: 1.1 }}
              style={{
                width: `${mobileDesign.touchTarget}px`,
                height: `${mobileDesign.touchTarget}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: `${mobileDesign.borderRadius.md}px`,
                background: mobileDesign.colors.borderLight,
                color: isInWishlist ? mobileDesign.colors.error : mobileDesign.colors.textPrimary,
                cursor: 'pointer',
              }}
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isInWishlist}
            >
              {isInWishlist ? (
                <Heart className="fill-current" style={{ width: 22, height: 22 }} aria-hidden="true" />
              ) : (
                <Heart style={{ width: 22, height: 22, strokeWidth: 2 }} aria-hidden="true" />
              )}
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
              }}
              aria-label="Share product"
            >
              <Share2 style={{ width: 22, height: 22 }} aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showImageViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: mobileDesign.zIndex.modal,
              background: 'rgba(0, 0, 0, 0.95)',
            }}
            onClick={() => setShowImageViewer(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
          >
            <motion.button
              onClick={() => setShowImageViewer(false)}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute',
                top: `${mobileDesign.spacing.lg}px`,
                right: `${mobileDesign.spacing.lg}px`,
                zIndex: 10,
                width: `${mobileDesign.touchTarget}px`,
                height: `${mobileDesign.touchTarget}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: 'pointer',
              }}
              aria-label="Close image viewer"
            >
              <ChevronDown style={{ width: 24, height: 24, transform: 'rotate(180deg)' }} aria-hidden="true" />
            </motion.button>
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <motion.button
                onClick={() => setCurrentImage(p => (p - 1 + productImages.length) % productImages.length)}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: 'absolute',
                  left: `${mobileDesign.spacing.lg}px`,
                  width: `${mobileDesign.touchTarget * 1.5}px`,
                  height: `${mobileDesign.touchTarget * 1.5}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: 'pointer',
                }}
                aria-label="Previous image"
              >
                <ChevronLeft style={{ width: 28, height: 28 }} aria-hidden="true" />
              </motion.button>
              {/* `fill` + contain keeps the original letterboxed framing while
                  still going through the image optimizer. */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  width: '90%',
                  height: '85%',
                  borderRadius: `${mobileDesign.borderRadius.md}px`,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={productImages[currentImage]}
                  alt={`${PRODUCT_NAME} — enlarged view ${currentImage + 1}`}
                  fill
                  sizes="100vw"
                  quality={85}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <motion.button
                onClick={() => setCurrentImage(p => (p + 1) % productImages.length)}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: 'absolute',
                  right: `${mobileDesign.spacing.lg}px`,
                  width: `${mobileDesign.touchTarget * 1.5}px`,
                  height: `${mobileDesign.touchTarget * 1.5}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: 'pointer',
                }}
                aria-label="Next image"
              >
                <ChevronRight style={{ width: 28, height: 28 }} aria-hidden="true" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ paddingTop: `${mobileDesign.spacing.md}px` }}>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ProductGallery
            images={productImages}
            alt="iPhone 15 Pro Max Natural Titanium"
            index={currentImage}
            onIndexChange={setCurrentImage}
            onExpand={() => setShowImageViewer(true)}
          />

          <div style={{ padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.accent,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Apple
              </span>
              <Star className="fill-current" style={{ width: 16, height: 16, color: '#FBBF24' }} aria-hidden="true" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>4.8</span>
              <span style={{ fontSize: '13px', color: mobileDesign.colors.textTertiary }}> (2,341 reviews)</span>
            </div>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                fontFamily: mobileDesign.typography.fontFamily,
                lineHeight: 1.2,
                color: mobileDesign.colors.textPrimary,
                margin: '0 0 8px',
              }}
            >
              iPhone 15 Pro Max
            </h1>

            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <motion.span
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.textPrimary,
                }}
              >
                {formatINR(finalPrice)}
              </motion.span>
              <motion.span
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.textTertiary,
                  textDecoration: 'line-through',
                }}
              >
                {formatINR(169900)}
              </motion.span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.error,
                  padding: '4px 10px',
                  background: mobileDesign.colors.errorLight,
                  borderRadius: `${mobileDesign.borderRadius.full}px`,
                }}
              >
                6% OFF
              </motion.span>
            </motion.div>

            <div
              style={{
                marginTop: '12px',
                padding: `${mobileDesign.spacing.md}px`,
                background: mobileDesign.colors.successLight,
                borderRadius: `${mobileDesign.borderRadius.md}px`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Truck style={{ width: 18, height: 18, color: mobileDesign.colors.success, flexShrink: 0 }} aria-hidden="true" />
              <span style={{ fontSize: '13px', fontWeight: 500, color: mobileDesign.colors.success, fontFamily: mobileDesign.typography.fontFamily }}>
                Free delivery by Tomorrow
              </span>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
            borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
            background: mobileDesign.colors.surface,
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Color</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {colors.map(color => (
              <motion.button
                key={color.id}
                onClick={() => setSelectedColor(color.id)}
                whileTap={{ scale: 0.95 }}
                style={{
                  position: 'relative',
                  width: '64px',
                  height: '64px',
                  border: `2px solid ${selectedColor === color.id ? mobileDesign.colors.accent : 'transparent'}`,
                  borderRadius: `${mobileDesign.borderRadius.md}px`,
                  background: `linear-gradient(135deg, ${color.hex} 0%, ${color.hex2 || color.hex} 100%)`,
                  cursor: 'pointer',
                  boxShadow: selectedColor === color.id ? `0 0 0 2px ${mobileDesign.colors.accent}` : mobileDesign.shadows.sm,
                  transition: `all ${mobileDesign.transitions.fast}`,
                }}
                aria-label={`Select ${color.name}`}
                aria-pressed={selectedColor === color.id}
              >
                {selectedColor === color.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute',
                      inset: -2,
                      borderRadius: `${mobileDesign.borderRadius.md}px`,
                      border: `2px solid ${mobileDesign.colors.accent}`,
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          <p style={{ marginTop: '8px', fontSize: '13px', color: mobileDesign.colors.textTertiary }}>Selected: {colors.find(c => c.id === selectedColor)?.name}</p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
            borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
            background: mobileDesign.colors.surface,
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Storage</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {storages.map(storage => (
              <ChipButton
                key={storage.id}
                selected={selectedStorage === storage.id}
                variant="accent"
                onClick={() => setSelectedStorage(storage.id)}
                style={{ minWidth: '90px' }}
              >
                {storage.name}
                {storage.price > 0 && <span style={{ marginLeft: '4px', fontSize: '11px', opacity: 0.8 }}>+{formatINR(storage.price)}</span>}
              </ChipButton>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
            borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
            background: mobileDesign.colors.surface,
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Protection Plan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {protectionPlans.map(plan => {
              const isSelected = selectedProtection === plan.id;
              return (
                <motion.button
                  key={plan.id}
                  onClick={() => setSelectedProtection(plan.id)}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: `${mobileDesign.spacing.md}px`,
                    border: `1px solid ${isSelected ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                    borderRadius: `${mobileDesign.borderRadius.md}px`,
                    background: isSelected ? mobileDesign.colors.accentLight : mobileDesign.colors.surface,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: `all ${mobileDesign.transitions.fast}`,
                  }}
                  aria-pressed={isSelected}
                >
                  <motion.div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                      background: isSelected ? mobileDesign.colors.accent : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {isSelected && <Check style={{ width: 12, height: 12, color: 'white' }} aria-hidden="true" />}
                  </motion.div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textPrimary, fontFamily: mobileDesign.typography.fontFamily }}>{plan.name}</span>
                      {plan.price > 0 && (
                        <span style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.accent, fontFamily: mobileDesign.typography.fontFamily }}>
                          +{formatINR(plan.price)}
                        </span>
                      )}
                      {plan.price === 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: mobileDesign.colors.success, padding: '2px 6px', borderRadius: `${mobileDesign.borderRadius.full}px`, background: mobileDesign.colors.successLight }}>Included</span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: mobileDesign.colors.textSecondary }}>{plan.duration} months coverage</span>
                    <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {plan.coverage.map((item, i) => (
                        <span key={i} style={{ fontSize: '11px', color: mobileDesign.colors.textTertiary, background: mobileDesign.colors.borderLight, padding: '2px 8px', borderRadius: `${mobileDesign.borderRadius.full}px` }}>{item}</span>
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          style={{
            padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
            borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
            background: mobileDesign.colors.surface,
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: mobileDesign.colors.textSecondary, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Quantity</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              whileTap={{ scale: 0.9 }}
              disabled={quantity <= 1}
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${mobileDesign.colors.border}`,
                borderRadius: `${mobileDesign.borderRadius.md}px`,
                background: mobileDesign.colors.surface,
                color: quantity <= 1 ? mobileDesign.colors.textTertiary : mobileDesign.colors.textPrimary,
                cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
              }}
              aria-label="Decrease quantity"
            >
              <Minus style={{ width: 20, height: 20 }} aria-hidden="true" />
            </motion.button>
            <span style={{ fontSize: '20px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, minWidth: '40px', textAlign: 'center' }}>{quantity}</span>
            <motion.button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              whileTap={{ scale: 0.9 }}
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${mobileDesign.colors.border}`,
                borderRadius: `${mobileDesign.borderRadius.md}px`,
                background: mobileDesign.colors.surface,
                color: mobileDesign.colors.textPrimary,
                cursor: 'pointer',
              }}
              aria-label="Increase quantity"
            >
              <Plus style={{ width: 20, height: 20 }} aria-hidden="true" />
            </motion.button>
            <span style={{ marginLeft: 'auto', fontSize: '13px', color: mobileDesign.colors.textTertiary }}>Max 10 per order</span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{ padding: `${mobileDesign.spacing.lg}px` }}
        >
          {['description', 'specs', 'reviews', 'shipping'].map(section => {
            const isExpanded = expandedSections.has(section);
            const icons = { description: 'Info', specs: 'Settings', reviews: 'Star', shipping: 'Truck' };
            return (
              <motion.div
                key={section}
                style={{
                  border: `1px solid ${mobileDesign.colors.border}`,
                  borderRadius: `${mobileDesign.borderRadius.md}px`,
                  background: mobileDesign.colors.surface,
                  marginBottom: '12px',
                  overflow: 'hidden',
                }}
              >
                <motion.button
                  onClick={() => toggleSection(section)}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
                    border: 'none',
                    background: 'transparent',
                    color: mobileDesign.colors.textPrimary,
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: mobileDesign.typography.fontFamily,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  aria-expanded={isExpanded}
                >
                  <span style={{ textTransform: 'capitalize' }}>{section}</span>
                  <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 200 }}
                  >
                    <ChevronDown style={{ width: 20, height: 20, color: mobileDesign.colors.textTertiary }} aria-hidden="true" />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ padding: `0 ${mobileDesign.spacing.lg}px ${mobileDesign.spacing.lg}px` }}
                    >
                      {section === 'description' && (
                        <div style={{ lineHeight: 1.7, color: mobileDesign.colors.textSecondary }}>
                          <p style={{ marginBottom: '12px' }}>The iPhone 15 Pro Max features a stunning 6.7-inch Super Retina XDR display with ProMotion technology for adaptive refresh rates up to 120Hz. The Dynamic Island bubbles up alerts and Live Activities — so you don't miss a beat.</p>
                          <p style={{ marginBottom: '12px' }}>Powered by the A17 Pro chip, a new class of iPhone chip that delivers our best graphics performance by far. Mobile games feel incredibly immersive, with detailed environments and realistic characters.</p>
                          <p style={{ marginBottom: '12px' }}>The Pro camera system gets its biggest advancement ever, with a 48MP Main camera that captures super-high-resolution photos with incredible detail. New 5x Telephoto camera on Pro Max lets you zoom in like never before.</p>
                          <p>Designed with aerospace-grade titanium, it's stronger and lighter than any previous Pro model. Ceramic Shield front. Textured matte glass back. And industry-leading IP68 water resistance.</p>
                        </div>
                      )}
                      {section === 'specs' && (
                        <div>
                          {specs.map((group, gi) => (
                            <div key={group.category} style={{ marginBottom: gi > 0 ? '20px' : 0 }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '10px' }}>{group.category}</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {group.items.map(item => (
                                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${mobileDesign.colors.borderLight}` }}>
                                    <span style={{ fontSize: '14px', color: mobileDesign.colors.textSecondary }}>{item.label}</span>
                                    <span style={{ fontSize: '14px', fontWeight: 500, color: mobileDesign.colors.textPrimary }}>{item.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {section === 'reviews' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ fontSize: '40px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>4.8</span>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {[1,2,3,4,5].map(i => <Star key={i} className="fill-current" style={{ width: 16, height: 16, color: '#FBBF24' }} aria-hidden="true" />)}
                                </div>
                                <span style={{ fontSize: '13px', color: mobileDesign.colors.textTertiary }}>2,341 ratings</span>
                              </div>
                            </div>
                            <HapticButton variant="outline" size="sm">Write Review</HapticButton>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {reviews.slice(0, showAllReviews ? reviews.length : 2).map(review => (
                              <div key={review.id} style={{ padding: '16px 0', borderBottom: `1px solid ${mobileDesign.colors.borderLight}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>{review.user}</span>
                                  {review.verified && <span style={{ fontSize: '11px', fontWeight: 600, color: mobileDesign.colors.accent, background: mobileDesign.colors.accentLight, padding: '2px 6px', borderRadius: `${mobileDesign.borderRadius.full}px` }}>Verified</span>}
                                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: mobileDesign.colors.textTertiary }}>{review.date}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                                  {[1,2,3,4,5].map(i => <Star key={i} className={i <= review.rating ? 'fill-current' : ''} style={{ width: 14, height: 14, color: '#FBBF24' }} aria-hidden="true" />)}
                                </div>
                                <p style={{ fontSize: '14px', lineHeight: 1.6, color: mobileDesign.colors.textSecondary, margin: 0 }}>{review.text}</p>
                              </div>
                            ))}
                          </div>
                          {reviews.length > 2 && (
                            <HapticButton
                              variant="ghost"
                              fullWidth
                              onClick={() => setShowAllReviews(!showAllReviews)}
                              style={{ marginTop: '8px' }}
                            >
                              {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                            </HapticButton>
                          )}
                        </div>
                      )}
                      {section === 'shipping' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: mobileDesign.colors.successLight, borderRadius: `${mobileDesign.borderRadius.md}px` }}>
                            <Truck style={{ width: 22, height: 22, color: mobileDesign.colors.success, flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.success, margin: '0 0 4px' }}>Free Standard Delivery</p>
                              <p style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary, margin: 0 }}>Delivered by tomorrow if ordered within 4 hours</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: mobileDesign.colors.surface, border: `1px solid ${mobileDesign.colors.border}`, borderRadius: `${mobileDesign.borderRadius.md}px` }}>
                            <Shield style={{ width: 22, height: 22, color: mobileDesign.colors.accent, flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: '0 0 4px' }}>7-Day Return Policy</p>
                              <p style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary, margin: 0 }}>Easy returns with free pickup. Full refund to original payment method.</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: mobileDesign.colors.surface, border: `1px solid ${mobileDesign.colors.border}`, borderRadius: `${mobileDesign.borderRadius.md}px` }}>
                            <RotateCcw style={{ width: 22, height: 22, color: mobileDesign.colors.accent, flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: '0 0 4px' }}>Exchange Available</p>
                              <p style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary, margin: 0 }}>Exchange your old device and get instant credit up to ₹45,000</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.section>
      </main>

      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.5 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: mobileDesign.zIndex.sticky,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
          boxShadow: mobileDesign.shadows.lg,
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
          paddingBottom: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-bottom, 0))`,
          display: 'flex',
          gap: '12px',
        }}
      >
        <HapticButton
          variant="outline"
          fullWidth
          size="lg"
          onClick={handleBuyNow}
          style={{ flex: 1 }}
        >
          Buy Now
        </HapticButton>
        <HapticButton
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleAddToCart}
          style={{ flex: 1 }}
          rightIcon={<ShoppingBag style={{ width: 20, height: 20 }} aria-hidden="true" />}
        >
          Add to Cart
        </HapticButton>
      </motion.div>

      <BottomTabNavigation currentTab="home" cartCount={cartCount} />
    </div>
  );
}