'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
const names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Neha', 'Arjun', 'Pooja', 'Rohan', 'Ananya', 'Karthik', 'Meera', 'Aditya', 'Divya', 'Sanjay'];
const products = [
  { name: 'iPhone 15 Pro Max', brand: 'Apple' },
  { name: 'Galaxy S24 Ultra', brand: 'Samsung' },
  { name: 'OnePlus 12', brand: 'OnePlus' },
  { name: 'MacBook Air M3', brand: 'Apple' },
  { name: 'Sony WH-1000XM5', brand: 'Sony' },
  { name: 'iPad Pro M4', brand: 'Apple' },
  { name: 'Pixel 8 Pro', brand: 'Google' },
  { name: 'AirPods Pro 2', brand: 'Apple' },
  { name: 'Galaxy Watch 6', brand: 'Samsung' },
  { name: 'Nothing Phone 2', brand: 'Nothing' },
];

function generatePurchase() {
  return {
    name: names[Math.floor(Math.random() * names.length)],
    city: cities[Math.floor(Math.random() * cities.length)],
    product: products[Math.floor(Math.random() * products.length)],
    minutesAgo: Math.floor(Math.random() * 30) + 1,
  };
}

export function SocialProofPopup() {
  const [notification, setNotification] = useState<ReturnType<typeof generatePurchase> | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showNotification = useCallback(() => {
    const purchase = generatePurchase();
    setNotification(purchase);
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const firstDelay = setTimeout(showNotification, 4000 + Math.random() * 6000);
    const interval = setInterval(showNotification, 15000 + Math.random() * 20000);
    return () => {
      clearTimeout(firstDelay);
      clearInterval(interval);
    };
  }, [showNotification, mounted]);

  return (
    <AnimatePresence>
      {visible && notification && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="fixed bottom-28 left-4 z-40 max-w-xs"
        >
          <div className="rounded-xl border border-line/30 bg-panel/85 backdrop-blur-xl p-3 shadow-xl shadow-black/30">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-full bg-volt-500/15 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="size-4 text-volt-400">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-3">
                  <span className="font-medium text-ink">{notification.name}</span> from{' '}
                  <span className="font-medium text-ink">{notification.city}</span>
                </p>
                <p className="text-xs text-ink-2 mt-0.5 truncate">
                  Just bought {notification.product.name}
                </p>
                <p className="text-[10px] text-ink-4 mt-1">
                  {notification.minutesAgo} min ago
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function UrgencyIndicator({ stockLeft }: { stockLeft: number }) {
  if (stockLeft > 10) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 text-[11px] text-bad-400"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bad-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-bad-400" />
      </span>
      Only {stockLeft} left — selling fast
    </motion.div>
  );
}

export function ViewerCount({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1.5 text-[11px] text-ink-3"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-good-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-good-400" />
      </span>
      {count} people viewing this right now
    </motion.div>
  );
}
