'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  brand?: string;
}

interface FlyingItem {
  id: string;
  image: string;
  startX: number;
  startY: number;
}

const MAX_PER_LINE = 5;

interface CartStore {
  items: CartItem[];
  flyingItem: FlyingItem | null;
  addItem: (item: Omit<CartItem, 'quantity'>, flyingFrom?: { startX: number; startY: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearFlyingItem: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      flyingItem: null,

      addItem: (item, flyingFrom) => {
        set({ flyingItem: flyingFrom ? { ...flyingFrom, id: item.id, image: item.image } : null });
        setTimeout(() => set({ flyingItem: null }), 800);

        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            const newQty = Math.min(existing.quantity + 1, MAX_PER_LINE);
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: newQty } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.id !== id)
            : state.items.map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, MAX_PER_LINE) } : i)),
        })),

      clearCart: () => set({ items: [] }),
      clearFlyingItem: () => set({ flyingItem: null }),

      totalItems: () => get().items.reduce((sum, i) => sum + (i.quantity || 0), 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 0)), 0),
    }),
    { name: 'voltage-cart', version: 3, migrate: (persisted: any, version: number) => {
      if (version < 2) {
        return { items: [], flyingItem: null };
      }
      const items = (persisted?.items ?? [])
        .filter((i: any) => i && typeof i.price === 'number' && i.price > 0)
        .map((i: any) => ({ ...i, quantity: Math.min(i.quantity || 1, MAX_PER_LINE) }));
      return { ...persisted, items, flyingItem: null };
    }}
  )
);
