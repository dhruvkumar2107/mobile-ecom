'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface MobileImageProps
  extends Omit<ImageProps, 'src' | 'alt' | 'onLoad' | 'placeholder' | 'blurDataURL'> {
  src: string;
  /** Empty string is correct for decorative product art next to a visible name. */
  alt: string;
  /** Fade the image in once decoded, instead of popping. */
  fadeIn?: boolean;
}

/**
 * next/image with the defaults every mobile surface wants: fills its positioned
 * parent, ships an AVIF/WebP srcset sized for phone viewports, and fades in over
 * a tinted placeholder so a slow image never flashes white.
 *
 * The parent must be `position: relative` with a resolved height (aspect-ratio
 * or explicit), because this renders with `fill`.
 */
export function MobileImage({
  src,
  alt,
  sizes = '(max-width: 480px) 50vw, 240px',
  quality = 72,
  fadeIn = true,
  className,
  style,
  ...rest
}: MobileImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      onLoad={() => setLoaded(true)}
      className={cn('mobile-image', className)}
      style={{
        objectFit: 'cover',
        backgroundColor: 'var(--mobile-color-border-light)',
        opacity: fadeIn && !loaded ? 0 : 1,
        transition: 'opacity 280ms ease-out',
        ...style,
      }}
      {...rest}
    />
  );
}
