'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Heart, Share2, Truck, ShieldCheck, RotateCcw, Loader2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/money';
import { DeviceArt, DeviceStage } from '@/components/product/device-art';
import { ProductCard } from '@/components/product/card';
import { Panel, PanelBody, PanelHeader, PanelFooter, Row, Meter, Badge, EmptyState } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { SizeRecommendation } from '@/components/ui/size-recommendation';
import { ViewerCount, UrgencyIndicator } from '@/components/ui/social-proof';
import { api } from '@/lib/client';
import { type ProductDetail, type VariantView, type SpecGroup } from '@/lib/services/catalog';

function formatEndDate(dateStr: Date | string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

type ProductDetailClientProps = {
  initialData: ProductDetail;
};

export function ProductDetailClient({ initialData }: ProductDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [selectedVariant, setSelectedVariant] = useState<VariantView | null>(null);
  const [color, setColor] = useState(initialData.colors[0]?.name ?? '');
  const [ram, setRam] = useState<number | null>(initialData.ramOptions[0] ?? null);
  const [storage, setStorage] = useState<number | null>(initialData.storageOptions[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // Find matching variant when color/ram/storage changes
  const findVariant = (): VariantView | null => {
    return initialData.variants.find(
      (v) =>
        v.colorName === color &&
        (ram === null || v.ramGb === ram) &&
        (storage === null || v.storageGb === storage) &&
        v.inStock
    ) ?? null;
  };

  const variant = findVariant();

  async function addToCart() {
    if (!variant || isAdding || isBuying) return;
    
    if (!variant.inStock) {
      toast.error('This variant is out of stock');
      return;
    }

    if (quantity > variant.sellable) {
      toast.error(`Only ${variant.sellable} units available`);
      return;
    }

    setIsAdding(true);
    try {
      const res = await api('/api/cart', {
        method: 'POST',
        json: { variantId: variant.id, quantity },
      });
      
      if (res.ok) {
        toast.success('Added to cart successfully!');
        // Trigger cart count update
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error(res.error || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }

  async function buyNow() {
    if (!variant || isBuying || isAdding) return;
    
    if (!variant.inStock) {
      toast.error('This variant is out of stock');
      return;
    }

    setIsBuying(true);
    try {
      const res = await api('/api/cart', {
        method: 'POST',
        json: { variantId: variant.id, quantity },
      });
      
      if (res.ok) {
        router.push('/cart?checkout=true');
      } else {
        toast.error(res.error || 'Failed to proceed');
      }
    } catch (error) {
      toast.error('Failed to proceed. Please try again.');
    } finally {
      setIsBuying(false);
    }
  }

  const [viewerCount, setViewerCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setViewerCount(Math.floor(Math.random() * 80) + 40);
  }, []);

  return (
    <div className="space-y-6">
      {/* Gallery & Buy Box */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* Gallery */}
        <div className="space-y-4">
          <Panel flat className="aspect-square overflow-hidden">
            <DeviceStage gradient={initialData.heroGradient} glow>
              {(selectedVariant?.imageUrl || initialData.imageUrl) ? (
                <img
                  src={selectedVariant?.imageUrl || initialData.imageUrl!}
                  alt={initialData.name}
                  className="size-full object-contain p-6"
                />
              ) : (
                <DeviceArt
                  colorHex={selectedVariant?.colorHex || initialData.colors[0]?.hex || '#06b6d4'}
                  colorHex2={selectedVariant?.colorHex2 || initialData.colors[0]?.hex2 || null}
                  kind={initialData.kind}
                  seed={initialData.slug}
                  brandMark={initialData.brand.name.length <= 8 ? initialData.brand.name.toUpperCase() : null}
                  className="size-full"
                />
              )}
            </DeviceStage>
          </Panel>

          {/* Color swatches */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-ink-3 shrink-0">Color:</span>
            <div className="flex flex-wrap gap-2">
              {initialData.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setColor(c.name); setRam(null); setStorage(null); }}
                  className={cn(
                    'relative size-10 rounded-full ring-2 transition-all',
                    color === c.name
                      ? 'ring-volt-400 scale-110'
                      : 'ring-line hover:ring-volt-400/50'
                  )}
                  style={{ background: c.hex2 ? `linear-gradient(135deg, ${c.hex}, ${c.hex2})` : c.hex }}
                  aria-label={c.name}
                  aria-pressed={color === c.name}
                >
                  {color === c.name && <ShieldCheck className="absolute inset-0 size-4 m-auto text-void" />}
                </button>
              ))}
            </div>
          </div>

          {/* RAM / Storage selectors */}
          {initialData.ramOptions.length > 1 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-ink-3 shrink-0">RAM:</span>
              <div className="flex flex-wrap gap-2">
                {initialData.ramOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRam(r); setStorage(null); }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      ram === r
                        ? 'bg-volt-400 text-void'
                        : 'bg-panel-2 text-ink ring-1 ring-inset ring-line hover:ring-volt-400/50'
                    )}
                    aria-pressed={ram === r}
                  >
                    {r} GB
                  </button>
                ))}
              </div>
            </div>
          )}

          {initialData.storageOptions.length > 1 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-ink-3 shrink-0">Storage:</span>
              <div className="flex flex-wrap gap-2">
                {initialData.storageOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStorage(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      storage === s
                        ? 'bg-volt-400 text-void'
                        : 'bg-panel-2 text-ink ring-1 ring-inset ring-line hover:ring-volt-400/50'
                    )}
                    aria-pressed={storage === s}
                  >
                    {s >= 1024 ? `${s / 1024} TB` : `${s} GB`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buy Box */}
        <div className="lg:sticky lg:top-24">
          <Panel>
            <PanelBody className="space-y-4 p-5">
              <div>
                <Badge tone="violet" size="sm" className="capitalize mb-2">
                  {initialData.brand.name}
                </Badge>
                <h1 className="text-2xl font-semibold tracking-tight text-ink">{initialData.name}</h1>
                {initialData.tagline && <p className="mt-1 text-lg text-ink-2">{initialData.tagline}</p>}
                <div className="mt-2 flex items-center gap-3">
                  {mounted && <ViewerCount count={viewerCount} />}
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="tabular text-3xl font-semibold text-ink">
                  {formatINR(selectedVariant?.finalPaise ?? initialData.priceRange.minPaise)}
                </span>
                {selectedVariant && selectedVariant.mrpPaise > selectedVariant.finalPaise && (
                  <span className="tabular text-xl text-ink-4 line-through">
                    {formatINR(selectedVariant.mrpPaise)}
                  </span>
                )}
                {selectedVariant && selectedVariant.discountPercent > 0 && (
                  <Badge tone="emerald" size="sm">{selectedVariant.discountPercent}% off</Badge>
                )}
              </div>

              {selectedVariant?.lowStock && (
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-sm text-warn-400">
                    <Truck className="size-4" aria-hidden />
                    Only {selectedVariant.sellable} left in stock
                  </p>
                  <UrgencyIndicator stockLeft={selectedVariant.sellable} />
                </div>
              )}

              {selectedVariant?.flashSale && (
                <div className="p-3 rounded-lg bg-volt-400/10 ring-1 ring-inset ring-volt-400/30">
                  <p className="text-sm font-medium text-volt-300">Flash Sale Price</p>
                  <p className="text-2xl font-semibold text-volt-300 tabular">{formatINR(selectedVariant.flashSale.salePricePaise)}</p>
                  <p className="text-xs text-ink-3">Ends {formatEndDate(selectedVariant.flashSale.endsAt)}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" icon={<Heart className="size-4" />}>Save</Button>
                <Button variant="secondary" size="sm" icon={<Share2 className="size-4" />}>Share</Button>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border border-line rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={isAdding || isBuying}
                      className="p-2 text-ink-3 hover:text-ink hover:bg-panel-2 transition-colors disabled:opacity-50"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="px-3 tabular text-sm font-medium text-ink min-w-[3rem] text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(variant?.sellable ?? 5, q + 1))}
                      disabled={isAdding || isBuying || quantity >= (variant?.sellable ?? 5)}
                      className="p-2 text-ink-3 hover:text-ink hover:bg-panel-2 transition-colors disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    fullWidth
                    size="lg"
                    variant="secondary"
                    onClick={addToCart}
                    disabled={!variant || !variant.inStock || isAdding || isBuying}
                    loading={isAdding}
                  >
                    <ShoppingCart className="size-4" aria-hidden />
                    Add to cart
                  </Button>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={buyNow}
                    disabled={!variant || !variant.inStock || isAdding || isBuying}
                    loading={isBuying}
                  >
                    {variant?.inStock ? 'Buy now' : 'Out of stock'}
                  </Button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="pt-4 border-t border-line space-y-2">
                <div className="flex items-center gap-2 text-sm text-ink-2">
                  <Truck className="size-4 text-good-400 shrink-0" aria-hidden />
                  <span>Free delivery above ₹49,999</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-2">
                  <ShieldCheck className="size-4 text-plasma-300 shrink-0" aria-hidden />
                  <span>GST invoice on every order</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-2">
                  <RotateCcw className="size-4 text-warn-400 shrink-0" aria-hidden />
                  <span>14-day easy returns</span>
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>

      {/* Specs & Details */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="space-y-6">
          {/* Highlights */}
          {initialData.highlights.length > 0 && (
            <Panel>
              <PanelHeader title="Key highlights" />
              <PanelBody>
                <ul className="space-y-2">
                  {initialData.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                      <ShieldCheck className="size-4 mt-0.5 shrink-0 text-good-400" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          )}

          {/* Specifications */}
          <Panel>
            <PanelHeader title="Specifications" />
            <PanelBody className="space-y-4">
              {initialData.specGroups.map((group) => (
                <div key={group.groupName} className="space-y-2">
                  <h4 className="text-sm font-medium text-ink-3 uppercase tracking-wider">{group.groupName}</h4>
                  <dl className="divide-y divide-line">
                    {group.rows.map((row) => (
                      <div key={row.key} className="flex items-center justify-between py-2">
                        <dt className="text-sm text-ink-2">{row.label}</dt>
                        <dd className={cn('tabular text-sm font-medium text-ink shrink-0 ml-4', row.isKeySpec && 'text-volt-300')}>
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </PanelBody>
          </Panel>

          {/* Size Recommendation */}
          <SizeRecommendation category={initialData.category?.slug ?? initialData.kind} />

          {/* Rating breakdown */}
          <Panel>
            <PanelHeader title="Ratings & reviews" />
            <PanelBody className="space-y-3">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-semibold text-ink">{initialData.ratingAvg.toFixed(1)}</p>
                  <p className="text-sm text-ink-3">{initialData.reviewCount} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {initialData.ratingBreakdown.map((r) => (
                    <div key={r.rating} className="flex items-center gap-2">
                      <span className="w-6 text-right text-sm text-ink-3">{r.rating}★</span>
                      <Meter
                        value={r.percent}
                        max={100}
                        tone="emerald"
                        className="flex-1 h-2"
                      />
                      <span className="w-12 text-right text-sm text-ink-4">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>

        {/* Sidebar - related products, accessories */}
        <aside className="lg:sticky lg:top-24 space-y-6">
          <Panel>
            <PanelHeader title="In the box" />
            <PanelBody>
              <ul className="space-y-2 text-sm text-ink-2">
                <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-good-400 shrink-0" /> {initialData.name}</li>
                <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-good-400 shrink-0" /> USB-C cable</li>
                <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-good-400 shrink-0" /> SIM eject tool</li>
                <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-good-400 shrink-0" /> Quick start guide</li>
                <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-good-400 shrink-0" /> Warranty card</li>
              </ul>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Warranty" />
            <PanelBody className="space-y-2">
              <Row label="Standard warranty" value={`${initialData.warrantyMonths} months`} />
              <Row label="Coverage" value="Manufacturing defects" />
              <Row label="IMEI-locked" value="Yes — tied to device serial" />
              <PanelFooter>
                <Button variant="secondary" size="sm" fullWidth icon={<RotateCcw className="size-3.5" />}>
                  Extend protection
                </Button>
              </PanelFooter>
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </div>
  );
}