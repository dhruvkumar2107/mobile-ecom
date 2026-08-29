'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';
import { mobileDesign } from '@/lib/mobile-design';
import { BottomTabNavigation } from './BottomTabNavigation';
import { ToastContainer, ToastProps } from './Modal';
import { cn } from '@/lib/utils';

export interface MobileLayoutProps {
  children: ReactNode;
  currentTab?: string;
  cartCount?: number;
  showBottomNav?: boolean;
  hideBottomNavOnScroll?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface ToastState {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  removeToast: (id: string) => void;
}

const toastStore: ToastState = {
  toasts: [],
  addToast: () => '',
  removeToast: () => {},
};

export function MobileLayout({
  children,
  currentTab = 'home',
  cartCount = 0,
  showBottomNav = true,
  hideBottomNavOnScroll = false,
  className,
  style,
}: MobileLayoutProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    toastStore.toasts = toasts;
    toastStore.addToast = (toast) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { ...toast, id, onClose: removeToast }]);
      return id;
    };
    toastStore.removeToast = removeToast;
  }, [toasts]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 10);
      if (hideBottomNavOnScroll) {
        setShowNav(scrollY < 100 || scrollY < window.innerHeight);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hideBottomNavOnScroll]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: mobileDesign.colors.background,
        fontFamily: mobileDesign.typography.fontFamily,
        paddingBottom: showBottomNav && showNav
          ? `${mobileDesign.touchTarget + mobileDesign.spacing['3xl']}px`
          : `${mobileDesign.spacing['2xl']}px`,
        ...style,
      }}
      className={cn('mobile-layout', className)}
    >
      <div
        style={{
          position: 'relative',
          zIndex: mobileDesign.zIndex.base,
          minHeight: '100%',
        }}
      >
        {children}
      </div>

      {showBottomNav && showNav && (
        <BottomTabNavigation currentTab={currentTab} cartCount={cartCount} />
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} position="bottom-center" />
    </div>
  );
}

export function useToast() {
  return {
    toast: toastStore.addToast,
    dismiss: toastStore.removeToast,
  };
}

export function useMobileSafeArea() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      setInsets({
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10),
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-left)') || '0', 10),
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-right)') || '0', 10),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
}

export interface StickyHeaderProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  transparent?: boolean;
  blur?: boolean;
}

export function StickyHeader({ children, className, style, transparent = false, blur = true }: StickyHeaderProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: mobileDesign.zIndex.sticky,
        background: transparent ? 'transparent' : 'rgba(250, 250, 250, 0.95)',
        backdropFilter: blur ? 'blur(20px)' : 'none',
        borderBottom: transparent ? 'none' : `1px solid ${mobileDesign.colors.borderLight}`,
        ...style,
      }}
      className={cn('mobile-sticky-header', className)}
    >
      {children}
    </div>
  );
}

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function PullToRefresh({ onRefresh, children, threshold = 80, className, style }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;
    setIsPulling(false);
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      className={cn('mobile-pull-to-refresh', className)}
    >
      <div
        style={{
          position: 'absolute',
          top: -pullDistance,
          left: 0,
          right: 0,
          height: pullDistance,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: `${mobileDesign.spacing.md}px`,
          pointerEvents: 'none',
          zIndex: mobileDesign.zIndex.sticky - 1,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: `3px solid ${mobileDesign.colors.border}`,
            borderTopColor: mobileDesign.colors.accent,
            opacity: Math.min(pullDistance / threshold, 1),
            transform: `rotate(${pullDistance / threshold * 360}deg)`,
            transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
          }}
        />
      </div>
      <div style={{ transform: `translateY(${isPulling ? pullDistance : 0}px)`, transition: 'transform 0.3s ease-out' }}>
        {children}
      </div>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function VirtualList<T>({ items, itemHeight, renderItem, overscan = 5, className, style }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    const measure = () => setViewportHeight(window.innerHeight);
    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, []);

  const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
      className={cn('mobile-virtual-list', className)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            left: 0,
            right: 0,
          }}
        >
          {items.slice(startIndex, endIndex).map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}