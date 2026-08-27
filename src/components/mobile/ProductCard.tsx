'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ShoppingBag, Tag } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from './MobileImage';
import { formatINR } from '@/lib/money';

export interface ProductCardProps {
  id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  discountPercent?: number;
  inStock?: boolean;
  onPress?: () => void;
  onWishlistToggle?: (id: string) => void;
  isInWishlist?: boolean;
  aspectRatio?: string;
  priority?: boolean;
}

export function ProductCard({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  rating = 4.5,
  reviewCount = 0,
  badge,
  discountPercent,
  inStock = true,
  onPress,
  onWishlistToggle,
  isInWishlist = false,
  aspectRatio = '1/1',
  priority = false,
}: ProductCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [wishlistAnim, setWishlistAnim] = useState(false);

  const handleWishlistClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setWishlistAnim(true);
      onWishlistToggle?.(id);
      setTimeout(() => setWishlistAnim(false), 400);
    },
    [id, onWishlistToggle]
  );

  const hasDiscount = originalPrice && originalPrice > price;
  const computedDiscount = discountPercent ?? (hasDiscount ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : 0);

  return (
    <motion.article
      onClick={onPress}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex',
        flexDirection: 'row',
        background: mobileDesign.colors.surface,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        boxShadow: isPressed ? mobileDesign.shadows.xs : mobileDesign.shadows.sm,
        overflow: 'hidden',
        cursor: onPress ? 'pointer' : 'default',
        transition: `box-shadow ${mobileDesign.transitions.fast}, transform ${mobileDesign.transitions.fast}`,
        width: '100%',
      }}
      tabIndex={onPress ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onPress?.()}
      role={onPress ? 'button' : 'article'}
      aria-label={`${name}${brand ? ` by ${brand}` : ''}, ${formatINR(price)}${hasDiscount ? `, was ${formatINR(originalPrice!)}` : ''}${computedDiscount ? `, ${computedDiscount}% off` : ''}`}
    >
      {/* Image - compact square */}
      <div
        style={{
          position: 'relative',
          width: '100px',
          minWidth: '100px',
          aspectRatio: '1/1',
          background: mobileDesign.colors.borderLight,
          overflow: 'hidden',
        }}
      >
        <motion.div
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <MobileImage
            src={image}
            alt=""
            sizes="100px"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            fallbackSrc="/icon.svg"
          />
        </motion.div>

        {/* Discount badge */}
        {hasDiscount && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: mobileDesign.typography.fontFamily,
              lineHeight: 1,
              color: mobileDesign.colors.textInverse,
              background: mobileDesign.colors.error,
              borderRadius: `${mobileDesign.borderRadius.sm}px`,
              zIndex: 1,
            }}
          >
            {computedDiscount}% OFF
          </div>
        )}

        {/* Wishlist */}
        <motion.button
          onClick={handleWishlistClick}
          whileTap={{ scale: 1.2 }}
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            cursor: 'pointer',
            zIndex: 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            style={{
              width: '14px',
              height: '14px',
              color: isInWishlist ? mobileDesign.colors.error : mobileDesign.colors.textTertiary,
              fill: isInWishlist ? mobileDesign.colors.error : 'none',
              transform: wishlistAnim ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.2s ease',
            }}
          />
        </motion.button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: `${mobileDesign.spacing.md}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <div>
          {/* Brand */}
          {brand && (
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: mobileDesign.colors.accent,
                margin: 0,
                fontFamily: mobileDesign.typography.fontFamily,
              }}
            >
              {brand}
            </p>
          )}

          {/* Name */}
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              color: mobileDesign.colors.textPrimary,
              margin: '2px 0 0',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {name}
          </h3>

          {/* Rating */}
          {rating > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: mobileDesign.colors.warning + '20',
                }}
              >
                <Star
                  style={{
                    width: '10px',
                    height: '10px',
                    fill: mobileDesign.colors.warning,
                    color: mobileDesign.colors.warning,
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: mobileDesign.colors.warning,
                    fontFamily: mobileDesign.typography.fontFamily,
                  }}
                >
                  {rating.toFixed(1)}
                </span>
              </div>
              {reviewCount > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    color: mobileDesign.colors.textTertiary,
                    fontFamily: mobileDesign.typography.fontFamily,
                  }}
                >
                  ({reviewCount > 999 ? `${(reviewCount / 1000).toFixed(1)}k` : reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div style={{ marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textPrimary,
              }}
            >
              {formatINR(price)}
            </span>
            {hasDiscount && (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.textTertiary,
                  textDecoration: 'line-through',
                }}
              >
                {formatINR(originalPrice!)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
