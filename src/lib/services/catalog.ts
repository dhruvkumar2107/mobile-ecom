import 'server-only';

import { db } from '../db';
import { Prisma } from '@prisma/client';
import { AppError } from '../api';
import { parseJson, unique } from '../utils';
import { getSellableMap } from './inventory';
import {
  computeEmi,
  loadPricingContext,
  resolvePrice,
  type PricingContextData,
  type PricedResult,
} from './pricing';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  CATALOG — listing, faceted spec filters, PDP, comparison
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Two decisions shape this whole module.
 *
 *  1. Filtering and faceting happen in memory, not in SQL.
 *
 *     The price a customer sees is not a column — it is the output of the
 *     pricing engine (flash sales, rules, loyalty tier). A SQL `WHERE
 *     pricePaise BETWEEN` filter would therefore disagree with the price on
 *     the tile the moment a flash sale is live, and "filter by under ₹30,000"
 *     would hide the very phone that is on sale for ₹28,000. So SQL narrows to
 *     the cheap, exact dimensions (status, category, text) and everything
 *     price- or stock-derived is decided after the pricing engine has run.
 *
 *     It also gives correct facet counts. A facet count must exclude its own
 *     dimension — after you tick "Samsung", the brand list still has to show
 *     how many Apple phones match the *rest* of your filters, or the panel is
 *     a dead end. That is trivial with predicates over a materialised set and
 *     genuinely awkward in SQL.
 *
 *     The cost is a scan ceiling (MAX_SCAN). At this catalogue size that is
 *     nowhere near binding, and `truncated` is returned rather than hidden so
 *     the caller never mistakes a capped result for a complete one.
 *
 *  2. Specs are data, not columns. SpecDefinition rows drive the filter panel,
 *     the spec sheet, and the comparison bars. Adding "IP rating" to the
 *     filters is an admin action, not a deploy.
 */

const MAX_SCAN = 500;

export const CATALOG_SORTS = [
  'featured',
  'newest',
  'price_asc',
  'price_desc',
  'rating',
  'popular',
  'discount',
] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const CATALOG_SORT_LABEL: Record<CatalogSort, string> = {
  featured: 'Featured',
  newest: 'Newest first',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  rating: 'Top rated',
  popular: 'Best selling',
  discount: 'Biggest discount',
};

/** One numeric/enum/boolean constraint against a SpecDefinition key. */
export type SpecFilter = {
  key: string;
  min?: number;
  max?: number;
  /** For text/enum specs. */
  values?: string[];
  /** For boolean specs — `true` means "must have it". */
  bool?: boolean;
};

export type ProductFilter = {
  q?: string;
  brandSlugs?: string[];
  categorySlug?: string;
  kinds?: string[];
  minPricePaise?: number;
  maxPricePaise?: number;
  ramGb?: number[];
  storageGb?: number[];
  colors?: string[];
  badges?: string[];
  ratingMin?: number;
  inStockOnly?: boolean;
  specs?: SpecFilter[];
  sort?: CatalogSort;
  page?: number;
  perPage?: number;
  loyaltyTier?: string | null;
  /** Include `coming_soon` products. Off by default outside the launch rail. */
  includeUpcoming?: boolean;
};

export type KeySpec = {
  key: string;
  label: string;
  value: string;
  unit: string | null;
  groupName: string;
};

export type ColorChip = { name: string; hex: string; hex2: string | null; finish: string | null };

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  kind: string;
  status: string;
  brand: { id: string; name: string; slug: string; accent: string };
  category: { id: string; name: string; slug: string };
  heroGradient: string;
  imageUrl?: string | null;
  badges: string[];
  highlights: string[];
  ratingAvg: number;
  reviewCount: number;
  soldCount: number;
  mrpPaise: number;
  pricePaise: number;
  finalPaise: number;
  discountPaise: number;
  discountPercent: number;
  flashSale: PricedResult['flashSale'];
  keySpecs: KeySpec[];
  colors: ColorChip[];
  ramOptions: number[];
  storageOptions: number[];
  variantCount: number;
  defaultVariantId: string;
  sellable: number;
  inStock: boolean;
  isPreorder: boolean;
  launchDate: Date | null;
  preorderReleaseAt: Date | null;
  /** Cheapest monthly instalment across active plans, for the "from ₹X/mo" line. */
  lowestEmiPaise: number | null;
  createdAt: Date;
};

export type FacetOption = {
  value: string;
  label: string;
  count: number;
  /** Present on brand facets so the chip can carry the brand colour. */
  accent?: string;
};

export type PriceBucket = {
  label: string;
  minPaise: number;
  maxPaise: number | null;
  count: number;
};

export type SpecFacet = {
  key: string;
  label: string;
  unit: string | null;
  groupName: string;
  dataType: string;
  higherIsBetter: boolean;
  /** Numeric specs expose a slider range. */
  range: { min: number; max: number } | null;
  /** Text/enum/boolean specs expose checkboxes. */
  options: FacetOption[];
};

export type Facets = {
  brands: FacetOption[];
  categories: FacetOption[];
  kinds: FacetOption[];
  ram: FacetOption[];
  storage: FacetOption[];
  colors: (FacetOption & { hex: string; hex2: string | null })[];
  badges: FacetOption[];
  ratings: FacetOption[];
  price: { minPaise: number; maxPaise: number; buckets: PriceBucket[] };
  availability: { inStock: number; total: number };
  specs: SpecFacet[];
};

export type ListResult = {
  items: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
  facets: Facets;
  /** True when the scan ceiling was hit — the caller should narrow the query. */
  truncated: boolean;
};

// ── Loading ───────────────────────────────────────────────────────────

const PRODUCT_INCLUDE = {
  brand: { select: { id: true, name: true, slug: true, accent: true, country: true } },
  category: { select: { id: true, name: true, slug: true } },
  variants: {
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { pricePaise: 'asc' }],
  },
  specValues: { include: { definition: true } },
} satisfies Prisma.ProductInclude;

type LoadedProduct = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

/** Everything the card/detail builders need, fetched once per request. */
async function loadContext() {
  const [pricing, emiPlans, specDefs] = await Promise.all([
    loadPricingContext(),
    db.emiPlan.findMany({
      where: { isActive: true },
      select: {
        brandId: true,
        tenureMonths: true,
        interestBps: true,
        isNoCost: true,
        processingFeePaise: true,
        minOrderPaise: true,
      },
    }),
    db.specDefinition.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] }),
  ]);
  return { pricing, emiPlans, specDefs };
}

type CatalogContext = Awaited<ReturnType<typeof loadContext>>;

