'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, ChevronDown, ChevronUp, Loader2, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/money';
import { ProductCard } from '@/components/product/card';
import { Panel, PanelHeader, PanelBody, EmptyState } from '@/components/ui/panel';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type CompareResult, type CompareRow, type CompareCell } from '@/lib/services/catalog';

type CompareClientProps = {
  initialResult: CompareResult | null;
  selectedSlugs: string[];
  allProducts: Array<{ id: string; name: string; slug: string; brand: { name: string }; heroGradient: string }>;
  allBrands: Array<{ id: string; name: string; slug: string; accent: string }>;
  maxCompare: number;
};

export function CompareClient({
  initialResult,
  selectedSlugs: initialSelectedSlugs,
  allProducts,
  allBrands,
  maxCompare,
}: CompareClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<CompareResult | null>(initialResult);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSelectedSlugs);
  const [isLoading, setIsLoading] = useState(false);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const availableProducts = useMemo(() => {
    const selected = new Set(selectedSlugs);
    return allProducts.filter((p) => !selected.has(p.slug));
  }, [allProducts, selectedSlugs]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.name.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [availableProducts, searchQuery]);

  const addToCompare = useCallback(
    (slug: string) => {
      if (selectedSlugs.includes(slug)) return;
      if (selectedSlugs.length >= maxCompare) return;
      const next = [...selectedSlugs, slug];
      setSelectedSlugs(next);
      router.push(`/compare?p=${next.join(',')}`);
    },
    [selectedSlugs, maxCompare, router]
  );

  const removeFromCompare = useCallback(
    (slug: string) => {
      const next = selectedSlugs.filter((s) => s !== slug);
      setSelectedSlugs(next);
      router.push(next.length >= 2 ? `/compare?p=${next.join(',')}` : '/compare');
    },
    [selectedSlugs, router]
  );

  const fetchComparison = useCallback(async (slugs: string[]) => {
    if (slugs.length < 2) {
      setResult(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/compare?p=${slugs.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync with URL on mount
  if (searchParams) {
    const urlSlugs = searchParams.get('p')?.split(',').filter(Boolean) ?? [];
    if (urlSlugs.length !== selectedSlugs.length || urlSlugs.some((s, i) => s !== selectedSlugs[i])) {
      setSelectedSlugs(urlSlugs);
      if (urlSlugs.length >= 2) {
        fetchComparison(urlSlugs);
      } else {
        setResult(null);
      }
    }
  }

  const allRows = result?.groups.flatMap((g) => g.rows) ?? [];
  const filteredGroups = showDifferencesOnly
    ? result?.groups.map((g) => ({ ...g, rows: g.rows.filter((r) => !r.identical) })).filter((g) => g.rows.length > 0) ?? []
    : result?.groups ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Compare devices</h1>
          <p className="mt-1 text-sm text-ink-3">
            Select up to {maxCompare} devices to compare specs, price, EMI and ratings side by side.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedSlugs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedSlugs([])}>
              <X className="size-3.5 mr-1.5" aria-hidden />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Selection bar */}
      <Panel flat className="space-y-4">
        <PanelBody className="p-5 pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-ink-3 shrink-0">
              {selectedSlugs.length} of {maxCompare} selected
            </span>
            {selectedSlugs.map((slug, i) => {
              const product = allProducts.find((p) => p.slug === slug);
              if (!product) return null;
              return (
                <div
                  key={slug}
                  className="flex items-center gap-2 rounded-lg bg-panel-2 px-3 py-1.5 ring-1 ring-inset ring-line"
                >
                  <span className="text-sm font-medium text-ink">{product.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFromCompare(slug)}
                    aria-label={`Remove ${product.name}`}
                    className="p-0.5 text-ink-4 hover:text-ink transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              );
            })}
            {selectedSlugs.length < maxCompare && (
              <div className="relative flex-1 min-w-[200px]">
                <Input
                  placeholder="Search to add another device…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9"
                />
                <GitCompare className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-4" aria-hidden />
                {filteredProducts.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full panel bevel ring-1 ring-line shadow-panel">
                    <ul role="listbox" className="max-h-60 overflow-y-auto">
                      {filteredProducts.map((p) => (
                        <li
                          key={p.slug}
                          role="option"
                          onClick={() => addToCompare(p.slug)}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-ink-2 hover:bg-panel-2 hover:text-ink cursor-pointer"
                        >
                          <div
                            className="size-8 rounded-full ring-1 ring-inset ring-line"
                            style={{ background: p.heroGradient }}
                            aria-hidden
                          />
                          <span className="truncate font-medium">{p.name}</span>
                          <span className="ml-auto text-xs text-ink-4">{p.brand.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </PanelBody>
      </Panel>

      {/* Comparison table */}
      {selectedSlugs.length < 2 ? (
        <EmptyState
          icon={<GitCompare className="size-5" />}
          title="Select devices to compare"
          description="Search for devices above to add them to the comparison. You need at least two."
        />
      ) : isLoading && !result ? (
        <Panel>
          <PanelBody className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-volt-300" aria-hidden />
          </PanelBody>
        </Panel>
      ) : result ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDifferencesOnly}
                onChange={(e) => setShowDifferencesOnly(e.target.checked)}
                className="size-4 rounded border-line bg-panel-2 text-volt-400 focus:ring-volt-400"
              />
              <span className="text-sm font-medium text-ink">Show differences only</span>
              <Badge tone="cyan" size="xs">
                {allRows.filter((r) => !r.identical).length} differ
              </Badge>
            </label>
          </div>

          {/* Product headers */}
          <Panel>
            <PanelBody className="p-5 overflow-x-auto">
              <div className="min-w-max grid grid-cols-[minmax(180px,1fr)_repeat(4,minmax(160px,1fr))] gap-4">
                <div className="text-sm font-medium text-ink-3">Specification</div>
                {result.products.map((p) => (
                  <div key={p.id} className="text-center">
                    <div className="aspect-square rounded-lg bg-gradient-to-br" style={{ background: p.heroGradient }} />
                    <p className="mt-2 text-sm font-medium text-ink truncate">{p.name}</p>
                    <p className="text-xs text-ink-3 capitalize">{p.brand.name}</p>
                    <div className="mt-1.5 tabular text-lg font-semibold text-ink">{formatINR(p.finalPaise)}</div>
                    {p.mrpPaise > p.finalPaise && (
                      <div className="tabular text-sm text-ink-4 line-through">{formatINR(p.mrpPaise)}</div>
                    )}
                    {p.discountPercent > 0 && (
                      <Badge tone="emerald" size="xs" className="mx-auto mt-1">{p.discountPercent}% off</Badge>
                    )}
                  </div>
                ))}
              </div>
            </PanelBody>
          </Panel>

          {/* Spec rows */}
          {filteredGroups.length > 0 &&
            filteredGroups.map((group) => (
              <Panel key={group.groupName}>
                <PanelBody className="p-5 space-y-0">
                  <p className="text-xs font-medium tracking-[0.14em] text-ink-4 uppercase">{group.groupName}</p>
                  {group.rows.map((row) => (
                    <SpecRow
                      key={row.key}
                      row={row}
                      products={result?.products ?? []}
                      identical={row.identical}
                    />
                  ))}
                </PanelBody>
              </Panel>
            ))}
        </div>
      ) : (
        <EmptyState
          icon={<GitCompare className="size-5" />}
          title="Could not compare"
          description="One or more of the selected devices could not be loaded. Try selecting different devices."
        />
      )}
    </div>
  );
}

function SpecRow({
  row,
  products,
  identical,
}: {
  row: CompareRow;
  products: CompareResult['products'];
  identical: boolean;
}) {
  const isNumeric = row.numeric;
  const cells = row.cells;

  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(180px,1fr)_repeat(4,minmax(160px,1fr))] gap-4 items-center py-3 border-t border-line',
        identical && 'opacity-60'
      )}
    >
      <div className="text-sm font-medium text-ink-2">
        <span className="truncate">{row.label}</span>
        {row.unit && <span className="ml-1.5 text-xs text-ink-4">({row.unit})</span>}
      </div>
      {cells.map((cell) => {
        const product = products.find((p) => p.id === cell.productId);
        const isWinner = cell.isWinner && !identical;
        const barPct = cell.barPct;

        return (
          <div
            key={cell.productId}
            className={cn('text-center', isWinner && 'relative')}
          >
            {isNumeric && cell.number !== null && (
              <div className="relative h-4 mb-1" style={{ height: 4 }}>
                <div
                  className="absolute top-0 bottom-0 rounded-full bg-volt-400/30 transition-all"
                  style={{ width: `${barPct ?? 0}%` }}
                  aria-hidden
                />
              </div>
            )}
            <div className={cn('tabular text-lg font-semibold text-ink', isWinner && 'text-volt-300')}>
              {cell.value}
            </div>
            {isWinner && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-bold text-volt-300 whitespace-nowrap">Best</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}