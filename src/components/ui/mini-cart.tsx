'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/cart';
import { formatINR } from '@/lib/money';
import { ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export function MiniCartBar() {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const items = useCartStore((s) => s.items);
  const validItems = Array.isArray(items) ? items.filter((i) => i && typeof i.price === 'number') : [];
  const totalItems = validItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const totalPrice = validItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);

  if (!hydrated || totalItems === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
    >
      <div className="mx-auto max-w-5xl">
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="rounded-2xl border border-line/50 bg-panel/90 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-line/30">
                <span className="text-sm font-medium text-ink">Your Cart ({totalItems} items)</span>
                <button onClick={() => setExpanded(false)} className="p-1 rounded-lg hover:bg-panel-2 text-ink-3 transition-colors" aria-label="Collapse cart">
                  <X className="size-4" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto p-4 space-y-3">
                {validItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="size-12 rounded-lg bg-panel-2 overflow-hidden shrink-0">
                      <img src={item.image || '/icon.svg'} alt={item.name || ''} className="size-full object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{item.name}</p>
                      <p className="text-xs text-ink-3">{formatINR(item.price)}</p>
                    </div>
                    <span className="w-6 text-center text-xs font-medium text-ink tabular-nums">{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-line/30 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Total</span>
                  <span className="font-semibold text-ink tabular-nums">{formatINR(totalPrice)}</span>
                </div>
                <Link
                  href="/cart"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-volt-500 text-void font-semibold text-sm hover:bg-volt-400 transition-colors"
                >
                  View Cart & Checkout
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="bar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={() => setExpanded(true)}
              className="flex items-center justify-between w-full rounded-2xl border border-line/50 bg-panel/90 backdrop-blur-xl px-4 py-3 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="size-5 text-volt-400" />
                  <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-volt-400 text-[10px] font-bold text-void">
                    {totalItems}
                  </span>
                </div>
                <span className="text-sm font-medium text-ink">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
              </div>
              <span className="text-sm font-semibold text-ink tabular-nums">{formatINR(totalPrice)}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
