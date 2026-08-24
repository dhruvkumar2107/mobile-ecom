'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

interface WishlistItem {
  productId: string;
  addedAt: Date;
}

interface WishlistStore {
  items: WishlistItem[];
  isLoading: boolean;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  syncWithServer: () => Promise<void>;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      hasHydrated: false,
      
      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },

      addItem: async (productId: string) => {
        const { items } = get();
        if (items.some((item) => item.productId === productId)) {
          return;
        }

        // Optimistic update
        set({ items: [...items, { productId, addedAt: new Date() }] });

        try {
          const res = await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
          });

          if (!res.ok) {
            throw new Error('Failed to add to wishlist');
          }

          const data = await res.json();
          toast.success(data.message || 'Added to wishlist');
        } catch (error) {
          // Revert on error
          set({ items });
          toast.error('Failed to add to wishlist');
        }
      },

      removeItem: async (productId: string) => {
        const { items } = get();
        const previousItems = items;

        // Optimistic update
        set({ items: items.filter((item) => item.productId !== productId) });

        try {
          const res = await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
          });

          if (!res.ok) {
            throw new Error('Failed to remove from wishlist');
          }

          const data = await res.json();
          toast.success(data.message || 'Removed from wishlist');
        } catch (error) {
          // Revert on error
          set({ items: previousItems });
          toast.error('Failed to remove from wishlist');
        }
      },

      toggleItem: async (productId: string) => {
        const { items, addItem, removeItem } = get();
        const isInWishlist = items.some((item) => item.productId === productId);

        if (isInWishlist) {
          await removeItem(productId);
        } else {
          await addItem(productId);
        }
      },

      isInWishlist: (productId: string) => {
        const { items } = get();
        return items.some((item) => item.productId === productId);
      },

      syncWithServer: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/wishlist');
          if (res.ok) {
            const data = await res.json();
            set({
              items: data.items.map((item: any) => ({
                productId: item.productId,
                addedAt: new Date(item.addedAt),
              })),
            });
          }
        } catch (error) {
          console.error('Failed to sync wishlist:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'wishlist-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