/** Cheapest instalment for an amount, computed from plans already in memory. */
function lowestEmiFor(
  amountPaise: number,
  brandId: string,
  plans: CatalogContext['emiPlans'],
): number | null {
  let lowest: number | null = null;
  for (const plan of plans) {
    if (plan.brandId !== null && plan.brandId !== brandId) continue;
    if (amountPaise < plan.minOrderPaise) continue;
    const { monthlyPaise } = computeEmi(
      amountPaise,
      plan.tenureMonths,
      plan.interestBps,
      plan.isNoCost,
      plan.processingFeePaise,
    );
    if (lowest === null || monthlyPaise < lowest) lowest = monthlyPaise;
  }
  return lowest;
}

export function formatSpecValue(
  def: { unit: string | null; dataType: string },
  value: { valueText: string | null; valueNumber: number | null; valueBool: boolean | null },
): string {
  if (value.valueBool !== null) return value.valueBool ? 'Yes' : 'No';
  if (value.valueNumber !== null) {
    const n = Number.isInteger(value.valueNumber)
      ? value.valueNumber.toString()
      : value.valueNumber.toFixed(1);
    return def.unit ? `${n} ${def.unit}` : n;
  }
  return value.valueText ?? '—';
}

/**
 * A product's sale price is the cheapest of its variants after the pricing
 * engine — that is the number on the tile, so it is also the number the price
 * filter and the price sort must use.
 */
function priceProduct(
  product: LoadedProduct,
  ctx: CatalogContext,
  loyaltyTier: string | null | undefined,
): { best: PricedResult; variantId: string } | null {
  let best: PricedResult | null = null;
  let variantId = '';
  for (const variant of product.variants) {
    const priced = resolvePrice(
      variant,
      {
        brandId: product.brandId,
        categoryId: product.categoryId,
        productId: product.id,
        variantId: variant.id,
        loyaltyTier,
      },
      ctx.pricing,
    );
    if (!best || priced.finalPaise < best.finalPaise) {
      best = priced;
      variantId = variant.id;
    }
  }
  return best ? { best, variantId } : null;
}

function toCard(
  product: LoadedProduct,
  ctx: CatalogContext,
  priced: PricedResult,
  defaultVariantId: string,
  sellable: number,
): ProductCard {
  const keySpecs = product.specValues
    .filter((v) => v.definition.isKeySpec)
    .sort((a, b) => a.definition.sortOrder - b.definition.sortOrder)
    .slice(0, 4)
    .map((v) => ({
      key: v.definition.key,
      label: v.definition.label,
      value: formatSpecValue(v.definition, v),
      unit: v.definition.unit,
      groupName: v.definition.groupName,
    }));

  const colors: ColorChip[] = [];
  for (const variant of product.variants) {
    if (colors.some((c) => c.name === variant.colorName)) continue;
    colors.push({
      name: variant.colorName,
      hex: variant.colorHex,
      hex2: variant.colorHex2,
      finish: variant.finish,
    });
  }

  const preferred =
    product.variants.find((v) => v.id === defaultVariantId) ??
    product.variants.find((v) => v.isDefault) ??
    product.variants[0];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    kind: product.kind,
    status: product.status,
    brand: product.brand,
    category: product.category,
    heroGradient: product.heroGradient,
    imageUrl: preferred?.imageUrl ?? product.imageUrl ?? null,
    badges: parseJson<string[]>(product.badges, []),
    highlights: parseJson<string[]>(product.highlights, []),
    ratingAvg: product.ratingAvg,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
    mrpPaise: preferred?.mrpPaise ?? product.mrpPaise,
    pricePaise: priced.pricePaise,
    finalPaise: priced.finalPaise,
    discountPaise: priced.discountPaise,
    discountPercent: priced.discountPercent,
    flashSale: priced.flashSale,
    keySpecs,
    colors,
    ramOptions: unique(
      product.variants.map((v) => v.ramGb).filter((v): v is number => v !== null),
    ).sort((a, b) => a - b),
    storageOptions: unique(
      product.variants.map((v) => v.storageGb).filter((v): v is number => v !== null),
    ).sort((a, b) => a - b),
    variantCount: product.variants.length,
    defaultVariantId,
    sellable,
    inStock: sellable > 0,
    isPreorder: product.isPreorder,
    launchDate: product.launchDate,
    preorderReleaseAt: product.preorderReleaseAt,
    lowestEmiPaise: lowestEmiFor(priced.finalPaise, product.brandId, ctx.emiPlans),
    createdAt: product.createdAt,
  };
}

// ── Faceted listing ───────────────────────────────────────────────────

type Candidate = {
  product: LoadedProduct;
  card: ProductCard;
  /** Flattened spec lookup so predicates don't re-scan the relation. */
  specs: Map<string, { text: string | null; number: number | null; bool: boolean | null }>;
};

/**
 * Each dimension is a named predicate. Facet counts for dimension D are taken
 * over the candidates that satisfy every predicate *except* D — the standard
 * behaviour that keeps a multi-select filter panel navigable.
 */
type Predicate = { name: string; test: (c: Candidate) => boolean };

function buildPredicates(filter: ProductFilter): Predicate[] {
  const preds: Predicate[] = [];

  if (filter.brandSlugs?.length) {
    const set = new Set(filter.brandSlugs);
    preds.push({ name: 'brand', test: (c) => set.has(c.card.brand.slug) });
  }
  if (filter.kinds?.length) {
    const set = new Set(filter.kinds);
    preds.push({ name: 'kind', test: (c) => set.has(c.card.kind) });
  }
  if (filter.ramGb?.length) {
    const set = new Set(filter.ramGb);
    preds.push({
      name: 'ram',
      test: (c) => c.card.ramOptions.some((r) => set.has(r)),
    });
  }
  if (filter.storageGb?.length) {
    const set = new Set(filter.storageGb);
    preds.push({
      name: 'storage',
      test: (c) => c.card.storageOptions.some((s) => set.has(s)),
    });
  }
  if (filter.colors?.length) {
    const set = new Set(filter.colors.map((c) => c.toLowerCase()));
    preds.push({
      name: 'color',
      test: (c) => c.card.colors.some((col) => set.has(col.name.toLowerCase())),
    });
  }
  if (filter.badges?.length) {
    const set = new Set(filter.badges.map((b) => b.toLowerCase()));
    preds.push({
      name: 'badge',
      test: (c) => c.card.badges.some((b) => set.has(b.toLowerCase())),
    });
  }
  if (filter.minPricePaise !== undefined || filter.maxPricePaise !== undefined) {
    const lo = filter.minPricePaise ?? 0;
    const hi = filter.maxPricePaise ?? Number.MAX_SAFE_INTEGER;
    preds.push({
      name: 'price',
      test: (c) => c.card.finalPaise >= lo && c.card.finalPaise <= hi,
    });
  }
  if (filter.ratingMin) {
    const min = filter.ratingMin;
    preds.push({ name: 'rating', test: (c) => c.card.ratingAvg >= min });
  }
  if (filter.inStockOnly) {
    // Pre-orders have no sellable stock yet but are absolutely purchasable.
    preds.push({
      name: 'availability',
      test: (c) => c.card.inStock || c.card.isPreorder,
    });
  }
  for (const spec of filter.specs ?? []) {
    preds.push({
      name: `spec:${spec.key}`,
      test: (c) => {
        const value = c.specs.get(spec.key);
        if (!value) return false;
        if (spec.bool !== undefined) return value.bool === spec.bool;
        if (spec.values?.length) {
          const text = value.text ?? (value.number !== null ? String(value.number) : null);
          return text !== null && spec.values.some((v) => v.toLowerCase() === text.toLowerCase());
        }
        if (spec.min !== undefined || spec.max !== undefined) {
          if (value.number === null) return false;
          if (spec.min !== undefined && value.number < spec.min) return false;
          if (spec.max !== undefined && value.number > spec.max) return false;
        }
        return true;
      },
    });
  }

  return preds;
}

