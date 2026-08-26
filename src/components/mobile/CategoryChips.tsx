'use client';

import { motion } from 'framer-motion';
import { mobileDesign } from '@/lib/mobile-design';
import { ChipButton } from './HapticButton';

export interface Category {
  id: string;
  name: string;
  icon?: React.ReactNode;
  count?: number;
}

interface CategoryChipsProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      style={{
        display: 'flex',
        gap: `${mobileDesign.spacing.sm}px`,
        padding: `0 ${mobileDesign.spacing.lg}px`,
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
      role="group"
      aria-label="Product categories"
    >
      <div style={{ flexShrink: 0, width: `${mobileDesign.spacing.lg}px` }} />
      {categories.map((category, index) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * index, duration: 0.2 }}
          style={{ scrollSnapAlign: 'start' }}
        >
          <ChipButton
            variant="accent"
            selected={selectedId === category.id}
            onClick={() => onSelect(category.id)}
            style={{ whiteSpace: 'nowrap' }}
            aria-selected={selectedId === category.id}
            role="tab"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {category.icon && <span style={{ display: 'flex' }}>{category.icon}</span>}
              {category.name}
              {category.count && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: `${mobileDesign.borderRadius.full}px`,
                    background: selectedId === category.id
                      ? 'rgba(255,255,255,0.3)'
                      : mobileDesign.colors.borderLight,
                    color: selectedId === category.id
                      ? mobileDesign.colors.textInverse
                      : mobileDesign.colors.textTertiary,
                  }}
                >
                  {category.count}
                </span>
              )}
            </span>
          </ChipButton>
        </motion.div>
      ))}
      <div style={{ flexShrink: 0, width: `${mobileDesign.spacing.lg}px` }} />
    </motion.div>
  );
}

export const defaultCategories: Category[] = [
  { id: 'all', name: 'All', count: 1247 },
  { id: 'smartphones', name: 'Smartphones', count: 342 },
  { id: 'laptops', name: 'Laptops', count: 189 },
  { id: 'audio', name: 'Audio', count: 256 },
  { id: 'wearables', name: 'Wearables', count: 178 },
  { id: 'accessories', name: 'Accessories', count: 282 },
];