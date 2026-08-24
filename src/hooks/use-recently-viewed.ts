'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentlyViewedProduct {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  heroGradient: string;
  brandName: string;
  pricePaise: number;
  mrpPaise: number;
  viewedAt: Date;
}

interface RecentlyViewedStore {
  products: RecentlyViewedProduct[];
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addProduct: (product: Omit<RecentlyViewedProduct, 'viewedAt'>) => void;
  getRecentProducts: (limit?: number) => RecentlyViewedProduct[];
  clearAll: () => void;
}

const MAX_RECENT_PRODUCTS = 20;

export const useRecentlyViewed = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      products: [],
      hasHydrated: false,

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },

      addProduct: (product) => {
        const { products } = get();
        
        // Remove if already exists
        const filtered = products.filter((p) => p.id !== product.id);
        
        // Add to beginning
        const updated = [
          { ...product, viewedAt: new Date() },
          ...filtered,
        ].slice(0, MAX_RECENT_PRODUCTS);

        set({ products: updated });
      },

      getRecentProducts: (limit = 10) => {
        const { products } = get();
        return products.slice(0, limit);
      },

      clearAll: () => {
        set({ products: [] });
      },
    }),
    {
      name: 'recently-viewed-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