function passesAllExcept(c: Candidate, preds: Predicate[], skip: string | null): boolean {
  for (const p of preds) {
    if (skip !== null && (p.name === skip || (skip === 'spec' && p.name.startsWith('spec:')))) {
      continue;
    }
    if (!p.test(c)) return false;
  }
  return true;
}

function tally(
  candidates: Candidate[],
  keyOf: (c: Candidate) => { value: string; label: string; accent?: string }[],
): FacetOption[] {
  const map = new Map<string, FacetOption>();
  for (const c of candidates) {
    for (const k of keyOf(c)) {
      const existing = map.get(k.value);
      if (existing) existing.count += 1;
      else map.set(k.value, { ...k, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const PRICE_BUCKETS: Array<{ label: string; minPaise: number; maxPaise: number | null }> = [
  { label: 'Under ₹15,000', minPaise: 0, maxPaise: 1_500_000 },
  { label: '₹15,000 – ₹25,000', minPaise: 1_500_000, maxPaise: 2_500_000 },
  { label: '₹25,000 – ₹40,000', minPaise: 2_500_000, maxPaise: 4_000_000 },
  { label: '₹40,000 – ₹70,000', minPaise: 4_000_000, maxPaise: 7_000_000 },
  { label: '₹70,000 – ₹1,00,000', minPaise: 7_000_000, maxPaise: 10_000_000 },
  { label: 'Above ₹1,00,000', minPaise: 10_000_000, maxPaise: null },
];

function buildFacets(
  candidates: Candidate[],
  preds: Predicate[],
  specDefs: CatalogContext['specDefs'],
): Facets {
  const forDim = (dim: string) => candidates.filter((c) => passesAllExcept(c, preds, dim));

  const brandSet = forDim('brand');
  const kindSet = forDim('kind');
  const ramSet = forDim('ram');
  const storageSet = forDim('storage');
  const colorSet = forDim('color');
  const badgeSet = forDim('badge');
  const priceSet = forDim('price');
  const ratingSet = forDim('rating');
  const availSet = forDim('availability');
  const specSet = forDim('spec');

  const colorRows = new Map<string, FacetOption & { hex: string; hex2: string | null }>();
  for (const c of colorSet) {
    for (const col of c.card.colors) {
      const key = col.name.toLowerCase();
      const existing = colorRows.get(key);
      if (existing) existing.count += 1;
      else
        colorRows.set(key, {
          value: col.name,
          label: col.name,
          count: 1,
          hex: col.hex,
          hex2: col.hex2,
        });
    }
  }

  const prices = priceSet.map((c) => c.card.finalPaise);
  const buckets: PriceBucket[] = PRICE_BUCKETS.map((b) => ({
    ...b,
    count: prices.filter((p) => p >= b.minPaise && (b.maxPaise === null || p < b.maxPaise)).length,
  })).filter((b) => b.count > 0);

  const specFacets: SpecFacet[] = [];
  for (const def of specDefs) {
    if (!def.isFilterable) continue;
    const rows = specSet
      .map((c) => c.specs.get(def.key))
      .filter((v): v is NonNullable<typeof v> => v !== undefined);
    if (!rows.length) continue;

    if (def.dataType === 'number') {
      const numbers = rows.map((r) => r.number).filter((n): n is number => n !== null);
      if (!numbers.length) continue;
      specFacets.push({
        key: def.key,
        label: def.label,
        unit: def.unit,
        groupName: def.groupName,
        dataType: def.dataType,
        higherIsBetter: def.higherIsBetter,
        range: { min: Math.min(...numbers), max: Math.max(...numbers) },
        options: [],
      });
      continue;
    }

    const counts = new Map<string, FacetOption>();
    for (const row of rows) {
      const raw =
        row.bool !== null
          ? row.bool
            ? 'Yes'
            : 'No'
          : (row.text ?? (row.number !== null ? String(row.number) : null));
      if (raw === null) continue;
      const existing = counts.get(raw);
      if (existing) existing.count += 1;
      else counts.set(raw, { value: raw, label: raw, count: 1 });
    }
    if (!counts.size) continue;
    specFacets.push({
      key: def.key,
      label: def.label,
      unit: def.unit,
      groupName: def.groupName,
      dataType: def.dataType,
      higherIsBetter: def.higherIsBetter,
      range: null,
      options: [...counts.values()].sort((a, b) => b.count - a.count),
    });
  }

  return {
    brands: tally(brandSet, (c) => [
      { value: c.card.brand.slug, label: c.card.brand.name, accent: c.card.brand.accent },
    ]),
    categories: tally(candidates, (c) => [
      { value: c.card.category.slug, label: c.card.category.name },
    ]),
    kinds: tally(kindSet, (c) => [{ value: c.card.kind, label: c.card.kind }]),
    ram: tally(ramSet, (c) =>
      c.card.ramOptions.map((r) => ({ value: String(r), label: `${r} GB` })),
    ).sort((a, b) => Number(a.value) - Number(b.value)),
    storage: tally(storageSet, (c) =>
      c.card.storageOptions.map((s) => ({
        value: String(s),
        label: s >= 1024 ? `${s / 1024} TB` : `${s} GB`,
      })),
    ).sort((a, b) => Number(a.value) - Number(b.value)),
    colors: [...colorRows.values()].sort((a, b) => b.count - a.count),
    badges: tally(badgeSet, (c) => c.card.badges.map((b) => ({ value: b, label: b }))),
    ratings: [4, 3].map((min) => ({
      value: String(min),
      label: `${min}★ & above`,
      count: ratingSet.filter((c) => c.card.ratingAvg >= min).length,
    })).filter((r) => r.count > 0),
    price: {
      minPaise: prices.length ? Math.min(...prices) : 0,
      maxPaise: prices.length ? Math.max(...prices) : 0,
      buckets,
    },
    availability: {
      inStock: availSet.filter((c) => c.card.inStock).length,
      total: availSet.length,
    },
    specs: specFacets,
  };
}

function sortCards(items: ProductCard[], sort: CatalogSort): ProductCard[] {
  const sorted = [...items];
  switch (sort) {
    case 'price_asc':
      sorted.sort((a, b) => a.finalPaise - b.finalPaise);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.finalPaise - a.finalPaise);
      break;
    case 'newest':
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case 'rating':
      // A 5.0 from one reviewer should not outrank a 4.7 from three hundred.
      sorted.sort(
        (a, b) =>
          b.ratingAvg * Math.log10(b.reviewCount + 10) -
          a.ratingAvg * Math.log10(a.reviewCount + 10),
      );
      break;
    case 'popular':
      sorted.sort((a, b) => b.soldCount - a.soldCount || b.reviewCount - a.reviewCount);
      break;
    case 'discount':
      sorted.sort((a, b) => b.discountPercent - a.discountPercent);
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
        // Out of stock sinks, however featured it is.
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        return b.soldCount - a.soldCount;
      });
      break;
  }
  return sorted;
}

export async function listProducts(filter: ProductFilter = {}): Promise<ListResult> {
  const page = Math.max(1, filter.page ?? 1);
  const perPage = Math.min(60, Math.max(1, filter.perPage ?? 12));

  const statuses = filter.includeUpcoming ? ['active', 'coming_soon'] : ['active'];
  const where: Record<string, unknown> = { status: { in: statuses } };

  if (filter.categorySlug) {
    // A category page shows its children too, so "Mobiles" isn't empty when
    // every product sits under "Mobiles › Flagship".
    const category = await db.category.findUnique({
      where: { slug: filter.categorySlug },
      select: { id: true, children: { select: { id: true } } },
    });
    if (!category) throw new AppError('Category not found.', 404);
    where.categoryId = { in: [category.id, ...category.children.map((c) => c.id)] };
  }

  if (filter.q?.trim()) {
    const q = filter.q.trim();
    where.OR = [
      { name: { contains: q } },
      { tagline: { contains: q } },
      { description: { contains: q } },
      { brand: { name: { contains: q } } },
      { variants: { some: { sku: { contains: q } } } },
    ];
  }

  const [products, ctx] = await Promise.all([
    db.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      take: MAX_SCAN + 1,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    loadContext(),
  ]);

  const truncated = products.length > MAX_SCAN;
  const scanned = truncated ? products.slice(0, MAX_SCAN) : products;

  const sellableMap = await getSellableMap(scanned.flatMap((p) => p.variants.map((v) => v.id)));

  const candidates: Candidate[] = [];
  for (const product of scanned) {
    const priced = priceProduct(product, ctx, filter.loyaltyTier);
    if (!priced) continue; // No active variant — nothing to sell.
    const sellable = product.variants.reduce(
      (total, v) => total + (sellableMap.get(v.id) ?? 0),
      0,
    );
    const card = toCard(product, ctx, priced.best, priced.variantId, sellable);
    const specs = new Map<string, { text: string | null; number: number | null; bool: boolean | null }>();
    for (const value of product.specValues) {
      specs.set(value.definition.key, {
        text: value.valueText,
        number: value.valueNumber,
        bool: value.valueBool,
      });
    }
    candidates.push({ product, card, specs });
  }

  const preds = buildPredicates(filter);
  const matched = candidates.filter((c) => passesAllExcept(c, preds, null));
  const facets = buildFacets(candidates, preds, ctx.specDefs);

  const sorted = sortCards(
    matched.map((c) => c.card),
    filter.sort ?? 'featured',
  );

  const total = sorted.length;
  return {
    items: sorted.slice((page - 1) * perPage, page * perPage),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    facets,
    truncated,
  };
}

// ── Product detail ────────────────────────────────────────────────────

export type VariantView = {
  id: string;
  sku: string;
  ramGb: number | null;
  storageGb: number | null;
  colorName: string;
  colorHex: string;
  colorHex2: string | null;
  finish: string | null;
  imageUrl?: string | null;
  isDefault: boolean;
  mrpPaise: number;
  pricePaise: number;
  finalPaise: number;
  discountPaise: number;
  discountPercent: number;
  flashSale: PricedResult['flashSale'];
  sellable: number;
  inStock: boolean;
  /** Drives the "Only 2 left" urgency line without inventing scarcity. */
  lowStock: boolean;
  weightGrams: number | null;
};

export type SpecGroup = {
  groupName: string;
  rows: Array<{
    key: string;
    label: string;
    value: string;
    unit: string | null;
    isKeySpec: boolean;
  }>;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  kind: string;
  status: string;
  brand: { id: string; name: string; slug: string; accent: string; country: string | null };
  category: { id: string; name: string; slug: string };
  heroGradient: string;
  imageUrl?: string | null;
  badges: string[];
  highlights: string[];
  unboxingVideoUrl: string | null;
  reviewVideoUrl: string | null;
  warrantyMonths: number;
  gstRate: number;
  hsnCode: string;
  isPreorder: boolean;
  launchDate: Date | null;
  preorderReleaseAt: Date | null;
  preorderDepositPaise: number | null;
  ratingAvg: number;
  reviewCount: number;
  soldCount: number;
  seo: { title: string; description: string; keywords: string | null };
  variants: VariantView[];
  ramOptions: number[];
  storageOptions: number[];
  colors: ColorChip[];
  specGroups: SpecGroup[];
  keySpecs: KeySpec[];
  ratingBreakdown: Array<{ rating: number; count: number; percent: number }>;
  /** 360° viewer metadata — frames are rendered client-side per colour. */
  viewer: { frames: number; colors: ColorChip[] };
  priceRange: { minPaise: number; maxPaise: number };
  lowestEmiPaise: number | null;
  defaultVariantId: string;
};

export async function getProductBySlug(
  slug: string,
  opts: { loyaltyTier?: string | null; includeDraft?: boolean } = {},
): Promise<ProductDetail> {
  const product = await db.product.findUnique({ where: { slug }, include: PRODUCT_INCLUDE });
  if (!product) throw new AppError('Product not found.', 404);
  if (product.status === 'archived' && !opts.includeDraft) {
    throw new AppError('This product is no longer available.', 404);
  }
  if (product.status === 'draft' && !opts.includeDraft) {
    throw new AppError('Product not found.', 404);
  }

  const [ctx, sellableMap, ratingRows, settings] = await Promise.all([
    loadContext(),
    getSellableMap(product.variants.map((v) => v.id)),
    db.review.groupBy({
      by: ['rating'],
      where: { productId: product.id, status: 'approved' },
      _count: { rating: true },
    }),
    db.setting.findUnique({ where: { key: 'lowStockThreshold' } }),
  ]);

  const lowStockAt = settings ? Number(settings.value) || 5 : 5;

  const variants: VariantView[] = product.variants.map((variant) => {
    const priced = resolvePrice(
      variant,
      {
        brandId: product.brandId,
        categoryId: product.categoryId,
        productId: product.id,
        variantId: variant.id,
        loyaltyTier: opts.loyaltyTier,
      },
      ctx.pricing,
    );
    const sellable = sellableMap.get(variant.id) ?? 0;
    return {
      id: variant.id,
      sku: variant.sku,
      ramGb: variant.ramGb,
      storageGb: variant.storageGb,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      colorHex2: variant.colorHex2,
      finish: variant.finish,
      imageUrl: variant.imageUrl ?? product.imageUrl ?? null,
      isDefault: variant.isDefault,
      mrpPaise: priced.mrpPaise,
      pricePaise: priced.pricePaise,
      finalPaise: priced.finalPaise,
      discountPaise: priced.discountPaise,
      discountPercent: priced.discountPercent,
      flashSale: priced.flashSale,
      sellable,
      inStock: sellable > 0,
      lowStock: sellable > 0 && sellable <= lowStockAt,
      weightGrams: variant.weightGrams,
    };
  });

  const groups = new Map<string, SpecGroup>();
  const ordered = [...product.specValues].sort(
    (a, b) =>
      a.definition.sortOrder - b.definition.sortOrder ||
      a.definition.label.localeCompare(b.definition.label),
  );
  for (const value of ordered) {
    const name = value.definition.groupName;
    if (!groups.has(name)) groups.set(name, { groupName: name, rows: [] });
    groups.get(name)!.rows.push({
      key: value.definition.key,
      label: value.definition.label,
      value: formatSpecValue(value.definition, value),
      unit: value.definition.unit,
      isKeySpec: value.definition.isKeySpec,
    });
  }

  const totalReviews = ratingRows.reduce((n, r) => n + r._count.rating, 0);
  const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => {
    const count = ratingRows.find((r) => r.rating === rating)?._count.rating ?? 0;
    return {
      rating,
      count,
      percent: totalReviews ? Math.round((count / totalReviews) * 100) : 0,
    };
  });

  const colors: ColorChip[] = [];
  for (const variant of product.variants) {
    if (colors.some((c) => c.name === variant.colorName)) continue;
    colors.push({
      name: variant.colorName,
      hex: variant.colorHex,
      hex2: variant.colorHex2,
      finish: variant.finish,
    });
  }

  const finals = variants.map((v) => v.finalPaise);
  const defaultVariant =
    variants.find((v) => v.isDefault && v.inStock) ??
    variants.find((v) => v.inStock) ??
    variants.find((v) => v.isDefault) ??
    variants[0];

  if (!defaultVariant) throw new AppError('This product has no purchasable variant.', 409);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    kind: product.kind,
    status: product.status,
    brand: { ...product.brand, country: product.brand.country },
    category: product.category,
    heroGradient: product.heroGradient,
    imageUrl: product.imageUrl ?? null,
    badges: parseJson<string[]>(product.badges, []),
    highlights: parseJson<string[]>(product.highlights, []),
    unboxingVideoUrl: product.unboxingVideoUrl,
    reviewVideoUrl: product.reviewVideoUrl,
    warrantyMonths: product.warrantyMonths,
    gstRate: product.gstRate,
    hsnCode: product.hsnCode,
    isPreorder: product.isPreorder,
    launchDate: product.launchDate,
    preorderReleaseAt: product.preorderReleaseAt,
    preorderDepositPaise: product.preorderDepositPaise,
    ratingAvg: product.ratingAvg,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
    seo: {
      title: product.seoTitle ?? `${product.name} — price, specs & offers | VOLTAGE`,
      description:
        product.seoDescription ??
        product.tagline ??
        `Buy the ${product.name} at VOLTAGE with no-cost EMI, exchange offers and genuine warranty.`,
      keywords: product.seoKeywords,
    },
    variants,
    ramOptions: unique(variants.map((v) => v.ramGb).filter((v): v is number => v !== null)).sort(
      (a, b) => a - b,
    ),
    storageOptions: unique(
      variants.map((v) => v.storageGb).filter((v): v is number => v !== null),
    ).sort((a, b) => a - b),
    colors,
    specGroups: [...groups.values()],
    keySpecs: ordered
      .filter((v) => v.definition.isKeySpec)
      .slice(0, 6)
      .map((v) => ({
        key: v.definition.key,
        label: v.definition.label,
        value: formatSpecValue(v.definition, v),
        unit: v.definition.unit,
        groupName: v.definition.groupName,
      })),
    ratingBreakdown,
    viewer: { frames: 36, colors },
    priceRange: {
      minPaise: finals.length ? Math.min(...finals) : product.pricePaise,
      maxPaise: finals.length ? Math.max(...finals) : product.pricePaise,
    },
    lowestEmiPaise: lowestEmiFor(defaultVariant.finalPaise, product.brandId, ctx.emiPlans),
    defaultVariantId: defaultVariant.id,
  };
}

