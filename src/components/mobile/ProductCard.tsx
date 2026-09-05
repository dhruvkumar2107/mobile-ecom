'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Star, ShoppingCart, Share2, Eye } from 'lucide-react';
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
  onQuickView?: (id: string) => void;
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
  onQuickView,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const discount = discountPercent || (originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0);

  const formatReviewCount = (count: number) => {
    if (count >= 100000) return `${(count / 100000).toFixed(1)}L`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: name,
        text: `Check out ${name} at ${formatINR(price)}`,
        url: window.location.href,
      });
    }
  }, [name, price]);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -2 }}
      onClick={onPress}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        background: mobileDesign.colors.surface,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: onPress ? 'pointer' : 'default',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease',
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
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }} />
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

        {/* Discount Badge - Flipkart Green Style */}
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
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}>
            <Zap style={{ width: 10, height: 10 }} />
            {discount}% off
          </div>
        )}

        {/* Badge */}
        {badge && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            padding: '3px 8px',
            background: mobileDesign.colors.flipkartOrange,
            color: 'white',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: mobileDesign.typography.fontFamily,
            textTransform: 'uppercase',
          }}>
            {badge}
          </div>
        )}

        {/* Wishlist Button - Flipkart Style */}
        <motion.button
          whileTap={{ scale: 1.3 }}
          onClick={(e) => {
            e.stopPropagation();
            onWishlistToggle?.(id);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: badge ? 'auto' : '8px',
            left: badge ? '8px' : 'auto',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(4px)',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            style={{
              width: 18,
              height: 18,
              color: isInWishlist ? mobileDesign.colors.flipkartRed : mobileDesign.colors.textTertiary,
              fill: isInWishlist ? mobileDesign.colors.flipkartRed : 'none',
              transition: 'all 0.2s ease',
            }}
          />
        </motion.button>

        {/* Quick Actions on Hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            right: '8px',
            display: 'flex',
            gap: '6px',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(id);
            }}
            style={{
              flex: 1,
              padding: '6px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: mobileDesign.colors.textPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Eye style={{ width: 14, height: 14 }} />
            Quick View
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: mobileDesign.colors.textPrimary,
            }}
          >
            <Share2 style={{ width: 14, height: 14 }} />
          </motion.button>
        </motion.div>

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: mobileDesign.colors.error,
              background: mobileDesign.colors.errorLight,
              padding: '4px 12px',
              borderRadius: '4px',
              border: `1px solid ${mobileDesign.colors.error}`,
            }}>
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* Product Info - Flipkart Style */}
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

        {/* Rating - Flipkart Green Badge Style */}
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

        {/* Price - Flipkart Style */}
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
          {discount > 0 && (
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: mobileDesign.colors.flipkartGreen,
            }}>
              {discount}% off
            </span>
          )}
        </div>

        {/* Delivery Info - Flipkart Style */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '6px',
          padding: '4px 0',
        }}>
          <span style={{
            fontSize: '11px',
            color: mobileDesign.colors.flipkartGreen,
            fontWeight: 600,
          }}>
            Free Delivery
          </span>
        </div>
      </div>
    </motion.div>
  );
}
