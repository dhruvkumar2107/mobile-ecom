'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useConfetti() {
  const confettiRef = useRef<typeof import('canvas-confetti') | null>(null);

  useEffect(() => {
    import('canvas-confetti').then((mod) => {
      confettiRef.current = mod.default;
    });
  }, []);

  const fire = useCallback((options?: { spread?: number; duration?: number; particleCount?: number }) => {
    if (!confettiRef.current) return;
    const confetti = confettiRef.current;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    confetti({ ...defaults, particleCount: 40, origin: { x: 0.3, y: 0.6 }, colors: ['#22d3ee', '#8b5cf6', '#10b981'] });
    confetti({ ...defaults, particleCount: 40, origin: { x: 0.7, y: 0.6 }, colors: ['#22d3ee', '#8b5cf6', '#10b981'] });

    setTimeout(() => {
      confetti({ ...defaults, particleCount: 80, origin: { x: 0.5, y: 0.5 }, colors: ['#22d3ee', '#8b5cf6', '#10b981', '#fbbf24'] });
    }, 200);
  }, []);

  return fire;
}

export function ConfettiOnMount({ delay = 300 }: { delay?: number }) {
  const fire = useConfetti();

  useEffect(() => {
    const t = setTimeout(fire, delay);
    return () => clearTimeout(t);
  }, [fire, delay]);

  return null;
}