/** Resolves a (colour, RAM, storage) selection back to a concrete variant. */
export async function findVariant(
  productId: string,
  choice: { colorName?: string; ramGb?: number | null; storageGb?: number | null },
) {
  const variants = await db.productVariant.findMany({
    where: { productId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  const match = variants.find(
    (v) =>
      (choice.colorName === undefined ||
        v.colorName.toLowerCase() === choice.colorName.toLowerCase()) &&
      (choice.ramGb === undefined || v.ramGb === choice.ramGb) &&
      (choice.storageGb === undefined || v.storageGb === choice.storageGb),
  );
  if (!match) throw new AppError('That configuration is not available.', 404);
  return match;
}

// ── Comparison ────────────────────────────────────────────────────────

export const MAX_COMPARE = 4;

export type CompareCell = {
  productId: string;
  value: string;
  /** Raw number when the spec is numeric — drives the animated count-up. */
  number: number | null;
  /** 0–100, for the animated bar. Null when the spec isn't measurable. */
  barPct: number | null;
  isWinner: boolean;
};

export type CompareRow = {
  key: string;
  label: string;
  unit: string | null;
  groupName: string;
  higherIsBetter: boolean;
  numeric: boolean;
  /** True when every product answers the same — the UI can collapse it. */
  identical: boolean;
  cells: CompareCell[];
};

export type CompareResult = {
  products: ProductCard[];
  groups: Array<{ groupName: string; rows: CompareRow[] }>;
  /** Rows where the devices actually differ, for "show differences only". */
  differenceCount: number;
};

/**
 * Side-by-side comparison of up to four devices.
 *
 * Bars are normalised against the spec's `scaleMax` when the admin set one, and
 * against the best value in the row otherwise. Using the row maximum alone
 * would make a 4000 mAh battery look like a third of a 4500 mAh one on a bar
 * that starts at the lowest value, which is visually dishonest — so the scale
 * always starts at zero.
 */
export async function compareProducts(
  slugs: string[],
  opts: { loyaltyTier?: string | null } = {},
): Promise<CompareResult> {
  const wanted = unique(slugs).slice(0, MAX_COMPARE);
  if (wanted.length < 2) throw new AppError('Pick at least two devices to compare.', 400);

  const [rows, ctx] = await Promise.all([
    db.product.findMany({
      where: { slug: { in: wanted }, status: { in: ['active', 'coming_soon'] } },
      include: PRODUCT_INCLUDE,
    }),
    loadContext(),
  ]);
  if (rows.length < 2) throw new AppError('Could not find enough of those devices.', 404);

  // Preserve the order the customer added them in.
  const products = wanted
    .map((slug) => rows.find((r) => r.slug === slug))
    .filter((p): p is LoadedProduct => p !== undefined);

  const sellableMap = await getSellableMap(products.flatMap((p) => p.variants.map((v) => v.id)));

  const cards: ProductCard[] = [];
  for (const product of products) {
    const priced = priceProduct(product, ctx, opts.loyaltyTier);
    if (!priced) continue;
    const sellable = product.variants.reduce((t, v) => t + (sellableMap.get(v.id) ?? 0), 0);
    cards.push(toCard(product, ctx, priced.best, priced.variantId, sellable));
  }

  const comparable = ctx.specDefs.filter((d) => d.isComparable);
  const bySpec = new Map<string, Map<string, (typeof products)[number]['specValues'][number]>>();
  for (const product of products) {
    for (const value of product.specValues) {
      if (!bySpec.has(value.definition.key)) bySpec.set(value.definition.key, new Map());
      bySpec.get(value.definition.key)!.set(product.id, value);
    }
  }

  const rowsOut: CompareRow[] = [];

  // Price and rating are compared like specs, because they are what people
  // actually compare — but with `higherIsBetter` inverted for price.
  const priceCells = cards.map((c) => ({ productId: c.id, number: c.finalPaise }));
  rowsOut.push(
    numericRow({
      key: 'price',
      label: 'Price',
      unit: '₹',
      groupName: 'Overview',
      higherIsBetter: false,
      scaleMax: null,
      cells: priceCells,
      format: (n) => `₹${Math.round(n / 100).toLocaleString('en-IN')}`,
    }),
  );
  rowsOut.push(
    numericRow({
      key: 'rating',
      label: 'Customer rating',
      unit: '★',
      groupName: 'Overview',
      higherIsBetter: true,
      scaleMax: 5,
      cells: cards.map((c) => ({ productId: c.id, number: c.ratingAvg })),
      format: (n) => (n > 0 ? `${n.toFixed(1)} ★` : 'No ratings yet'),
    }),
  );
  rowsOut.push(
    numericRow({
      key: 'emi',
      label: 'EMI from',
      unit: '₹/mo',
      groupName: 'Overview',
      higherIsBetter: false,
      scaleMax: null,
      cells: cards.map((c) => ({ productId: c.id, number: c.lowestEmiPaise })),
      format: (n) => `₹${Math.round(n / 100).toLocaleString('en-IN')}/mo`,
    }),
  );
  rowsOut.push({
    key: 'warranty',
    label: 'Warranty',
    unit: 'months',
    groupName: 'Overview',
    higherIsBetter: true,
    numeric: true,
    identical: unique(products.map((p) => p.warrantyMonths)).length === 1,
    cells: buildNumericCells(
      products.map((p) => ({ productId: p.id, number: p.warrantyMonths })),
      true,
      null,
      (n) => `${n} months`,
    ),
  });

  for (const def of comparable) {
    const values = bySpec.get(def.key);
    if (!values) continue;

    const numeric =
      def.dataType === 'number' &&
      products.every((p) => (values.get(p.id)?.valueNumber ?? null) !== null);

    if (numeric) {
      rowsOut.push(
        numericRow({
          key: def.key,
          label: def.label,
          unit: def.unit,
          groupName: def.groupName,
          higherIsBetter: def.higherIsBetter,
          scaleMax: def.scaleMax,
          cells: products.map((p) => ({
            productId: p.id,
            number: values.get(p.id)?.valueNumber ?? null,
          })),
          format: (n) =>
            formatSpecValue(def, { valueText: null, valueNumber: n, valueBool: null }),
        }),
      );
      continue;
    }

    const texts = products.map((p) => {
      const value = values.get(p.id);
      return {
        productId: p.id,
        text: value ? formatSpecValue(def, value) : '—',
        bool: value?.valueBool ?? null,
      };
    });

    // For a boolean spec, "has it" is the win. For free text there is no winner.
    const anyTrue = texts.some((t) => t.bool === true);
    rowsOut.push({
      key: def.key,
      label: def.label,
      unit: def.unit,
      groupName: def.groupName,
      higherIsBetter: def.higherIsBetter,
      numeric: false,
      identical: unique(texts.map((t) => t.text)).length === 1,
      cells: texts.map((t) => ({
        productId: t.productId,
        value: t.text,
        number: null,
        barPct: t.bool === null ? null : t.bool ? 100 : 0,
        isWinner: anyTrue ? t.bool === true : false,
      })),
    });
  }

  const groups = new Map<string, { groupName: string; rows: CompareRow[] }>();
  for (const row of rowsOut) {
    if (!groups.has(row.groupName)) groups.set(row.groupName, { groupName: row.groupName, rows: [] });
    groups.get(row.groupName)!.rows.push(row);
  }

  return {
    products: cards,
    groups: [...groups.values()],
    differenceCount: rowsOut.filter((r) => !r.identical).length,
  };
}

function buildNumericCells(
  cells: Array<{ productId: string; number: number | null }>,
  higherIsBetter: boolean,
  scaleMax: number | null,
  format: (n: number) => string,
): CompareCell[] {
  const numbers = cells.map((c) => c.number).filter((n): n is number => n !== null);
  const max = scaleMax ?? (numbers.length ? Math.max(...numbers) : 0);
  const best = numbers.length
    ? higherIsBetter
      ? Math.max(...numbers)
      : Math.min(...numbers)
    : null;

  return cells.map((cell) => {
    if (cell.number === null) {
      return { productId: cell.productId, value: '—', number: null, barPct: null, isWinner: false };
    }
    // Lower-is-better rows invert the bar so the longest bar is always the win.
    const ratio = max > 0 ? cell.number / max : 0;
    const barPct = higherIsBetter
      ? Math.round(Math.min(1, ratio) * 100)
      : Math.round((1 - Math.min(1, ratio)) * 100 * 0.75 + 25);
    return {
      productId: cell.productId,
      value: format(cell.number),
      number: cell.number,
      barPct,
      isWinner: best !== null && cell.number === best && numbers.length > 1,
    };
  });
}

function numericRow(input: {
  key: string;
  label: string;
  unit: string | null;
  groupName: string;
  higherIsBetter: boolean;
  scaleMax: number | null;
  cells: Array<{ productId: string; number: number | null }>;
  format: (n: number) => string;
}): CompareRow {
  const cells = buildNumericCells(input.cells, input.higherIsBetter, input.scaleMax, input.format);
  return {
    key: input.key,
    label: input.label,
    unit: input.unit,
    groupName: input.groupName,
    higherIsBetter: input.higherIsBetter,
    numeric: true,
    identical: unique(cells.map((c) => c.value)).length === 1,
    cells,
  };
}

// ── Discovery rails ───────────────────────────────────────────────────

async function cardsFor(
  products: LoadedProduct[],
  ctx: CatalogContext,
  loyaltyTier?: string | null,
): Promise<ProductCard[]> {
  if (!products.length) return [];
  const sellableMap = await getSellableMap(products.flatMap((p) => p.variants.map((v) => v.id)));
  const out: ProductCard[] = [];
  for (const product of products) {
    const priced = priceProduct(product, ctx, loyaltyTier);
    if (!priced) continue;
    const sellable = product.variants.reduce((t, v) => t + (sellableMap.get(v.id) ?? 0), 0);
    out.push(toCard(product, ctx, priced.best, priced.variantId, sellable));
  }
  return out;
}

/** Same category, similar price — the "you may also like" rail on a PDP. */
export async function relatedProducts(
  productId: string,
  opts: { limit?: number; loyaltyTier?: string | null } = {},
): Promise<ProductCard[]> {
  const anchor = await db.product.findUnique({
    where: { id: productId },
    select: { categoryId: true, brandId: true, pricePaise: true },
  });
  if (!anchor) return [];

  const [rows, ctx] = await Promise.all([
    db.product.findMany({
      where: {
        id: { not: productId },
        status: 'active',
        OR: [{ categoryId: anchor.categoryId }, { brandId: anchor.brandId }],
        pricePaise: {
          gte: Math.round(anchor.pricePaise * 0.5),
          lte: Math.round(anchor.pricePaise * 1.8),
        },
      },
      include: PRODUCT_INCLUDE,
      take: (opts.limit ?? 8) * 2,
      orderBy: [{ soldCount: 'desc' }, { ratingAvg: 'desc' }],
    }),
    loadContext(),
  ]);

  const cards = await cardsFor(rows, ctx, opts.loyaltyTier);
  return cards.slice(0, opts.limit ?? 8);
}

export type AccessorySuggestion = ProductCard & {
  bundleDiscountPct: number;
  bundlePricePaise: number;
};

/** Accessories the admin linked to a product, priced with the bundle discount. */
export async function accessoriesFor(
  productId: string,
  opts: { loyaltyTier?: string | null } = {},
): Promise<AccessorySuggestion[]> {
  const [links, ctx] = await Promise.all([
    db.accessoryLink.findMany({
      where: { productId, accessory: { status: 'active' } },
      include: { accessory: { include: PRODUCT_INCLUDE } },
      orderBy: { sortOrder: 'asc' },
    }),
    loadContext(),
  ]);

  const cards = await cardsFor(
    links.map((l) => l.accessory),
    ctx,
    opts.loyaltyTier,
  );

  return cards.map((card) => {
    const pct = links.find((l) => l.accessoryId === card.id)?.bundleDiscountPct ?? 0;
    return {
      ...card,
      bundleDiscountPct: pct,
      bundlePricePaise: Math.round(card.finalPaise * (1 - pct / 100)),
    };
  });
}

/**
 * Bundle suggestions for the checkout page: accessories linked to anything in
 * the cart, minus what's already in it.
 */
export async function bundleSuggestions(
  variantIds: string[],
  opts: { loyaltyTier?: string | null; limit?: number } = {},
): Promise<AccessorySuggestion[]> {
  if (!variantIds.length) return [];
  const inCart = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { productId: true },
  });
  const productIds = unique(inCart.map((v) => v.productId));

  const links = await db.accessoryLink.findMany({
    where: {
      productId: { in: productIds },
      accessoryId: { notIn: productIds },
      accessory: { status: 'active' },
    },
    include: { accessory: { include: PRODUCT_INCLUDE } },
    orderBy: { sortOrder: 'asc' },
  });

  // The same case may be linked from three phones — offer it once, at its best
  // discount.
  const bestByAccessory = new Map<string, (typeof links)[number]>();
  for (const link of links) {
    const existing = bestByAccessory.get(link.accessoryId);
    if (!existing || link.bundleDiscountPct > existing.bundleDiscountPct) {
      bestByAccessory.set(link.accessoryId, link);
    }
  }

  const chosen = [...bestByAccessory.values()].slice(0, opts.limit ?? 6);
  const ctx = await loadContext();
  const cards = await cardsFor(
    chosen.map((l) => l.accessory),
    ctx,
    opts.loyaltyTier,
  );

  return cards.map((card) => {
    const pct = bestByAccessory.get(card.id)?.bundleDiscountPct ?? 0;
    return {
      ...card,
      bundleDiscountPct: pct,
      bundlePricePaise: Math.round(card.finalPaise * (1 - pct / 100)),
    };
  });
}

export type HomeData = {
  featured: ProductCard[];
  trending: ProductCard[];
  deals: ProductCard[];
  launching: ProductCard[];
  brands: Array<{ id: string; name: string; slug: string; accent: string; productCount: number }>;
  categories: Array<{ id: string; name: string; slug: string; icon: string | null; productCount: number }>;
  flashSale: {
    id: string;
    name: string;
    endsAt: Date;
    items: ProductCard[];
  } | null;
};

export async function homepageData(opts: { loyaltyTier?: string | null } = {}): Promise<HomeData> {
  const now = new Date();
  const ctx = await loadContext();

  const [featuredRows, trendingRows, dealRows, launchRows, brands, categories, sale] =
    await Promise.all([
      db.product.findMany({
        where: { status: 'active', isFeatured: true },
        include: PRODUCT_INCLUDE,
        orderBy: { sortOrder: 'asc' },
        take: 8,
      }),
      db.product.findMany({
        where: { status: 'active' },
        include: PRODUCT_INCLUDE,
        orderBy: [{ soldCount: 'desc' }, { viewCount: 'desc' }],
        take: 8,
      }),
      db.product.findMany({
        where: { status: 'active' },
        include: PRODUCT_INCLUDE,
        take: 20,
      }),
      db.product.findMany({
        where: {
          status: { in: ['active', 'coming_soon'] },
          OR: [{ isPreorder: true }, { launchDate: { gt: now } }],
        },
        include: PRODUCT_INCLUDE,
        orderBy: { launchDate: 'asc' },
        take: 6,
      }),
      db.brand.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          accent: true,
          _count: { select: { products: true } },
        },
      }),
      db.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          _count: { select: { products: true } },
        },
      }),
      db.flashSale.findFirst({
        where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
        include: {
          items: { include: { variant: { select: { productId: true } } } },
        },
      }),
    ]);

  const [featured, trending, dealCandidates, launching] = await Promise.all([
    cardsFor(featuredRows, ctx, opts.loyaltyTier),
    cardsFor(trendingRows, ctx, opts.loyaltyTier),
    cardsFor(dealRows, ctx, opts.loyaltyTier),
    cardsFor(launchRows, ctx, opts.loyaltyTier),
  ]);

  let flashSale: HomeData['flashSale'] = null;
  if (sale) {
    const saleProductIds = unique(sale.items.map((i) => i.variant.productId));
    const saleRows = await db.product.findMany({
      where: { id: { in: saleProductIds } },
      include: PRODUCT_INCLUDE,
    });
    flashSale = {
      id: sale.id,
      name: sale.name,
      endsAt: sale.endsAt,
      items: await cardsFor(saleRows, ctx, opts.loyaltyTier),
    };
  }

  return {
    featured,
    trending,
    deals: dealCandidates
      .filter((c) => c.discountPercent > 0)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 8),
    launching,
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      accent: b.accent,
      productCount: b._count.products,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      productCount: c._count.products,
    })),
    flashSale,
  };
}

