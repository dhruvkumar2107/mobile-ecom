'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CartCount({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const updateCount = async () => {
      try {
        const res = await fetch('/api/cart/count');
        if (res.ok) {
          const data = await res.json();
          const newCount = data.count ?? 0;
          if (newCount !== count) {
            setCount(newCount);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 300);
          }
        }
      } catch {
        // Fail silently
      }
    };

    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Poll every 30 seconds as fallback
    const interval = setInterval(updateCount, 30000);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(interval);
    };
  }, [count]);

  return (
    <Link
      href="/cart"
      className="relative p-2 text-ink-3 hover:text-ink transition-colors rounded-lg hover:bg-panel-2"
      aria-label={`Cart (${count} items)`}
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-semibold text-void bg-volt-400 rounded-full transition-transform',
            isAnimating && 'scale-125'
          )}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
