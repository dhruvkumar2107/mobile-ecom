'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
import { useEffect, useState } from 'react';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'full';
}

export function WishlistButton({
  productId,
  className,
  size = 'md',
  variant = 'icon',
}: WishlistButtonProps) {
  const { toggleItem, isInWishlist, hasHydrated } = useWishlist();
  const [isClient, setIsClient] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const inWishlist = isClient && hasHydrated ? isInWishlist(productId) : false;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAnimating(true);
    await toggleItem(productId);
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
  };

  const iconSizes = {
    sm: 'size-3.5',
    md: 'size-4',
    lg: 'size-5',
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all',
          'border border-ink-8 hover:border-volt-400',
          inWishlist
            ? 'bg-volt-400/10 text-volt-400 border-volt-400'
            : 'bg-void text-ink hover:bg-void-lighter',
          isAnimating && 'scale-95',
          className
        )}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        disabled={!hasHydrated}
      >
        <Heart
          className={cn(
            iconSizes[size],
            'transition-all',
            inWishlist && 'fill-current',
            isAnimating && 'scale-125'
          )}
        />
        {inWishlist ? 'Saved' : 'Save for later'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded-full flex items-center justify-center transition-all',
        'backdrop-blur-sm',
        inWishlist
          ? 'bg-volt-400/20 text-volt-400 hover:bg-volt-400/30'
          : 'bg-void/60 text-ink-3 hover:bg-void/80 hover:text-ink',
        isAnimating && 'scale-110',
        sizeClasses[size],
        className
      )}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      disabled={!hasHydrated}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-all',
          inWishlist && 'fill-current',
          isAnimating && 'scale-125'
        )}
      />
    </button>
  );
}