// ── Search ────────────────────────────────────────────────────────────

export type Suggestion = {
  type: 'product' | 'brand' | 'category';
  label: string;
  sublabel: string | null;
  href: string;
  pricePaise: number | null;
  accent: string | null;
};

/** Typeahead for the command-palette style search bar. */
export async function searchSuggest(q: string, limit = 8): Promise<Suggestion[]> {
  const term = q.trim();
  if (term.length < 2) return [];

  const [products, brands, categories] = await Promise.all([
    db.product.findMany({
      where: {
        status: 'active',
        OR: [{ name: { contains: term } }, { tagline: { contains: term } }],
      },
      select: {
        name: true,
        slug: true,
        pricePaise: true,
        brand: { select: { name: true, accent: true } },
      },
      orderBy: [{ soldCount: 'desc' }],
      take: limit,
    }),
    db.brand.findMany({
      where: { isActive: true, name: { contains: term } },
      select: { name: true, slug: true, accent: true },
      take: 3,
    }),
    db.category.findMany({
      where: { isActive: true, name: { contains: term } },
      select: { name: true, slug: true },
      take: 3,
    }),
  ]);

  return [
    ...products.map((p) => ({
      type: 'product' as const,
      label: p.name,
      sublabel: p.brand.name,
      href: `/product/${p.slug}`,
      pricePaise: p.pricePaise,
      accent: p.brand.accent,
    })),
    ...brands.map((b) => ({
      type: 'brand' as const,
      label: b.name,
      sublabel: 'Brand',
      href: `/shop?brand=${b.slug}`,
      pricePaise: null,
      accent: b.accent,
    })),
    ...categories.map((c) => ({
      type: 'category' as const,
      label: c.name,
      sublabel: 'Category',
      href: `/category/${c.slug}`,
      pricePaise: null,
      accent: null,
    })),
  ].slice(0, limit + 4);
}

