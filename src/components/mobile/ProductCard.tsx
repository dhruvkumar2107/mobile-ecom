'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
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
  slug?: string;
  onPress?: () => void;
  onWishlistToggle?: (id: string) => void;
  isInWishlist?: boolean;
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
  priority = false,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const discount = discountPercent || (originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0);

  const formatReviewCount = (count: number) => {
    if (count >= 100000) return `${(count / 100000).toFixed(1)}L`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      style={{
        background: mobileDesign.colors.surface,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: onPress ? 'pointer' : 'default',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1/1',
        background: '#F8F8F8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {!imgLoaded && !imgError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: '#F0F0F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #E0E0E0',
              borderTopColor: mobileDesign.colors.accent,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        )}
        <Image
          src={imgError ? '/icon.svg' : image}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          quality={75}
          priority={priority}
          style={{
            objectFit: 'contain',
            padding: '12px',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            padding: '3px 8px',
            background: mobileDesign.colors.flipkartGreen,
            color: 'white',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: mobileDesign.typography.fontFamily,
          }}>
            {discount}% off
          </div>
        )}

        {/* Wishlist Button */}
        <motion.button
          whileTap={{ scale: 1.2 }}
          onClick={(e) => {
            e.stopPropagation();
            onWishlistToggle?.(id);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(4px)',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            style={{
              width: 18,
              height: 18,
              color: isInWishlist ? mobileDesign.colors.flipkartRed : mobileDesign.colors.textTertiary,
              fill: isInWishlist ? mobileDesign.colors.flipkartRed : 'none',
            }}
          />
        </motion.button>
      </div>

      {/* Product Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        {brand && (
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: mobileDesign.colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            margin: '0 0 4px',
          }}>
            {brand}
          </p>
        )}
        <h3 style={{
          fontSize: '13px',
          fontWeight: 600,
          color: mobileDesign.colors.textPrimary,
          margin: '0 0 6px',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '34px',
        }}>
          {name}
        </h3>

        {/* Rating */}
        {rating > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '6px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 6px',
              background: mobileDesign.colors.flipkartGreen,
              borderRadius: '4px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>
                {rating.toFixed(1)}
              </span>
              <Star style={{ width: 12, height: 12, color: 'white', fill: 'white' }} />
            </div>
            {reviewCount > 0 && (
              <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary }}>
                ({formatReviewCount(reviewCount)})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '16px',
            fontWeight: 700,
            color: mobileDesign.colors.textPrimary,
            fontFamily: mobileDesign.typography.fontFamily,
          }}>
            {formatINR(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span style={{
              fontSize: '13px',
              color: mobileDesign.colors.textTertiary,
              textDecoration: 'line-through',
            }}>
              {formatINR(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
