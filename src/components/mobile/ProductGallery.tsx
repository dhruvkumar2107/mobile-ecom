'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';

export interface ProductGalleryProps {
  images: string[];
  alt: string;
  /** Fires when the hero image is tapped, for the full-screen viewer. */
  onExpand?: (index: number) => void;
  index?: number;
  onIndexChange?: (index: number) => void;
}

/** Past this much horizontal travel (or flick velocity) a drag commits to a slide. */
const COMMIT_DISTANCE = 55;
const COMMIT_VELOCITY = 420;

/**
 * Swipeable product gallery.
 *
 * Slides are absolutely stacked and cross-faded on a directional x-offset, so
 * only the active frame is laid out — cheaper than a translating strip of N
 * full-bleed images, and it lets `priority` load just the first frame.
 */
export function ProductGallery({
  images,
  alt,
  onExpand,
  index: controlledIndex,
  onIndexChange,
}: ProductGalleryProps) {
  const [uncontrolled, setUncontrolled] = useState(0);
  const [direction, setDirection] = useState(0);
  const reduceMotion = useReducedMotion();
  const dragged = useRef(false);

  const index = controlledIndex ?? uncontrolled;
  const count = images.length;

  const goTo = useCallback(
    (next: number, dir: number) => {
      const wrapped = ((next % count) + count) % count;
      setDirection(dir);
      setUncontrolled(wrapped);
      onIndexChange?.(wrapped);
    },
    [count, onIndexChange]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;
      const commit =
        Math.abs(offset.x) > COMMIT_DISTANCE || Math.abs(velocity.x) > COMMIT_VELOCITY;
      if (!commit) {
        dragged.current = false;
        return;
      }
      dragged.current = true;
      goTo(index + (offset.x < 0 ? 1 : -1), offset.x < 0 ? 1 : -1);
      // Let the click that follows the drag be swallowed, not treated as a tap.
      window.setTimeout(() => {
        dragged.current = false;
      }, 60);
    },
    [goTo, index]
  );

  const slide = {
    enter: (dir: number) => ({ x: reduceMotion ? 0 : dir > 0 ? '55%' : '-55%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: reduceMotion ? 0 : dir > 0 ? '-55%' : '55%', opacity: 0 }),
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`${alt} images`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1/1',
        background: mobileDesign.colors.borderLight,
        overflow: 'hidden',
        touchAction: 'pan-y',
      }}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={index}
          custom={direction}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 320, damping: 34, mass: 0.8 },
            opacity: { duration: 0.18 },
          }}
          drag={count > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (!dragged.current) onExpand?.(index);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: onExpand ? 'zoom-in' : 'grab',
          }}
        >
          <Image
            src={images[index]}
            alt={index === 0 ? alt : `${alt} — view ${index + 1}`}
            fill
            sizes="100vw"
            quality={80}
            // The hero image is the LCP element on this screen.
            priority={index === 0}
            draggable={false}
            style={{ objectFit: 'cover', pointerEvents: 'none' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Preload the neighbouring frames so a swipe never lands on a blank slide. */}
      <div aria-hidden="true" style={{ display: 'none' }}>
        {[index + 1, index - 1].map((i) => {
          const wrapped = ((i % count) + count) % count;
          return (
            <Image
              key={`preload-${wrapped}`}
              src={images[wrapped]}
              alt=""
              width={16}
              height={16}
              sizes="100vw"
              quality={80}
            />
          );
        })}
      </div>

      {onExpand && (
        <button
          onClick={() => onExpand(index)}
          aria-label="View full screen"
          style={{
            position: 'absolute',
            top: `${mobileDesign.spacing.md}px`,
            right: `${mobileDesign.spacing.md}px`,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: mobileDesign.shadows.sm,
            color: mobileDesign.colors.textPrimary,
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          <Expand style={{ width: 17, height: 17 }} aria-hidden="true" />
        </button>
      )}

      {count > 1 && (
        <>
          <GalleryArrow side="left" onClick={() => goTo(index - 1, -1)} />
          <GalleryArrow side="right" onClick={() => goTo(index + 1, 1)} />

          <div
            style={{
              position: 'absolute',
              bottom: `${mobileDesign.spacing.md}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              borderRadius: mobileDesign.borderRadius.full,
              background: 'rgba(17, 24, 39, 0.32)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 2,
            }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                aria-label={`View image ${i + 1} of ${count}`}
                aria-current={i === index ? 'true' : undefined}
                style={{
                  width: i === index ? 20 : 7,
                  height: 7,
                  padding: 0,
                  border: 'none',
                  borderRadius: 4,
                  background:
                    i === index ? mobileDesign.colors.textInverse : 'rgba(255, 255, 255, 0.55)',
                  cursor: 'pointer',
                  transition: `width ${mobileDesign.transitions.spring}, background ${mobileDesign.transitions.fast}`,
                }}
              />
            ))}
          </div>
        </>
      )}

      <span aria-live="polite" className="sr-only" style={srOnly}>
        Image {index + 1} of {count}
      </span>
    </div>
  );
}

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function GalleryArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      style={{
        position: 'absolute',
        [side]: `${mobileDesign.spacing.md}px`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 38,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: mobileDesign.shadows.sm,
        color: mobileDesign.colors.textPrimary,
        cursor: 'pointer',
        zIndex: 2,
      }}
    >
      <Icon style={{ width: 19, height: 19 }} aria-hidden="true" />
    </motion.button>
  );
}
