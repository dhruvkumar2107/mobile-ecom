import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, ChevronRight, ShieldCheck, Truck, Zap } from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { homepageData, type HomeData } from '@/lib/services/catalog';
import { getCurrentUser } from '@/lib/auth';
import { formatINR } from '@/lib/money';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PanelHeader, Panel } from '@/components/ui/panel';
import { ProductCard } from '@/components/product/card';
import { BrandRail } from '@/components/product/brand-rail';
import { CategoryGrid } from '@/components/product/category-grid';
import { FlashSaleCountdown } from '@/components/product/flash-sale-countdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SocialProofPopup } from '@/components/ui/social-proof';
import { MiniCartBar } from '@/components/ui/mini-cart';

export const metadata: Metadata = {
  title: undefined,
  description: 'Ultra-premium mobile & electronics commerce. GST-invoiced, warranty-tracked, same-day dispatch.',
};

async function getCachedHomeData(loyaltyTier: string | null): Promise<HomeData> {
  return homepageData({ loyaltyTier });
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const data = await unstable_cache(
    () => getCachedHomeData(user?.loyaltyTier ?? null),
    ['homepage', user?.loyaltyTier ?? 'none'],
    { revalidate: 120, tags: ['homepage'] }
  )();

  return (
    <div className="space-y-8">
      <ThemeToggle />
      <SocialProofPopup />

      {/* ── Bento Grid Hero ────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-volt-500/5 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
        <div className="relative grid gap-3 lg:grid-cols-4 lg:grid-rows-2 auto-rows-[200px] lg:auto-rows-[240px]">
          {/* Main hero — spans 2 cols, 2 rows */}
          <div className="lg:col-span-2 lg:row-span-2 panel bevel overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-volt-500/10 via-transparent to-plasma-500/5" />
            <div className="relative h-full flex flex-col justify-end p-6 lg:p-8">
              <Badge tone="violet" size="sm" className="w-fit mb-3">
                <Zap className="size-3 mr-1.5" aria-hidden />
                New: Exchange your old device
              </Badge>
              <h1 id="hero-heading" className="text-2xl lg:text-4xl font-semibold tracking-tight text-ink leading-tight">
                The phone you want,<br />
                <span className="text-gradient">the way you want it</span>
              </h1>
              <p className="mt-3 text-sm lg:text-base text-ink-2 max-w-md">
                Flagship phones, tablets, audio & wearables — genuine warranty, GST invoice, no-cost EMI.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <ButtonLink href="/products" size="lg">
                  Shop now
                  <ArrowRight className="size-4 ml-2" aria-hidden />
                </ButtonLink>
                <ButtonLink href="/compare" variant="outline">
                  Compare
                </ButtonLink>
              </div>
            </div>
            {/* Decorative phone art */}
            <div className="absolute top-4 right-4 w-24 h-40 lg:w-40 lg:h-64 opacity-20 lg:opacity-30 group-hover:opacity-50 transition-opacity" aria-hidden="true">
              <svg viewBox="0 0 160 260" fill="none" className="size-full">
                <rect x="10" y="0" width="140" height="260" rx="28" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                <rect x="22" y="16" width="116" height="228" rx="16" fill="url(#heroScreen2)" />
                <defs>
                  <linearGradient id="heroScreen2" x1="22" y1="16" x2="138" y2="244"><stop stopColor="#22d3ee" stopOpacity="0.15" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0.05" /></linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Flash Sale tile */}
          {data.flashSale && (
            <div className="lg:col-span-2 glass-card overflow-hidden p-5 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-bad-500/10 to-transparent" />
              <div className="relative">
                <FlashSaleCountdown sale={data.flashSale} items={data.flashSale.items} />
              </div>
            </div>
          )}

          {/* Category tiles */}
          <Link href="/products?filter=phones" className="glass-card p-5 flex flex-col justify-end relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
              <svg viewBox="0 0 80 80" fill="none" className="size-16"><rect x="20" y="0" width="40" height="80" rx="8" stroke="#22d3ee" strokeWidth="1.5" /><rect x="26" y="8" width="28" height="64" rx="4" fill="#22d3ee" fillOpacity="0.1" /></svg>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-ink-4 font-medium mb-1">Category</span>
            <h3 className="text-base font-semibold text-ink">Smartphones</h3>
            <p className="text-xs text-ink-3 mt-0.5">From {formatINR(999900)}</p>
          </Link>

          <Link href="/products?filter=audio" className="glass-card p-5 flex flex-col justify-end relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
              <svg viewBox="0 0 80 80" fill="none" className="size-16"><circle cx="40" cy="40" r="28" stroke="#a78bfa" strokeWidth="1.5" /><circle cx="40" cy="40" r="12" fill="#a78bfa" fillOpacity="0.1" /></svg>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-ink-4 font-medium mb-1">Category</span>
            <h3 className="text-base font-semibold text-ink">Audio</h3>
            <p className="text-xs text-ink-3 mt-0.5">From {formatINR(199900)}</p>
          </Link>

          {/* Trust badges row */}
          <div className="lg:col-span-2 grid grid-cols-3 gap-3">
            {[
              { icon: BadgeCheck, label: 'Genuine warranty', color: 'text-good-400' },
              { icon: Truck, label: 'Free delivery', color: 'text-volt-300' },
              { icon: ShieldCheck, label: 'No-cost EMI', color: 'text-plasma-300' },
            ].map(({ icon: Icon, label, color }, i) => (
              <div key={i} className="glass-card p-3 flex flex-col items-center text-center gap-2">
                <div className={`size-8 rounded-lg bg-panel-2 flex items-center justify-center ${color}`}>
                  <Icon className="size-4" aria-hidden />
                </div>
                <span className="text-[10px] font-medium text-ink-3 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured ───────────────────────────────────────────────────── */}
      {data.featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <PanelHeader
            title="Featured"
            description="Hand-picked by our merchandising team."
            action={
              <Link href="/products?sort=featured" className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200">
                View all <ChevronRight className="size-3.5 ml-1 inline" aria-hidden />
              </Link>
            }
          />
          <ProductRail products={data.featured} />
        </section>
      )}

      {/* ── Trending ───────────────────────────────────────────────────── */}
      {data.trending.length > 0 && (
        <section aria-labelledby="trending-heading">
          <PanelHeader
            title="Trending now"
            description="What other customers are buying right now."
            action={
              <Link href="/products?sort=popular" className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200">
                View all <ChevronRight className="size-3.5 ml-1 inline" aria-hidden />
              </Link>
            }
          />
          <ProductRail products={data.trending} />
        </section>
      )}

      {/* ── Deals ──────────────────────────────────────────────────────── */}
      {data.deals.length > 0 && (
        <section aria-labelledby="deals-heading">
          <PanelHeader
            title="Top deals"
            description="Biggest discounts across the catalogue."
            action={
              <Link href="/products?sort=discount" className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200">
                View all <ChevronRight className="size-3.5 ml-1 inline" aria-hidden />
              </Link>
            }
          />
          <ProductRail products={data.deals} />
        </section>
      )}

      {/* ── Launching Soon ────────────────────────────────────────────── */}
      {data.launching.length > 0 && (
        <section aria-labelledby="launching-heading">
          <PanelHeader
            title="Launching soon"
            description="Pre-order or get notified when they drop."
            action={
              <Link href="/products?filter=coming_soon" className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200">
                View all <ChevronRight className="size-3.5 ml-1 inline" aria-hidden />
              </Link>
            }
          />
          <ProductRail products={data.launching} />
        </section>
      )}

      {/* ── Brands ─────────────────────────────────────────────────────── */}
      {data.brands.length > 0 && (
        <section aria-labelledby="brands-heading">
          <PanelHeader title="Brands" description="Official partners. Every device is genuine, warranty-honoured." />
          <BrandRail brands={data.brands} />
        </section>
      )}

      {/* ── Categories ─────────────────────────────────────────────────── */}
      {data.categories.length > 0 && (
        <section aria-labelledby="categories-heading">
          <PanelHeader title="Shop by category" description="Browse the full catalogue by device type." />
          <CategoryGrid categories={data.categories} />
        </section>
      )}

      {/* ── Trust Bar ─────────────────────────────────────────────────── */}
      <section aria-label="Why VOLTAGE" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BadgeCheck, title: 'Genuine warranty', desc: 'Every IMEI registered. Claims honoured by brand service centres.', color: 'text-good-400' },
          { icon: Truck, title: 'Fast, insured delivery', desc: 'Same-day dispatch in metros. Tracked, insured, signature on delivery.', color: 'text-volt-300' },
          { icon: ShieldCheck, title: 'No-cost EMI', desc: 'Up to 24 months. Credit, debit & cardless options from major banks.', color: 'text-plasma-300' },
          { icon: Zap, title: 'Exchange & upgrade', desc: 'Instant credit for your old device. Doorstep pickup, data-safe wipe.', color: 'text-warn-400' },
        ].map(({ icon: Icon, title, desc, color }, i) => (
          <Panel key={i} flat className="p-5 text-center glass-card">
            <div className={`mx-auto flex size-10 items-center justify-center rounded-xl bg-panel-2 ${color}`}>
              <Icon className="size-5" aria-hidden />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 text-xs text-ink-3 leading-relaxed">{desc}</p>
          </Panel>
        ))}
      </section>

      <MiniCartBar />
    </div>
  );
}

function ProductRail({ products }: { products: Awaited<ReturnType<typeof homepageData>>['featured'] }) {
  return (
    <div className="snap-rail no-scrollbar fade-x -mx-4 px-4 pb-4" role="list">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
