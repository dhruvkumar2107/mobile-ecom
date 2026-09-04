'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Heart, Share2, Truck, Shield, RotateCcw, Star, Minus, Plus, ChevronDown, Check, ShoppingBag, Zap, MapPin } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { ProductGallery } from '@/components/mobile/ProductGallery';
import { BottomTabNavigation } from '@/components/mobile/BottomTabNavigation';
import { HapticButton, ChipButton } from '@/components/mobile/HapticButton';
import { formatINR } from '@/lib/money';
import { useCartStore } from '@/stores/cart';

interface Variant {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  colorHex2: string | null;
  finish: string;
  ramGb: number | null;
  storageGb: number | null;
  mrpPaise: number;
  pricePaise: number;
  finalPaise: number;
  discountPercent: number;
  inStock: boolean;
  lowStock: boolean;
  imageUrl: string | null;
  isDefault: boolean;
}

interface ColorChip {
  name: string;
  hex: string;
  hex2: string | null;
  finish: string;
}

interface SpecRow {
  key: string;
  label: string;
  value: string;
  unit: string;
  isKeySpec: boolean;
}

interface SpecGroup {
  groupName: string;
  rows: SpecRow[];
}

interface Review {
  id: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  user: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  slug: string;
  rating: number;
  reviewCount: number;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    tagline: string;
    description: string;
    brand: string;
    brandId: string;
    category: string;
    imageUrl: string;
    badges: string[];
    highlights: string[];
    warrantyMonths: number;
    ratingAvg: number;
    reviewCount: number;
    soldCount: number;
    slug: string;
    priceRange: { minPaise: number; maxPaise: number };
  };
  variants: Variant[];
  colors: ColorChip[];
  ramOptions: number[];
  storageOptions: number[];
  specGroups: SpecGroup[];
  keySpecs: SpecRow[];
  ratingBreakdown: { rating: number; count: number; percent: number }[];
  defaultVariantId: string;
  reviews: Review[];
  relatedProducts: RelatedProduct[];
}

