'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronUp, SlidersHorizontal, Filter, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/money';
import { ProductCard } from '@/components/product/card';
import { Panel, PanelHeader, PanelBody, EmptyState } from '@/components/ui/panel';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type ProductCard as ProductCardType, type Facets, type ListResult, type ProductFilter, CATALOG_SORTS } from '@/lib/services/catalog';

type ProductListingClientProps = {
  initialResult: ListResult;
  initialFilter: ProductFilter;
  brands: Array<{ id: string; name: string; slug: string; accent: string }>;
  categories: Array<{ id: string; name: string; slug: string; icon: string | null }>;
  kinds: Array<{ id: string; name: string; slug: string }>;
  sorts: readonly string[];
  sortLabels: Record<string, string>;
};

const EMPTY_FACETS: Facets = {
  brands: [],
  categories: [],
  kinds: [],
  ram: [],
  storage: [],
  colors: [],
  badges: [],
  ratings: [],
  price: { minPaise: 0, maxPaise: 0, buckets: [] },
  availability: { inStock: 0, total: 0 },
  specs: [],
};

export function ProductListingClient({
  initialResult,
  initialFilter,
  brands,
  categories,
  kinds,
  sorts,
  sortLabels,
}: ProductListingClientProps) {
  const router = useRouter();
  const [result, setResult] = useState<ListResult>(initialResult);
  const [filter, setFilter] = useState<ProductFilter>(initialFilter);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFacets, setExpandedFacets] = useState<Record<string, boolean>>({
    brands: true,
    categories: true,
    kinds: true,
    ram: true,
    storage: true,
    colors: true,
    badges: true,
    ratings: true,
    price: true,
    specs: true,
  });

  const facets: Facets = result.facets ?? EMPTY_FACETS;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.brandSlugs?.length) count += filter.brandSlugs.length;
    if (filter.categorySlug) count += 1;
    if (filter.kinds?.length) count += filter.kinds.length;
    if (filter.minPricePaise !== undefined) count += 1;
    if (filter.maxPricePaise !== undefined) count += 1;
    if (filter.ramGb?.length) count += filter.ramGb.length;
    if (filter.storageGb?.length) count += filter.storageGb.length;
    if (filter.colors?.length) count += filter.colors.length;
    if (filter.badges?.length) count += filter.badges.length;
    if (filter.ratingMin) count += 1;
    if (filter.inStockOnly) count += 1;
    if (filter.q) count += 1;
    return count;
  }, [filter]);

  const updateFilters = useCallback((newFilter: Partial<ProductFilter>, replacePage = true) => {
    setFilter((prev) => {
      const next = { ...prev, ...newFilter };
      if (replacePage) next.page = 1;
      return next;
    });
  }, []);

  const toggleFacet = useCallback((facet: keyof ProductFilter, value: string | number, isArray = true) => {
    setFilter((prev) => {
      const current = prev[facet];
      let next: typeof current;
      if (isArray) {
        const arr = (current as (string | number)[] | undefined) ?? [];
        const val = value;
        next = (arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]) as typeof current;
      } else {
        next = value as typeof current;
      }
      return { ...prev, [facet]: next, page: 1 };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilter({ page: 1, perPage: 12, sort: 'featured', loyaltyTier: filter.loyaltyTier });
  }, [filter.loyaltyTier]);

  const prevFilterRef = useRef<string>(JSON.stringify(initialFilter));

  const fetchResults = useCallback(async () => {
    const filterKey = JSON.stringify(filter);
    if (filterKey === prevFilterRef.current) return;
    prevFilterRef.current = filterKey;

    setIsLoading(true);
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return;
      if (key === 'page' && value === 1) return;
      if (key === 'perPage') return;
      if (key === 'loyaltyTier') return;
      if (key === 'sort' && value === 'featured') return;
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    });
    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const envelope = await res.json();
        const data = envelope?.data ?? envelope;
        if (data && data.facets && Array.isArray(data.items)) {
          setResult(data);
        }
      }
    } catch {
      // Keep current result on error
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const hasMore = result.page < result.pages;
  const loadMore = () => {
    if (!hasMore || isLoading) return;
    setFilter((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }));
  };

  const priceRange = facets.price;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">{result.total} {result.total === 1 ? 'device' : 'devices'}</h1>
          {filter.q && (
            <p className="text-sm text-ink-3">
              Showing results for &ldquo;{filter.q}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-1.5"
            >
              <X className="size-3.5" aria-hidden />
              Clear all ({activeFilterCount})
            </Button>
          )}

          <select
            value={filter.sort ?? 'featured'}
            onChange={(e) => updateFilters({ sort: e.target.value as ProductFilter['sort'] })}
            className="hidden sm:flex h-9 items-center gap-2 rounded-lg border border-line bg-panel-2 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-volt-400"
          >
            {sorts.map((s) => (
              <option key={s} value={s}>{sortLabels[s]}</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 sm:hidden"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters
            {activeFilterCount > 0 && (
              <Badge tone="cyan" size="xs">{activeFilterCount}</Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          {showFilters && (
            <div className="fixed inset-0 z-40 bg-void/50 lg:hidden" onClick={() => setShowFilters(false)} />
          )}
          <div
            className={cn(
              'panel bevel space-y-4 p-4 transition-transform duration-300 ease-out',
              showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
              'lg:relative lg:visible'
            )}
            style={{ zIndex: showFilters ? 50 : undefined }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden text-ink-3 hover:text-ink"
                aria-label="Close filters"
              >
                <X className="size-5" />
              </button>
            </div>

            <FacetSection
              title="Brands"
              key="brands"
              expanded={expandedFacets.brands}
              onToggle={() => setExpandedFacets((p) => ({ ...p, brands: !p.brands }))}
              count={facets.brands.length}
            >
              {facets.brands.map((b) => (
                <FacetCheckbox
                  key={b.value}
                  label={b.label}
                  count={b.count}
                  checked={filter.brandSlugs?.includes(b.value) ?? false}
                  onChange={() => toggleFacet('brandSlugs', b.value)}
                  accent={b.accent}
                />
              ))}
            </FacetSection>

            <FacetSection
              title="Category"
              key="categories"
              expanded={expandedFacets.categories}
              onToggle={() => setExpandedFacets((p) => ({ ...p, categories: !p.categories }))}
            >
              {categories.map((c) => (
                <FacetRadio
                  key={c.slug}
                  label={c.name}
                  checked={filter.categorySlug === c.slug}
                  onChange={() => updateFilters({ categorySlug: filter.categorySlug === c.slug ? undefined : c.slug })}
                />
              ))}
            </FacetSection>

            <FacetSection
              title="Type"
              key="kinds"
              expanded={expandedFacets.kinds}
              onToggle={() => setExpandedFacets((p) => ({ ...p, kinds: !p.kinds }))}
            >
              {kinds.map((k) => (
                <FacetCheckbox
                  key={k.slug}
                  label={k.name}
                  checked={filter.kinds?.includes(k.slug) ?? false}
                  onChange={() => toggleFacet('kinds', k.slug)}
                />
              ))}
            </FacetSection>

            <FacetSection
              title="RAM"
              key="ram"
              expanded={expandedFacets.ram}
              onToggle={() => setExpandedFacets((p) => ({ ...p, ram: !p.ram }))}
            >
              {facets.ram.map((r) => (
                <FacetCheckbox
                  key={r.value}
                  label={r.label}
                  count={r.count}
                  checked={filter.ramGb?.includes(Number(r.value)) ?? false}
                  onChange={() => toggleFacet('ramGb', Number(r.value))}
                />
              ))}
            </FacetSection>

            <FacetSection
              title="Storage"
              key="storage"
              expanded={expandedFacets.storage}
              onToggle={() => setExpandedFacets((p) => ({ ...p, storage: !p.storage }))}
            >
              {facets.storage.map((s) => (
                <FacetCheckbox
                  key={s.value}
                  label={s.label}
                  count={s.count}
                  checked={filter.storageGb?.includes(Number(s.value)) ?? false}
                  onChange={() => toggleFacet('storageGb', Number(s.value))}
                />
              ))}
            </FacetSection>

            <FacetSection
              title="Color"
              key="colors"
              expanded={expandedFacets.colors}
              onToggle={() => setExpandedFacets((p) => ({ ...p, colors: !p.colors }))}
            >
              {facets.colors.map((c) => (
                <FacetColorCheckbox
                  key={c.value}
                  label={c.label}
                  count={c.count}
                  hex={c.hex}
                  hex2={c.hex2}
                  checked={filter.colors?.map((v) => v.toLowerCase()).includes(c.value.toLowerCase()) ?? false}
                  onChange={() => toggleFacet('colors', c.value)}
                />
              ))}
            </FacetSection>

            <FacetSection
              title="Badges"
              key="badges"
              expanded={expandedFacets.badges}
              onToggle={() => setExpandedFacets((p) => ({ ...p, badges: !p.badges }))}
            >
              {facets.badges.map((b) => (
                <FacetCheckbox
                  key={b.value}
                  label={b.label}
                  count={b.count}
                  checked={filter.badges?.map((v) => v.toLowerCase()).includes(b.value.toLowerCase()) ?? false}
                  onChange={() => toggleFacet('badges', b.value)}
                />
              ))}
            </FacetSection>

            <FacetSection
              title="Rating"
              key="ratings"
              expanded={expandedFacets.ratings}
              onToggle={() => setExpandedFacets((p) => ({ ...p, ratings: !p.ratings }))}
            >
              {facets.ratings.map((r) => (
                <FacetRadio
                  key={r.value}
                  label={r.label}
                  count={r.count}
                  checked={filter.ratingMin === Number(r.value)}
                  onChange={() => updateFilters({ ratingMin: filter.ratingMin === Number(r.value) ? undefined : Number(r.value) })}
                />
              ))}
            </FacetSection>

            <FacetSection
              title="Price"
              key="price"
              expanded={expandedFacets.price}
              onToggle={() => setExpandedFacets((p) => ({ ...p, price: !p.price }))}
            >
              <PriceRangeFilter
                min={priceRange.minPaise}
                max={priceRange.maxPaise}
                currentMin={filter.minPricePaise}
                currentMax={filter.maxPricePaise}
                buckets={priceRange.buckets}
                onChange={({ min, max }) => updateFilters({ minPricePaise: min, maxPricePaise: max })}
              />
            </FacetSection>

            <FacetSection
              title="Availability"
              key="availability"
              expanded={expandedFacets.specs}
              onToggle={() => setExpandedFacets((p) => ({ ...p, specs: !p.specs }))}
            >
              <FacetCheckbox
                label="In stock only"
                checked={filter.inStockOnly ?? false}
                onChange={() => updateFilters({ inStockOnly: !filter.inStockOnly })}
              />
            </FacetSection>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="space-y-6">
          {isLoading && result.items.length === 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && result.items.length === 0 && (
            <EmptyState
              icon={<Filter className="size-5" />}
              title="No devices match your filters"
              description="Try broadening your search or clearing some filters."
              action={<Button onClick={clearAllFilters} size="md">Clear all filters</Button>}
            />
          )}

          {result.items.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4" role="list">
              {result.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {hasMore && !isLoading && (
            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading...
                  </>
                ) : (
                  `Load more (${result.items.length} of ${result.total})`
                )}
              </Button>
            </div>
          )}

          {!hasMore && result.items.length > 0 && (
            <p className="text-center text-sm text-ink-3">
              Showing all {result.total} {result.total === 1 ? 'device' : 'devices'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FacetSection({
  title,
  children,
  expanded,
  onToggle,
  count,
}: {
  title: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
}) {
  return (
    <div className="border-b border-line last:border-0 pb-4 last:pb-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 text-sm font-medium text-ink"
        aria-expanded={expanded}
      >
        <span>{title}</span>
        <span className="flex items-center gap-1 text-ink-3">
          {count !== undefined && <span className="text-[11px] text-ink-4">({count})</span>}
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>
      {expanded && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

function FacetCheckbox({
  label,
  count,
  checked,
  onChange,
  accent,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  accent?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-line bg-panel-2 text-volt-400 focus:ring-volt-400"
      />
      <span className="text-sm text-ink-2 truncate">{label}</span>
      {count !== undefined && <span className="ml-auto tabular text-[11px] text-ink-4">{count}</span>}
    </label>
  );
}

function FacetColorCheckbox({
  label,
  count,
  hex,
  hex2,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  hex: string;
  hex2: string | null;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-line bg-panel-2 text-volt-400 focus:ring-volt-400"
      />
      <span
        className="size-5 rounded-full ring-1 ring-line"
        style={{ background: hex2 ? `linear-gradient(135deg, ${hex}, ${hex2})` : hex }}
        aria-hidden
      />
      <span className="text-sm text-ink-2 truncate">{label}</span>
      {count !== undefined && <span className="ml-auto tabular text-[11px] text-ink-4">{count}</span>}
    </label>
  );
}

function FacetRadio({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name={label}
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-line bg-panel-2 text-volt-400 focus:ring-volt-400"
      />
      <span className="text-sm text-ink-2 truncate">{label}</span>
      {count !== undefined && <span className="ml-auto tabular text-[11px] text-ink-4">{count}</span>}
    </label>
  );
}

function PriceRangeFilter({
  min,
  max,
  currentMin,
  currentMax,
  buckets,
  onChange,
}: {
  min: number;
  max: number;
  currentMin?: number;
  currentMax?: number;
  buckets: Array<{ label: string; minPaise: number; maxPaise: number | null; count: number }>;
  onChange: ({ min, max }: { min?: number; max?: number }) => void;
}) {
  const [localMin, setLocalMin] = useState(currentMin ?? min);
  const [localMax, setLocalMax] = useState(currentMax ?? max);

  const handleApply = () => {
    onChange({
      min: localMin > min ? localMin : undefined,
      max: localMax < max ? localMax : undefined,
    });
  };

  const handleQuickSelect = (bucket: { minPaise: number; maxPaise: number | null }) => {
    onChange({ min: bucket.minPaise, max: bucket.maxPaise ?? undefined });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label htmlFor="price-min" className="sr-only">Min price</label>
          <Input
            id="price-min"
            type="number"
            placeholder={`Min (₹${(min / 100).toLocaleString('en-IN')})`}
            value={localMin > min ? localMin / 100 : ''}
            onChange={(e) => setLocalMin(e.target.value ? parseInt(e.target.value, 10) * 100 : min)}
            className="h-8 text-sm"
            inputMode="numeric"
          />
        </div>
        <span className="text-ink-3">–</span>
        <div className="flex-1">
          <label htmlFor="price-max" className="sr-only">Max price</label>
          <Input
            id="price-max"
            type="number"
            placeholder={`Max (₹${(max / 100).toLocaleString('en-IN')})`}
            value={localMax < max ? localMax / 100 : ''}
            onChange={(e) => setLocalMax(e.target.value ? parseInt(e.target.value, 10) * 100 : max)}
            className="h-8 text-sm"
            inputMode="numeric"
          />
        </div>
      </div>
      <Button variant="outline" size="sm" fullWidth onClick={handleApply}>
        Apply
      </Button>
      <div className="space-y-1.5">
        {buckets.slice(0, 5).map((bucket) => (
          <button
            key={bucket.label}
            type="button"
            onClick={() => handleQuickSelect(bucket)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-ink-2 transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <span>{bucket.label}</span>
            <span className="tabular text-[11px] text-ink-4">{bucket.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="panel bevel rounded-2xl overflow-hidden animate-rise">
      <div className="aspect-[4/3] bg-panel-2 shimmer" />
      <div className="p-3 space-y-1.5">
        <div className="h-2.5 w-16 rounded bg-panel-2 shimmer" />
        <div className="h-3.5 w-3/4 rounded bg-panel-2 shimmer" />
        <div className="h-5 w-1/2 rounded bg-panel-2 shimmer" />
        <div className="h-2.5 w-1/3 rounded bg-panel-2 shimmer" />
      </div>
    </div>
  );
}
