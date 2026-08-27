'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { mobileDesign } from '@/lib/mobile-design';
import { AIChat } from './AIChat';

/**
 * Client shell for every /mobile route.
 *
 * Three jobs the server layout can't do:
 *  - flip the document off the desktop dark theme while a mobile route is mounted
 *  - restore scroll to the top on forward navigation (Next keeps position otherwise)
 *  - run the shared enter/exit transition between screens
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const previousPath = useRef<string | null>(null);

  // The desktop site hard-codes `dark` on <html>; the mobile app is a light surface.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    root.classList.add('mobile-app');
    root.style.colorScheme = 'light';

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      if (hadDark) root.classList.add('dark');
      root.classList.remove('mobile-app');
      root.style.colorScheme = '';
    };
  }, []);

  // Land at the top of a newly pushed screen, but leave the first paint alone.
  useEffect(() => {
    if (previousPath.current !== null && previousPath.current !== pathname) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    previousPath.current = pathname;
  }, [pathname]);

  return (
    <div
      className="mobile-root"
      style={{
        minHeight: '100dvh',
        background: mobileDesign.colors.background,
        color: mobileDesign.colors.textPrimary,
        fontFamily: mobileDesign.typography.fontFamily,
        overscrollBehaviorY: 'none',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={pathname}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          style={{ minHeight: '100dvh' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <AIChat />
    </div>
  );
}