export default function ProductDetailClient({
  product,
  variants,
  colors,
  ramOptions,
  storageOptions,
  specGroups,
  keySpecs,
  ratingBreakdown,
  defaultVariantId,
  reviews,
  relatedProducts,
}: ProductDetailClientProps) {
  const defaultVariant = variants.find(v => v.id === defaultVariantId) || variants[0];
  const [selectedColor, setSelectedColor] = useState(defaultVariant?.colorName || '');
  const [selectedRam, setSelectedRam] = useState<number | null>(defaultVariant?.ramGb || null);
  const [selectedStorage, setSelectedStorage] = useState<number | null>(defaultVariant?.storageGb || null);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['description']));
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore(s => s.addItem);
  const totalItems = useCartStore(s => s.totalItems);

  // Find matching variant
  const currentVariant = variants.find(v =>
    v.colorName === selectedColor &&
    (ramOptions.length === 0 || v.ramGb === selectedRam) &&
    (storageOptions.length === 0 || v.storageGb === selectedStorage)
  ) || defaultVariant;

  const currentImage = currentVariant?.imageUrl || product.imageUrl;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleAddToCart = useCallback(async () => {
    if (!currentVariant) return;
    setIsAdding(true);
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: currentVariant.id, quantity }),
      });
      addItem({
        id: currentVariant.id,
        name: product.name,
        price: currentVariant.finalPaise / 100,
        image: currentImage || '/icon.svg',
        brand: product.brand,
      });
      setCartCount(totalItems() + quantity);
    } catch (e) {
      console.error('Failed to add to cart:', e);
    }
    setIsAdding(false);
  }, [currentVariant, quantity, addItem, product, currentImage, totalItems]);

  const handleBuyNow = useCallback(async () => {
    await handleAddToCart();
    window.location.href = '/mobile/checkout';
  }, [handleAddToCart]);

  const discount = currentVariant?.discountPercent || 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: mobileDesign.colors.background,
      fontFamily: mobileDesign.typography.fontFamily,
      paddingBottom: `${mobileDesign.touchTarget * 2 + mobileDesign.spacing['2xl']}px`,
    }}>
      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: mobileDesign.zIndex.sticky,
          background: mobileDesign.colors.flipkartBlue,
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
          paddingTop: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-top, 0px))`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.button
            onClick={() => window.history.back()}
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
          >
            <ChevronLeft style={{ width: 24, height: 24 }} />
          </motion.button>
          <h1 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'white',
            margin: 0,
            flex: 1,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '0 12px',
          }}>
            {product.name}
          </h1>
          <div style={{ display: 'flex', gap: '4px' }}>
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
            >
              <Share2 style={{ width: 20, height: 20 }} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main>
        {/* Product Gallery */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ background: 'white' }}
        >
          <ProductGallery
            images={[currentImage, product.imageUrl].filter(Boolean)}
            alt={product.name}
            index={0}
            onIndexChange={() => {}}
            onExpand={() => setShowImageViewer(true)}
          />
        </motion.section>

        {/* Product Info */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: `${mobileDesign.spacing.lg}px`,
            background: 'white',
            borderBottom: `8px solid ${mobileDesign.colors.background}`,
          }}
        >
          {/* Brand & Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: mobileDesign.colors.textTertiary,
              textTransform: 'uppercase',
            }}>
              {product.brand}
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              background: mobileDesign.colors.flipkartGreen,
              borderRadius: '4px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>
                {product.ratingAvg.toFixed(1)}
              </span>
              <Star style={{ width: 12, height: 12, color: 'white', fill: 'white' }} />
            </div>
            <span style={{ fontSize: '13px', color: mobileDesign.colors.textTertiary }}>
              {product.reviewCount.toLocaleString()} Ratings
            </span>
          </div>

          {/* Name */}
          <h1 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: mobileDesign.colors.textPrimary,
            margin: '0 0 12px',
            lineHeight: 1.3,
          }}>
            {product.name}
          </h1>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{
              fontSize: '28px',
              fontWeight: 700,
              color: mobileDesign.colors.textPrimary,
            }}>
              {formatINR(currentVariant?.finalPaise || product.priceRange.minPaise)}
            </span>
            {currentVariant && currentVariant.mrpPaise > currentVariant.finalPaise && (
              <>
                <span style={{
                  fontSize: '16px',
                  color: mobileDesign.colors.textTertiary,
                  textDecoration: 'line-through',
                }}>
                  {formatINR(currentVariant.mrpPaise)}
                </span>
                {discount > 0 && (
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: mobileDesign.colors.flipkartGreen,
                  }}>
                    {discount}% off
                  </span>
                )}
              </>
            )}
          </div>

          {/* Delivery */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: mobileDesign.colors.successLight,
            borderRadius: '8px',
            marginBottom: '12px',
          }}>
            <Truck style={{ width: 18, height: 18, color: mobileDesign.colors.flipkartGreen, flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.flipkartGreen }}>
                Free Delivery
              </span>
              <span style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary }}>
                {' '}· Delivery by tomorrow
              </span>
            </div>
          </div>

          {/* Key Specs */}
          {keySpecs.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {keySpecs.slice(0, 4).map(spec => (
                <div key={spec.key} style={{
                  flex: '1 1 45%',
                  minWidth: '120px',
                }}>
                  <p style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary, margin: '0 0 2px' }}>
                    {spec.label}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: 0 }}>
                    {spec.value}{spec.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Color Selection */}
        {colors.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              padding: `${mobileDesign.spacing.lg}px`,
              background: 'white',
              borderBottom: `8px solid ${mobileDesign.colors.background}`,
            }}
          >
            <h3 style={{
              fontSize: '14px',
              fontWeight: 700,
              color: mobileDesign.colors.textPrimary,
              margin: '0 0 4px',
            }}>
              Color
            </h3>
            <p style={{ fontSize: '13px', color: mobileDesign.colors.textTertiary, margin: '0 0 12px' }}>
              {selectedColor || 'Select a color'}
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {colors.map(color => (
                <motion.button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '56px',
                    height: '56px',
                    border: `2px solid ${selectedColor === color.name ? mobileDesign.colors.accent : 'transparent'}`,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${color.hex} 0%, ${color.hex2 || color.hex} 100%)`,
                    cursor: 'pointer',
                    boxShadow: selectedColor === color.name ? `0 0 0 2px ${mobileDesign.colors.accent}` : '0 1px 3px rgba(0,0,0,0.1)',
                    position: 'relative',
                  }}
                >
                  {selectedColor === color.name && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: mobileDesign.colors.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white',
                      }}
                    >
                      <Check style={{ width: 10, height: 10, color: 'white' }} />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Storage/RAM Selection */}
        {storageOptions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              padding: `${mobileDesign.spacing.lg}px`,
              background: 'white',
              borderBottom: `8px solid ${mobileDesign.colors.background}`,
            }}
          >
            <h3 style={{
              fontSize: '14px',
              fontWeight: 700,
              color: mobileDesign.colors.textPrimary,
              margin: '0 0 4px',
            }}>
              {ramOptions.length > 0 ? 'RAM & Storage' : 'Storage'}
            </h3>
            <p style={{ fontSize: '13px', color: mobileDesign.colors.textTertiary, margin: '0 0 12px' }}>
              {selectedRam && selectedStorage ? `${selectedRam}GB RAM, ${selectedStorage >= 1000 ? `${selectedStorage/1000}TB` : `${selectedStorage}GB`}` : 'Select an option'}
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {variants
                .filter(v => v.colorName === selectedColor && v.inStock)
                .map(v => {
                  const label = ramOptions.length > 0
                    ? `${v.ramGb || 0}GB / ${v.storageGb && v.storageGb >= 1000 ? `${v.storageGb/1000}TB` : `${v.storageGb || 0}GB`}`
                    : `${v.storageGb && v.storageGb >= 1000 ? `${v.storageGb/1000}TB` : `${v.storageGb || 0}GB`}`;
                  const isSelected = currentVariant?.id === v.id;
                  return (
                    <motion.button
                      key={v.id}
                      onClick={() => {
                        setSelectedRam(v.ramGb);
                        setSelectedStorage(v.storageGb);
                      }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '10px 16px',
                        border: `2px solid ${isSelected ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                        borderRadius: '8px',
                        background: isSelected ? mobileDesign.colors.accentLight : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isSelected ? mobileDesign.colors.accent : mobileDesign.colors.textPrimary,
                      }}>
                        {label}
                      </span>
                      {v.pricePaise < v.mrpPaise && (
                        <p style={{ fontSize: '12px', color: mobileDesign.colors.flipkartGreen, margin: '2px 0 0' }}>
                          {formatINR(v.finalPaise)}
                        </p>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </motion.section>
        )}

        {/* Highlights */}
        {product.highlights.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              padding: `${mobileDesign.spacing.lg}px`,
              background: 'white',
              borderBottom: `8px solid ${mobileDesign.colors.background}`,
            }}
          >
            <h3 style={{
              fontSize: '14px',
              fontWeight: 700,
              color: mobileDesign.colors.textPrimary,
              margin: '0 0 12px',
            }}>
              Highlights
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {product.highlights.map((item, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '6px 0',
                  fontSize: '13px',
                  color: mobileDesign.colors.textSecondary,
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: mobileDesign.colors.accent,
                    flexShrink: 0,
                    marginTop: '6px',
                  }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* Seller */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: `${mobileDesign.spacing.lg}px`,
            background: 'white',
            borderBottom: `8px solid ${mobileDesign.colors.background}`,
          }}
        >
          <h3 style={{
            fontSize: '14px',
            fontWeight: 700,
            color: mobileDesign.colors.textPrimary,
            margin: '0 0 12px',
          }}>
            Seller
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              padding: '4px 10px',
              background: mobileDesign.colors.accentLight,
              borderRadius: '4px',
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.accent }}>
                VOLTAGE
              </span>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary, margin: 0 }}>
                7 Day Replacement Policy
              </p>
            </div>
          </div>
        </motion.section>

        {/* Description & Specs */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ padding: `${mobileDesign.spacing.sm}px 0` }}
        >
          {['description', 'specs', 'reviews', 'shipping'].map(section => {
            const isExpanded = expandedSections.has(section);
            return (
              <div
                key={section}
                style={{
                  background: 'white',
                  borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
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
                    padding: `${mobileDesign.spacing.lg}px`,
                    border: 'none',
                    background: 'transparent',
                    color: mobileDesign.colors.textPrimary,
                    fontSize: '15px',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>
                    {section === 'specs' ? 'Specifications' : section}
                  </span>
                  <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}>
                    <ChevronDown style={{ width: 20, height: 20, color: mobileDesign.colors.textTertiary }} />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ padding: `0 ${mobileDesign.spacing.lg}px ${mobileDesign.spacing.lg}px` }}
                    >
                      {section === 'description' && (
                        <div style={{ fontSize: '14px', lineHeight: 1.7, color: mobileDesign.colors.textSecondary }}>
                          {product.description ? (
                            product.description.split('\n').map((p, i) => <p key={i} style={{ margin: '0 0 12px' }}>{p}</p>)
                          ) : (
                            <p style={{ margin: 0 }}>No description available for this product.</p>
                          )}
                        </div>
                      )}
                      {section === 'specs' && (
                        <div>
                          {specGroups.map((group, gi) => (
                            <div key={group.groupName} style={{ marginBottom: gi > 0 ? '20px' : 0 }}>
                              <h4 style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: mobileDesign.colors.accent,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                marginBottom: '10px',
                              }}>
                                {group.groupName}
                              </h4>
                              <div>
                                {group.rows.map(item => (
                                  <div key={item.key} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '10px 0',
                                    borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
                                  }}>
                                    <span style={{ fontSize: '13px', color: mobileDesign.colors.textTertiary }}>
                                      {item.label}
                                    </span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>
                                      {item.value}{item.unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {section === 'reviews' && (
                        <div>
                          {/* Rating Summary */}
                          <div style={{
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'center',
                            marginBottom: '20px',
                            padding: '16px',
                            background: mobileDesign.colors.background,
                            borderRadius: '12px',
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <span style={{
                                fontSize: '48px',
                                fontWeight: 700,
                                color: mobileDesign.colors.textPrimary,
                                lineHeight: 1,
                              }}>
                                {product.ratingAvg.toFixed(1)}
                              </span>
                              <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '4px' }}>
                                {[1,2,3,4,5].map(i => (
                                  <Star key={i} style={{
                                    width: 14,
                                    height: 14,
                                    color: i <= Math.round(product.ratingAvg) ? '#FFB800' : mobileDesign.colors.border,
                                    fill: i <= Math.round(product.ratingAvg) ? '#FFB800' : 'none',
                                  }} />
                                ))}
                              </div>
                              <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary }}>
                                {product.reviewCount.toLocaleString()} ratings
                              </span>
                            </div>
                            <div style={{ flex: 1 }}>
                              {ratingBreakdown.map(r => (
                                <div key={r.rating} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '4px',
                                }}>
                                  <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary, minWidth: '12px' }}>
                                    {r.rating}
                                  </span>
                                  <Star style={{ width: 12, height: 12, color: '#FFB800', fill: '#FFB800' }} />
                                  <div style={{
                                    flex: 1,
                                    height: '6px',
                                    background: mobileDesign.colors.border,
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                  }}>
                                    <div style={{
                                      width: `${r.percent}%`,
                                      height: '100%',
                                      background: '#FFB800',
                                      borderRadius: '3px',
                                    }} />
                                  </div>
                                  <span style={{ fontSize: '11px', color: mobileDesign.colors.textTertiary, minWidth: '30px' }}>
                                    {r.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Reviews List */}
                          <div>
                            {reviews.slice(0, showAllReviews ? reviews.length : 3).map(review => (
                              <div key={review.id} style={{
                                padding: '16px 0',
                                borderBottom: `1px solid ${mobileDesign.colors.borderLight}`,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    background: mobileDesign.colors.flipkartGreen,
                                    borderRadius: '4px',
                                  }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>
                                      {review.rating}
                                    </span>
                                    <Star style={{ width: 12, height: 12, color: 'white', fill: 'white' }} />
                                  </div>
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>
                                    {review.title || 'Good product'}
                                  </span>
                                </div>
                                <p style={{ fontSize: '13px', lineHeight: 1.6, color: mobileDesign.colors.textSecondary, margin: '0 0 8px' }}>
                                  {review.text}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: mobileDesign.colors.textPrimary }}>
                                    {review.user}
                                  </span>
                                  <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary }}>
                                    · {new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {reviews.length > 3 && (
                            <HapticButton
                              variant="ghost"
                              fullWidth
                              onClick={() => setShowAllReviews(!showAllReviews)}
                              style={{ marginTop: '8px' }}
                            >
                              {showAllReviews ? 'Show Less' : `All ${reviews.length} Reviews`}
                            </HapticButton>
                          )}
                        </div>
                      )}
                      {section === 'shipping' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <Truck style={{ width: 20, height: 20, color: mobileDesign.colors.flipkartGreen, flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: '0 0 2px' }}>
                                Free Standard Delivery
                              </p>
                              <p style={{ fontSize: '12px', color: mobileDesign.colors.textSecondary, margin: 0 }}>
                                Delivered by tomorrow if ordered within 4 hours
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <Shield style={{ width: 20, height: 20, color: mobileDesign.colors.accent, flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: '0 0 2px' }}>
                                7-Day Replacement
                              </p>
                              <p style={{ fontSize: '12px', color: mobileDesign.colors.textSecondary, margin: 0 }}>
                                Easy replacement with free pickup
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <RotateCcw style={{ width: 20, height: 20, color: mobileDesign.colors.accent, flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: '0 0 2px' }}>
                                Exchange Available
                              </p>
                              <p style={{ fontSize: '12px', color: mobileDesign.colors.textSecondary, margin: 0 }}>
                                Exchange your old device and get instant credit
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              padding: `${mobileDesign.spacing.lg}px`,
              background: 'white',
            }}
          >
            <h3 style={{
              fontSize: '14px',
              fontWeight: 700,
              color: mobileDesign.colors.textPrimary,
              margin: '0 0 12px',
            }}>
              Similar Products
            </h3>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
              {relatedProducts.map(rp => (
                <motion.a
                  key={rp.id}
                  href={`/mobile/product/${rp.slug}`}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    minWidth: '140px',
                    maxWidth: '140px',
                    background: mobileDesign.colors.surface,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1/1',
                    background: '#F8F8F8',
                  }}>
                    <Image
                      src={rp.image || '/icon.svg'}
                      alt={rp.name}
                      fill
                      sizes="140px"
                      style={{ objectFit: 'contain', padding: '8px' }}
                    />
                  </div>
                  <div style={{ padding: '8px 10px 10px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: mobileDesign.colors.textPrimary, margin: '0 0 4px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {rp.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <div style={{ padding: '1px 5px', background: mobileDesign.colors.flipkartGreen, borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{rp.rating.toFixed(1)}</span>
                        <Star style={{ width: 10, height: 10, color: 'white', fill: 'white' }} />
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: mobileDesign.colors.textPrimary, margin: 0 }}>
                      {formatINR(rp.price)}
                    </p>
                    {rp.originalPrice > rp.price && (
                      <p style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary, textDecoration: 'line-through', margin: '2px 0 0' }}>
                        {formatINR(rp.originalPrice)}
                      </p>
                    )}
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      {/* Bottom Action Bar */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: mobileDesign.zIndex.sticky,
          background: 'white',
          borderTop: `1px solid ${mobileDesign.colors.border}`,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
          padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
          paddingBottom: `calc(${mobileDesign.spacing.md}px + env(safe-area-inset-bottom, 0px))`,
          display: 'flex',
          gap: '10px',
        }}
      >
        <HapticButton
          variant="outline"
          size="lg"
          onClick={handleBuyNow}
          style={{
            flex: 1,
            background: mobileDesign.colors.flipkartYellow,
            color: mobileDesign.colors.textPrimary,
            border: 'none',
            fontWeight: 700,
          }}
        >
          <Zap style={{ width: 18, height: 18, marginRight: '6px' }} />
          BUY NOW
        </HapticButton>
        <HapticButton
          variant="primary"
          size="lg"
          onClick={handleAddToCart}
          loading={isAdding}
          style={{
            flex: 1,
            background: mobileDesign.colors.accent,
            fontWeight: 700,
          }}
        >
          <ShoppingBag style={{ width: 18, height: 18, marginRight: '6px' }} />
          ADD TO CART
        </HapticButton>
      </motion.div>

      <BottomTabNavigation currentTab="home" cartCount={cartCount} />
    </div>
  );
}
