'use client';

import { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mobileDesign } from '@/lib/mobile-design';
import { cn } from '@/lib/utils';
import { Search, X, Filter, Clock, TrendingUp, Tag, Mic, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Input } from './Input';
import { Sheet } from './Modal';
import { ListItem, Divider } from './List';
import { Badge } from './Badge';
import { HapticButton, ChipButton } from './HapticButton';

export interface SearchCommandProps {
  placeholder?: string;
  recentSearches?: string[];
  trendingSearches?: string[];
  categories?: Array<{ id: string; name: string; count: number }>;
  onSearch: (query: string) => void;
  onCategorySelect?: (categoryId: string) => void;
  onClose: () => void;
  isOpen: boolean;
  loading?: boolean;
}

export function SearchCommand({
  placeholder = 'Search products, brands...',
  recentSearches = [],
  trendingSearches = [],
  categories = [],
  onSearch,
  onCategorySelect,
  onClose,
  isOpen,
  loading = false,
}: SearchCommandProps) {
  const [query, setQuery] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim());
      onClose();
    }
  }, [query, onSearch, onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleSubmit, onClose]
  );

  const handleRecentClick = useCallback(
    (term: string) => {
      setQuery(term);
      onSearch(term);
      onClose();
    },
    [onSearch, onClose]
  );

  const handleCategoryClick = useCallback(
    (catId: string) => {
      setSelectedCategory(catId);
      setShowCategories(false);
      onCategorySelect?.(catId);
    },
    [onCategorySelect]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setSelectedCategory(null);
    inputRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showDragIndicator={true}
      title="Search"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.lg}px` }}>
        <div style={{ display: 'flex', gap: `${mobileDesign.spacing.md}px` }}>
          <div style={{ flex: 1 }}>
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              leftIcon={<Search style={{ width: 20, height: 20 }} aria-hidden="true" />}
              rightIcon={
                query ? (
                  <motion.button
                    onClick={handleClear}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      background: 'transparent',
                      color: mobileDesign.colors.textTertiary,
                      borderRadius: `${mobileDesign.borderRadius.sm}px`,
                      cursor: 'pointer',
                    }}
                    aria-label="Clear search"
                  >
                    <X style={{ width: 16, height: 16 }} aria-hidden="true" />
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => {}}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      border: 'none',
                      background: 'transparent',
                      color: mobileDesign.colors.textTertiary,
                      cursor: 'pointer',
                    }}
                    aria-label="Voice search"
                  >
                    <Mic style={{ width: 20, height: 20 }} aria-hidden="true" />
                  </motion.button>
                )
              }
              fullWidth
              size="lg"
            />
          </div>
          <HapticButton variant="primary" size="lg" onClick={handleSubmit} disabled={!query.trim() || loading} loading={loading}>
            Search
          </HapticButton>
        </div>

        {selectedCategory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: `${mobileDesign.spacing.sm}px` }}>
            <Badge variant="accent" removable onRemove={() => setSelectedCategory(null)}>
              {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
            </Badge>
            <span style={{ fontSize: '13px', color: mobileDesign.colors.textSecondary }}>
              Category filter active
            </span>
          </div>
        )}

        {recentSearches.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: `${mobileDesign.spacing.md}px` }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Recent Searches
              </h3>
              {recentSearches.length > 0 && (
                <motion.button
                  onClick={() => {}}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: 0,
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: mobileDesign.typography.fontFamily,
                    color: mobileDesign.colors.accent,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Clear all
                </motion.button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${mobileDesign.spacing.sm}px` }}>
              {recentSearches.map((term, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleRecentClick(term)}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.md}px`,
                    border: `1px solid ${mobileDesign.colors.border}`,
                    borderRadius: `${mobileDesign.borderRadius.full}px`,
                    background: mobileDesign.colors.surface,
                    color: mobileDesign.colors.textSecondary,
                    fontSize: '14px',
                    fontFamily: mobileDesign.typography.fontFamily,
                    cursor: 'pointer',
                    transition: `all ${mobileDesign.transitions.fast}`,
                  }}
                >
                  <Clock style={{ width: 16, height: 16, color: mobileDesign.colors.textTertiary }} aria-hidden="true" />
                  {term}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {trendingSearches.length > 0 && (
          <div>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: `${mobileDesign.spacing.md}px` }}>
              Trending Now
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${mobileDesign.spacing.sm}px` }}>
              {trendingSearches.map((term, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleRecentClick(term)}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.md}px`,
                    border: `1px solid ${mobileDesign.colors.border}`,
                    borderRadius: `${mobileDesign.borderRadius.full}px`,
                    background: mobileDesign.colors.accentLight,
                    color: mobileDesign.colors.accentDark,
                    fontSize: '14px',
                    fontFamily: mobileDesign.typography.fontFamily,
                    cursor: 'pointer',
                    transition: `all ${mobileDesign.transitions.fast}`,
                  }}
                >
                  <TrendingUp style={{ width: 16, height: 16 }} aria-hidden="true" />
                  {term}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: `${mobileDesign.spacing.md}px` }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Categories
              </h3>
              <motion.button
                onClick={() => setShowCategories(!showCategories)}
                whileTap={{ scale: 0.95 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: mobileDesign.typography.fontFamily,
                  color: mobileDesign.colors.accent,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {showCategories ? 'Show less' : 'Show all'}
                {showCategories ? <ChevronUp style={{ width: 14, height: 14 }} aria-hidden="true" /> : <ChevronDown style={{ width: 14, height: 14 }} aria-hidden="true" />}
              </motion.button>
            </div>
            <AnimatePresence>
              {showCategories && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${mobileDesign.spacing.sm}px` }}>
                    {categories.map((cat, index) => (
                      <ChipButton
                        key={cat.id}
                        variant="accent"
                        selected={selectedCategory === cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 * index }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {cat.name}
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: `${mobileDesign.borderRadius.full}px`,
                              background: selectedCategory === cat.id ? 'rgba(255,255,255,0.3)' : mobileDesign.colors.borderLight,
                              color: selectedCategory === cat.id ? mobileDesign.colors.textInverse : mobileDesign.colors.textTertiary,
                            }}
                          >
                            {cat.count}
                          </span>
                        </span>
                      </ChipButton>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Sheet>
  );
}

export interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, unknown>) => void;
  filters: {
    priceRange?: { min: number; max: number };
    brands?: string[];
    categories?: string[];
    rating?: number;
    inStock?: boolean;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  };
  availableBrands?: string[];
  availableCategories?: string[];
  priceRange?: { min: number; max: number };
  className?: string;
}

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
];

export function FilterSheet({
  isOpen,
  onClose,
  onApply,
  filters,
  availableBrands = [],
  availableCategories = [],
  priceRange = { min: 0, max: 100000 },
  className,
}: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [priceMin, setPriceMin] = useState(filters.priceRange?.min ?? priceRange.min);
  const [priceMax, setPriceMax] = useState(filters.priceRange?.max ?? priceRange.max);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sort: true,
    price: true,
    brands: false,
    categories: false,
    other: true,
  });

  useEffect(() => {
    setLocalFilters(filters);
    setPriceMin(filters.priceRange?.min ?? priceRange.min);
    setPriceMax(filters.priceRange?.max ?? priceRange.max);
  }, [filters, priceRange]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleBrandToggle = useCallback((brand: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      brands: prev.brands?.includes(brand)
        ? prev.brands!.filter((b) => b !== brand)
        : [...(prev.brands || []), brand],
    }));
  }, []);

  const handleCategoryToggle = useCallback((category: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories!.filter((c) => c !== category)
        : [...(prev.categories || []), category],
    }));
  }, []);

  const handleSortChange = useCallback((sortBy: string) => {
    setLocalFilters((prev) => ({ ...prev, sortBy: sortBy as typeof filters.sortBy }));
  }, []);

  const handlePriceChange = useCallback(() => {
    setLocalFilters((prev) => ({ ...prev, priceRange: { min: priceMin, max: priceMax } }));
  }, [priceMin, priceMax]);

  const handleApply = useCallback(() => {
    onApply(localFilters);
    onClose();
  }, [localFilters, onApply, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({ sortBy: 'relevance' });
    setPriceMin(priceRange.min);
    setPriceMax(priceRange.max);
  }, [priceRange]);

  const hasActiveFilters =
    (localFilters.priceRange && (localFilters.priceRange.min > priceRange.min || localFilters.priceRange.max < priceRange.max)) ||
    (localFilters.brands && localFilters.brands.length > 0) ||
    (localFilters.categories && localFilters.categories.length > 0) ||
    localFilters.rating ||
    localFilters.inStock;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showDragIndicator={true}
      title="Filters"
      description={`${availableBrands.length} brands • ${availableCategories.length} categories`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.lg}px` }}>
        <AnimatePresence mode="popLayout">
          {expandedSections.sort && (
            <motion.div
              key="sort"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: `${mobileDesign.spacing.md}px` }}>
                Sort By
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.sm}px` }}>
                {sortOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: `${mobileDesign.spacing.md}px ${mobileDesign.spacing.lg}px`,
                      border: `1px solid ${localFilters.sortBy === option.value ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                      borderRadius: `${mobileDesign.borderRadius.md}px`,
                      background: localFilters.sortBy === option.value ? mobileDesign.colors.accentLight : mobileDesign.colors.surface,
                      color: localFilters.sortBy === option.value ? mobileDesign.colors.accentDark : mobileDesign.colors.textPrimary,
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: mobileDesign.typography.fontFamily,
                      cursor: 'pointer',
                      transition: `all ${mobileDesign.transitions.fast}`,
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span>{option.label}</span>
                    {localFilters.sortBy === option.value && (
                      <Check style={{ width: 20, height: 20, color: mobileDesign.colors.accent }} aria-hidden="true" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Divider label="Price Range" labelPosition="start" />

        <AnimatePresence mode="popLayout">
          {expandedSections.price && (
            <motion.div
              key="price"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', paddingTop: `${mobileDesign.spacing.md}px` }}
            >
              <div style={{ display: 'flex', gap: `${mobileDesign.spacing.md}px`, marginBottom: `${mobileDesign.spacing.md}px` }}>
                <Input
                  type="number"
                  label="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(Math.max(priceRange.min, parseInt(e.target.value) || priceRange.min))}
                  placeholder={priceRange.min.toString()}
                  fullWidth
                  size="md"
                  variant="outlined"
                  inputProps={{ min: priceRange.min, max: priceRange.max }}
                />
                <span style={{ display: 'flex', alignItems: 'center', color: mobileDesign.colors.textTertiary, fontSize: '14px' }}>–</span>
                <Input
                  type="number"
                  label="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Math.min(priceRange.max, parseInt(e.target.value) || priceRange.max))}
                  placeholder={priceRange.max.toString()}
                  fullWidth
                  size="md"
                  variant="outlined"
                  inputProps={{ min: priceRange.min, max: priceRange.max }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${mobileDesign.spacing.md}px` }}>
                <div
                  style={{
                    flex: 1,
                    height: '4px',
                    background: mobileDesign.colors.borderLight,
                    borderRadius: '2px',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: `${((priceMin - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                      right: `${(1 - (priceMax - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                      height: '100%',
                      background: mobileDesign.colors.accent,
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <span style={{ fontSize: '12px', color: mobileDesign.colors.textTertiary, whiteSpace: 'nowrap' }}>
                  ₹{priceMin.toLocaleString()} – ₹{priceMax.toLocaleString()}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {availableBrands.length > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.button
              onClick={() => toggleSection('brands')}
              whileTap={{ scale: 0.99 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${mobileDesign.spacing.md}px 0`,
                border: 'none',
                background: 'transparent',
                color: mobileDesign.colors.textPrimary,
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: mobileDesign.typography.fontFamily,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span>Brands</span>
              <motion.span
                animate={{ rotate: expandedSections.brands ? 180 : 0 }}
                transition={{ duration: 200 }}
              >
                <ChevronDown style={{ width: 16, height: 16 }} aria-hidden="true" />
              </motion.span>
            </motion.button>
          </AnimatePresence>
        )}

        <AnimatePresence mode="popLayout">
          {expandedSections.brands && availableBrands.length > 0 && (
            <motion.div
              key="brands"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', paddingTop: `${mobileDesign.spacing.md}px` }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${mobileDesign.spacing.sm}px` }}>
                {availableBrands.map((brand, index) => (
                  <motion.label
                    key={brand}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.02 * index }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: `${mobileDesign.spacing.sm}px ${mobileDesign.spacing.md}px`,
                      border: `1px solid ${localFilters.brands?.includes(brand) ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                      borderRadius: `${mobileDesign.borderRadius.full}px`,
                      background: localFilters.brands?.includes(brand) ? mobileDesign.colors.accentLight : mobileDesign.colors.surface,
                      color: localFilters.brands?.includes(brand) ? mobileDesign.colors.accentDark : mobileDesign.colors.textPrimary,
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: mobileDesign.typography.fontFamily,
                      cursor: 'pointer',
                      transition: `all ${mobileDesign.transitions.fast}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.brands?.includes(brand) || false}
                      onChange={() => handleBrandToggle(brand)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: mobileDesign.colors.accent,
                        cursor: 'pointer',
                      }}
                    />
                    {brand}
                  </motion.label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {availableCategories.length > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.button
              onClick={() => toggleSection('categories')}
              whileTap={{ scale: 0.99 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${mobileDesign.spacing.md}px 0`,
                border: 'none',
                background: 'transparent',
                color: mobileDesign.colors.textPrimary,
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: mobileDesign.typography.fontFamily,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span>Categories</span>
              <motion.span
                animate={{ rotate: expandedSections.categories ? 180 : 0 }}
                transition={{ duration: 200 }}
              >
                <ChevronDown style={{ width: 16, height: 16 }} aria-hidden="true" />
              </motion.span>
            </motion.button>
          </AnimatePresence>
        )}

        <AnimatePresence mode="popLayout">
          {expandedSections.categories && availableCategories.length > 0 && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', paddingTop: `${mobileDesign.spacing.md}px` }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.sm}px` }}>
                {availableCategories.map((cat, index) => (
                  <motion.label
                    key={cat}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * index }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: `${mobileDesign.spacing.md}px`,
                      padding: `${mobileDesign.spacing.md}px`,
                      border: `1px solid ${localFilters.categories?.includes(cat) ? mobileDesign.colors.accent : mobileDesign.colors.border}`,
                      borderRadius: `${mobileDesign.borderRadius.md}px`,
                      background: localFilters.categories?.includes(cat) ? mobileDesign.colors.accentLight : mobileDesign.colors.surface,
                      cursor: 'pointer',
                      transition: `all ${mobileDesign.transitions.fast}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.categories?.includes(cat) || false}
                      onChange={() => handleCategoryToggle(cat)}
                      style={{
                        width: '20px',
                        height: '20px',
                        accentColor: mobileDesign.colors.accent,
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary }}>
                      {cat}
                    </span>
                  </motion.label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Divider label="More Options" labelPosition="start" />

        <AnimatePresence mode="popLayout">
          {expandedSections.other && (
            <motion.div
              key="other"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', paddingTop: `${mobileDesign.spacing.md}px` }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${mobileDesign.spacing.md}px` }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: `${mobileDesign.spacing.md}px`, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!localFilters.inStock}
                    onChange={(e) => setLocalFilters((prev) => ({ ...prev, inStock: e.target.checked }))}
                    style={{ width: '20px', height: '20px', accentColor: mobileDesign.colors.accent, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary }}>
                    In Stock Only
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: `${mobileDesign.spacing.md}px`, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!localFilters.rating}
                    onChange={(e) => setLocalFilters((prev) => ({ ...prev, rating: e.target.checked ? 4 : undefined }))}
                    style={{ width: '20px', height: '20px', accentColor: mobileDesign.colors.accent, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: mobileDesign.typography.fontFamily, color: mobileDesign.colors.textPrimary }}>
                    4 Stars & Up
                  </span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          style={{
            display: 'flex',
            gap: `${mobileDesign.spacing.md}px`,
            marginTop: `${mobileDesign.spacing.lg}px`,
            paddingTop: `${mobileDesign.spacing.lg}px`,
            borderTop: `1px solid ${mobileDesign.colors.borderLight}`,
          }}
        >
          <HapticButton
            variant="outline"
            fullWidth
            onClick={handleClear}
            disabled={!hasActiveFilters}
            style={{ opacity: hasActiveFilters ? 1 : 0.5 }}
          >
            Clear All
          </HapticButton>
          <HapticButton variant="primary" fullWidth onClick={handleApply}>
            Apply Filters
          </HapticButton>
        </div>
      </div>
    </Sheet>
  );
}