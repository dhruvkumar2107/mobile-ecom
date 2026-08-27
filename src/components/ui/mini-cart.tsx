'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/cart';
import { formatINR } from '@/lib/money';
import { ShoppingBag, Minus, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function MiniCartBar() {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const totalPrice = useCartStore((s) => s.totalPrice());
  const [expanded, setExpanded] = useState(false);

  if (totalItems === 0) return null;

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
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="size-12 rounded-lg bg-panel-2 overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="size-full object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{item.name}</p>
                      <p className="text-xs text-ink-3">{formatINR(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="size-6 rounded-md bg-panel-2 flex items-center justify-center text-ink-3 hover:text-ink transition-colors" aria-label="Decrease quantity">
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-medium text-ink tabular-nums">{item.quantity}</span>
                      <button className="size-6 rounded-md bg-panel-2 flex items-center justify-center text-ink-3 hover:text-ink transition-colors" aria-label="Increase quantity">
                        <Plus className="size-3" />
                      </button>
                    </div>
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
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-volt-500/30 bg-volt-500/10 backdrop-blur-xl shadow-lg shadow-volt-500/10 hover:bg-volt-500/15 transition-colors cursor-pointer"
              aria-label={`Cart with ${totalItems} items. Total ${formatINR(totalPrice)}`}
            >
              <div className="relative">
                <ShoppingBag className="size-5 text-volt-300" />
                <span className="absolute -top-2 -right-2 size-4 rounded-full bg-volt-400 text-void text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-ink">{totalItems} item{totalItems > 1 ? 's' : ''} in cart</p>
                <p className="text-xs text-ink-3">Tap to review your order</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-volt-300 tabular-nums">{formatINR(totalPrice)}</p>
                <p className="text-[10px] text-ink-4 uppercase tracking-wider">Total</p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
