'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  gradient?: string;
  backgroundColor?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  aspectRatio?: string;
}

export function BannerCarousel({
  banners,
  autoPlay = true,
  autoPlayInterval = 5000,
  showIndicators = true,
  showArrows = true,
  aspectRatio = '16/9',
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    if (!autoPlay || reduceMotion || banners.length <= 1) return;
    const timer = setInterval(() => {
      if (!isHovered) next();
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, reduceMotion, banners.length, isHovered, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    setTouchStart(null);
  };

  if (banners.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        borderRadius: `${mobileDesign.borderRadius.lg}px`,
        overflow: 'hidden',
        background: mobileDesign.colors.borderLight,
      }}
      role="region"
      aria-label="Featured banners"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: banners[currentIndex].backgroundColor,
            }}
            aria-hidden="true"
          >
            <Image
              src={banners[currentIndex].image}
              alt=""
              fill
              sizes="100vw"
              quality={72}
              priority={currentIndex === 0}
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          {banners[currentIndex].gradient && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: banners[currentIndex].gradient,
              }}
              aria-hidden="true"
            />
          )}

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: `${mobileDesign.spacing['2xl']}px ${mobileDesign.spacing.lg}px`,
              color: mobileDesign.colors.textInverse,
              zIndex: 1,
            }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              style={{
                fontSize: 'clamp(24px, 5vw, 36px)',
                fontWeight: 700,
                fontFamily: mobileDesign.typography.fontFamily,
                lineHeight: 1.2,
                letterSpacing: -0.5,
                marginBottom: `${mobileDesign.spacing.sm}px`,
                maxWidth: '80%',
              }}
            >
              {banners[currentIndex].title}
            </motion.h2>
            {banners[currentIndex].subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  fontWeight: 400,
                  fontFamily: mobileDesign.typography.fontFamily,
                  lineHeight: 1.5,
                  opacity: 0.95,
                  maxWidth: '70%',
                  marginBottom: `${mobileDesign.spacing.lg}px`,
                }}
              >
                {banners[currentIndex].subtitle}
              </motion.p>
            )}
            {banners[currentIndex].ctaText && (
              <motion.a
                href={banners[currentIndex].ctaHref || '#'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.xl}px`,
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.textPrimary,
                  background: mobileDesign.colors.textInverse,
                  borderRadius: `${mobileDesign.borderRadius.full}px`,
                  textDecoration: 'none',
                  boxShadow: mobileDesign.shadows.lg,
                  maxWidth: 'fit-content',
                }}
              >
                {banners[currentIndex].ctaText}
                <ChevronRight style={{ width: 18, height: 18 }} aria-hidden="true" />
              </motion.a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {showArrows && banners.length > 1 && (
        <>
          <motion.button
            onClick={prev}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              position: 'absolute',
              left: `${mobileDesign.spacing.md}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: mobileDesign.shadows.md,
              color: mobileDesign.colors.textPrimary,
              cursor: 'pointer',
              zIndex: 2,
              transition: `all ${mobileDesign.transitions.fast}`,
            }}
            aria-label="Previous banner"
          >
            <ChevronLeft style={{ width: 22, height: 22 }} aria-hidden="true" />
          </motion.button>
          <motion.button
            onClick={next}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              position: 'absolute',
              right: `${mobileDesign.spacing.md}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: mobileDesign.shadows.md,
              color: mobileDesign.colors.textPrimary,
              cursor: 'pointer',
              zIndex: 2,
              transition: `all ${mobileDesign.transitions.fast}`,
            }}
            aria-label="Next banner"
          >
            <ChevronRight style={{ width: 22, height: 22 }} aria-hidden="true" />
          </motion.button>
        </>
      )}

      {showIndicators && banners.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: `${mobileDesign.spacing.md}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            zIndex: 2,
          }}
          role="tablist"
          aria-label="Banner navigation"
        >
          {banners.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goTo(index)}
              whileTap={{ scale: 1.2 }}
              style={{
                width: index === currentIndex ? '24px' : '8px',
                height: '8px',
                border: 'none',
                borderRadius: '4px',
                background: index === currentIndex
                  ? mobileDesign.colors.textInverse
                  : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                transition: `all ${mobileDesign.transitions.fast}`,
              }}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const defaultBanners: Banner[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
    title: 'Latest Flagship Drop',
    subtitle: 'Experience the future of mobile technology',
    ctaText: 'Shop Now',
    ctaHref: '/mobile/category/smartphones',
    gradient: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 100%)',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    title: 'Premium Audio Collection',
    subtitle: 'Immersive sound for every moment',
    ctaText: 'Explore Audio',
    ctaHref: '/mobile/category/audio',
    gradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.85) 0%, rgba(124, 45, 18, 0.7) 100%)',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    title: 'Smart Wearables Sale',
    subtitle: 'Track your fitness in style - up to 40% off',
    ctaText: 'View Deals',
    ctaHref: '/mobile/category/wearables',
    gradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.85) 0%, rgba(4, 120, 87, 0.7) 100%)',
  },
];