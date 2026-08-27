'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ShoppingBag, Tag } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { MobileImage } from './MobileImage';
import { formatINR } from '@/lib/money';
import { cn } from '@/lib/utils';

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
  /** Skip lazy-loading for above-the-fold tiles so the LCP image starts immediately. */
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
        flexDirection: 'column',
        background: mobileDesign.colors.surface,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        boxShadow: isPressed ? mobileDesign.shadows.xs : mobileDesign.shadows.sm,
        overflow: 'hidden',
        cursor: onPress ? 'pointer' : 'default',
        transition: `box-shadow ${mobileDesign.transitions.fast}, transform ${mobileDesign.transitions.fast}`,
        width: '100%',
        maxWidth: '180px',
        flexShrink: 0,
      }}
      tabIndex={onPress ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onPress?.()}
      role={onPress ? 'button' : 'article'}
      aria-label={`${name}${brand ? ` by ${brand}` : ''}, ${formatINR(price)}${hasDiscount ? `, was ${formatINR(originalPrice!)}` : ''}${computedDiscount ? `, ${computedDiscount}% off` : ''}`}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio,
          background: mobileDesign.colors.borderLight,
          overflow: 'hidden',
        }}
      >
        {/* The zoom lives on a wrapper so the image itself can be a `fill`
            next/image and still get an AVIF/WebP srcset. */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <MobileImage
            src={image}
            alt=""
            sizes="(max-width: 480px) 45vw, 180px"
            // Above-the-fold tiles are the LCP candidate on the home grid.
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            fallbackSrc="/icon.svg"
          />
        </motion.div>

        <AnimatePresence>
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              style={{
                position: 'absolute',
                top: `${mobileDesign.spacing.sm}px`,
                left: `${mobileDesign.spacing.sm}px`,
                padding: `${mobileDesign.spacing.xs}px ${mobileDesign.spacing.sm}px`,
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: mobileDesign.typography.fontFamily,
                lineHeight: 1,
                letterSpacing: 0.5,
                textTransform: 'uppercase' as const,
                color: mobileDesign.colors.textInverse,
                background: mobileDesign.colors.accent,
                borderRadius: `${mobileDesign.borderRadius.sm}px`,
                boxShadow: mobileDesign.shadows.md,
                zIndex: 1,
              }}
            >
              {badge}
            </motion.div>
          )}

          {hasDiscount && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'absolute',
                top: `${mobileDesign.spacing.sm}px`,
                right: `${mobileDesign.spacing.sm}px`,
                padding: `${mobileDesign.spacing.xs}px ${mobileDesign.spacing.sm}px`,
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: mobileDesign.typography.fontFamily,
                lineHeight: 1,
                color: mobileDesign.colors.textInverse,
                background: mobileDesign.colors.error,
                borderRadius: `${mobileDesign.borderRadius.sm}px`,
                boxShadow: mobileDesign.shadows.md,
                zIndex: 1,
              }}
            >
              {computedDiscount}% OFF
            </motion.div>
          )}

          <motion.button
            onClick={handleWishlistClick}
            whileTap={{ scale: 1.1 }}
            style={{
              position: 'absolute',
              top: `${mobileDesign.spacing.sm}px`,
              right: hasDiscount ? `${mobileDesign.spacing.sm + 60}px` : `${mobileDesign.spacing.sm}px`,
              width: `${mobileDesign.touchTarget}px`,
              height: `${mobileDesign.touchTarget}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: mobileDesign.shadows.md,
              color: isInWishlist ? mobileDesign.colors.error : mobileDesign.colors.textSecondary,
              cursor: 'pointer',
              zIndex: 1,
              transition: `all ${mobileDesign.transitions.fast}`,
            }}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isInWishlist}
          >
            <AnimatePresence mode="wait">
              {isInWishlist ? (
                <motion.span
                  key="filled"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <Heart
                    className="fill-current"
                    style={{ width: 20, height: 20, strokeWidth: 0 }}
                    aria-hidden="true"
                  />
                </motion.span>
              ) : (
                <motion.span
                  key="outline"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <Heart
                    style={{ width: 20, height: 20, strokeWidth: 2 }}
                    aria-hidden="true"
                  />
                </motion.span>
              )}
            </AnimatePresence>
            {wishlistAnim && (
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 300 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: isInWishlist ? 'transparent' : mobileDesign.colors.accentLight,
                  pointerEvents: 'none',
                }}
              />
            )}
          </motion.button>

          {!inStock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.lg}px`,
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.error,
                  background: mobileDesign.colors.errorLight,
                  borderRadius: `${mobileDesign.borderRadius.full}px`,
                }}
              >
                Out of Stock
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          padding: `${mobileDesign.spacing.md}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: `${mobileDesign.spacing.xs}px`,
          flex: 1,
        }}
      >
        {brand && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              fontFamily: mobileDesign.typography.fontFamily,
              color: mobileDesign.colors.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {brand}
          </span>
        )}

        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: mobileDesign.typography.fontFamily,
            lineHeight: 1.3,
            color: mobileDesign.colors.textPrimary,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: `${mobileDesign.spacing.xs}px` }}>
          <motion.span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: mobileDesign.typography.fontFamily,
              color: mobileDesign.colors.textPrimary,
            }}
          >
            {formatINR(price)}
          </motion.span>

          {hasDiscount && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: '13px',
                fontWeight: 400,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textTertiary,
                textDecoration: 'line-through',
              }}
            >
              {formatINR(originalPrice!)}
            </motion.span>
          )}
        </div>

        {rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: `${mobileDesign.spacing.xs}px` }}>
            <Star
              className="fill-current"
              style={{ width: 14, height: 14, color: '#FBBF24' }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textSecondary,
              }}
            >
              {rating.toFixed(1)}
            </span>
            {reviewCount > 0 && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 400,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.textTertiary,
                }}
              >
                ({reviewCount})
              </span>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export function ProductCardHorizontal({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  rating = 4.5,
  reviewCount = 0,
  onPress,
  onWishlistToggle,
  isInWishlist = false,
}: ProductCardProps) {
  return (
    <motion.article
      onClick={onPress}
      whileTap={{ scale: 0.99 }}
      style={{
        display: 'flex',
        flexDirection: 'row',
        background: mobileDesign.colors.surface,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        boxShadow: mobileDesign.shadows.sm,
        overflow: 'hidden',
        cursor: onPress ? 'pointer' : 'default',
        width: '100%',
        minWidth: '280px',
        maxWidth: '320px',
        flexShrink: 0,
      }}
      tabIndex={onPress ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onPress?.()}
      role={onPress ? 'button' : 'article'}
    >
      <div style={{ position: 'relative', width: '100px', flexShrink: 0, aspectRatio: '1/1' }}>
        <MobileImage src={image} alt="" sizes="100px" fallbackSrc="/icon.svg" />
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onWishlistToggle?.(id);
          }}
          whileTap={{ scale: 1.1 }}
          style={{
            position: 'absolute',
            top: `${mobileDesign.spacing.sm}px`,
            right: `${mobileDesign.spacing.sm}px`,
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: mobileDesign.shadows.md,
            color: isInWishlist ? mobileDesign.colors.error : mobileDesign.colors.textSecondary,
            cursor: 'pointer',
          }}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isInWishlist ? (
            <Heart className="fill-current" style={{ width: 18, height: 18 }} aria-hidden="true" />
          ) : (
            <Heart style={{ width: 18, height: 18, strokeWidth: 2 }} aria-hidden="true" />
          )}
        </motion.button>
      </div>

      <div
        style={{
          padding: `${mobileDesign.spacing.md}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          minWidth: 0,
        }}
      >
        <div>
          {brand && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                fontFamily: mobileDesign.typography.fontFamily,
                color: mobileDesign.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {brand}
            </span>
          )}
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: mobileDesign.typography.fontFamily,
              lineHeight: 1.3,
              color: mobileDesign.colors.textPrimary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginTop: '4px',
            }}
          >
            {name}
          </h3>
          {rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
              <Star className="fill-current" style={{ width: 13, height: 13, color: '#FBBF24' }} aria-hidden="true" />
              <span style={{ fontSize: '12px', fontWeight: 500, color: mobileDesign.colors.textSecondary }}>
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: mobileDesign.colors.textPrimary }}>
            {formatINR(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary, textDecoration: 'line-through' }}>
              {formatINR(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}