// ── Engagement ────────────────────────────────────────────────────────

/**
 * Records a product view. Fire-and-forget from a page render: an analytics
 * write must never be the reason a product page fails to load.
 */
export async function trackProductView(input: {
  productId: string;
  path: string;
  sessionId?: string | null;
  userId?: string | null;
  referrer?: string | null;
  device?: string;
}) {
  try {
    await db.$transaction([
      db.product.update({
        where: { id: input.productId },
        data: { viewCount: { increment: 1 } },
      }),
      db.trafficEvent.create({
        data: {
          path: input.path,
          eventType: 'pageview',
          productId: input.productId,
          sessionId: input.sessionId ?? null,
          userId: input.userId ?? null,
          referrer: input.referrer ?? null,
          device: input.device ?? 'desktop',
          source: input.referrer ? 'referral' : 'direct',
        },
      }),
    ]);
  } catch {
    // Swallowed on purpose — see the note above.
  }
}

/**
 * "Notify me when it's back." Idempotent per (product, variant, contact) so a
 * customer who taps twice isn't emailed twice.
 */
export async function createStockAlert(input: {
  productId: string;
  variantId?: string | null;
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  if (!input.userId && !input.email && !input.phone) {
    throw new AppError('We need an email or phone number to notify you.', 400);
  }

  const existing = await db.stockAlert.findFirst({
    where: {
      productId: input.productId,
      variantId: input.variantId ?? null,
      notifiedAt: null,
      ...(input.userId
        ? { userId: input.userId }
        : input.email
          ? { email: input.email }
          : { phone: input.phone }),
    },
  });
  if (existing) return { created: false, alert: existing };

  const alert = await db.stockAlert.create({
    data: {
      productId: input.productId,
      variantId: input.variantId ?? null,
      userId: input.userId ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
    },
  });
  return { created: true, alert };
}

export async function listStockAlerts(userId: string) {
  return db.stockAlert.findMany({
    where: { userId },
    include: {
      product: { select: { name: true, slug: true, heroGradient: true } },
      variant: { select: { colorName: true, ramGb: true, storageGb: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function removeStockAlert(id: string, userId: string) {
  const alert = await db.stockAlert.findFirst({ where: { id, userId } });
  if (!alert) throw new AppError('Alert not found.', 404);
  await db.stockAlert.delete({ where: { id } });
  return { removed: true };
}

// ── Reference data for filter UIs ─────────────────────────────────────

export async function listBrands() {
  return db.brand.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, slug: true, accent: true, logoText: true, country: true },
  });
}

export async function listCategories() {
  const rows = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
  });
  return rows.filter((r) => r.parentId === null);
}

export async function listSpecDefinitions(opts: { filterableOnly?: boolean } = {}) {
  return db.specDefinition.findMany({
    where: opts.filterableOnly ? { isFilterable: true } : {},
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
  });
}
