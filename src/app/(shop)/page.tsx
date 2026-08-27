import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Cable, ChevronRight, Headphones, Package, ShieldCheck, Smartphone, Tablet, Truck, Watch, Zap } from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { homepageData, type HomeData } from '@/lib/services/catalog';
import { getCurrentUser } from '@/lib/auth';
import { getSettings } from '@/lib/services/settings';
import { formatINR } from '@/lib/money';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel';
import { ProductCard } from '@/components/product/card';
import { BrandRail } from '@/components/product/brand-rail';
import { CategoryGrid } from '@/components/product/category-grid';
import { FlashSaleCountdown } from '@/components/product/flash-sale-countdown';

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
    <div className="space-y-10">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="relative">
        <div
          className="absolute inset-0 bg-gradient-to-b from-volt-500/5 via-transparent to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative panel bevel overflow-hidden">
          <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-0">
            <div className="flex flex-col justify-center px-6 py-12 lg:px-10 lg:py-16">
              <Badge tone="violet" size="sm" className="w-fit mb-4">
                <Zap className="size-3 mr-1.5" aria-hidden />
                New: Exchange your old device — instant credit at checkout
              </Badge>
              <h1
                id="hero-heading"
                className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl"
              >
                The phone you want,{' '}
                <span className="text-gradient">the way you want it</span>
              </h1>
              <p className="mt-4 max-w-lg text-lg text-ink-2">
                Flagship phones, tablets, audio & wearables — genuine warranty,
                GST invoice, no-cost EMI, doorstep exchange. Every IMEI tracked.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href="/shop" size="lg">
                  Shop all devices
                  <ArrowRight className="size-4 ml-2" aria-hidden />
                </ButtonLink>
                <ButtonLink href="/compare" variant="outline" size="lg">
                  Compare side by side
                </ButtonLink>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-ink-3">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-volt-300" aria-hidden />
                  <span>Free delivery above ₹49,999</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-good-400" aria-hidden />
                  <span>GST invoice on every order</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-plasma-300" aria-hidden />
                  <span>IMEI-locked warranty</span>
                </div>
              </div>
            </div>

            <div
              className="relative flex items-end justify-center overflow-hidden bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-transparent lg:rounded-none"
              aria-hidden="true"
            >
              <div className="relative w-full max-w-md aspect-square">
                <svg viewBox="0 0 400 400" className="size-full" fill="none">
                  <defs>
                    <linearGradient id="phoneBody" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#04060c" />
                    </linearGradient>
                    <linearGradient id="phoneScreen" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="cameraRing" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                  </defs>
                  {/* Phone body */}
                  <rect x="80" y="20" width="240" height="360" rx="40" fill="url(#phoneBody)" stroke="#1e293b" strokeWidth="1.5" />
                  {/* Screen */}
                  <rect x="96" y="44" width="208" height="312" rx="24" fill="url(#phoneScreen)" />
                  {/* Dynamic island */}
                  <rect x="160" y="44" width="80" height="24" rx="12" fill="#0f172a" />
                  {/* Camera module */}
                  <rect x="190" y="72" width="120" height="120" rx="20" fill="#0a131f" stroke="#1e293b" strokeWidth="1" />
                  <circle cx="220" cy="102" r="28" stroke="url(#cameraRing)" strokeWidth="2" fill="none" />
                  <circle cx="280" cy="102" r="20" stroke="#1e293b" strokeWidth="1.5" fill="none" />
                  <circle cx="220" cy="150" r="16" stroke="#1e293b" strokeWidth="1.5" fill="none" />
                  {/* Flash */}
                  <rect x="312" y="84" width="20" height="20" rx="4" fill="#1e293b" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Flash Sale ────────────────────────────────────────────────── */}
      {data.flashSale && (
        <section aria-labelledby="flash-sale-heading">
          <FlashSaleCountdown
            sale={data.flashSale}
            items={data.flashSale.items}
          />
        </section>
      )}

      {/* ── Featured ───────────────────────────────────────────────────── */}
      {data.featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <PanelHeader
            title="Featured"
            description="Hand-picked by our merchandising team."
            action={
              <Link
                href="/shop?sort=featured"
                className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200"
              >
                View all
                <ChevronRight className="size-3.5 ml-1" aria-hidden />
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
              <Link
                href="/shop?sort=popular"
                className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200"
              >
                View all
                <ChevronRight className="size-3.5 ml-1" aria-hidden />
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
              <Link
                href="/shop?sort=discount"
                className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200"
              >
                View all
                <ChevronRight className="size-3.5 ml-1" aria-hidden />
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
              <Link
                href="/shop?filter=coming_soon"
                className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200"
              >
                View all
                <ChevronRight className="size-3.5 ml-1" aria-hidden />
              </Link>
            }
          />
          <ProductRail products={data.launching} />
        </section>
      )}

      {/* ── Brands ─────────────────────────────────────────────────────── */}
      {data.brands.length > 0 && (
        <section aria-labelledby="brands-heading">
          <PanelHeader
            title="Brands"
            description="Official partners. Every device is genuine, warranty-honoured."
          />
          <BrandRail brands={data.brands} />
        </section>
      )}

      {/* ── Categories ─────────────────────────────────────────────────── */}
      {data.categories.length > 0 && (
        <section aria-labelledby="categories-heading">
          <PanelHeader
            title="Shop by category"
            description="Browse the full catalogue by device type."
          />
          <CategoryGrid categories={data.categories} />
        </section>
      )}

      {/* ── Trust Bar ─────────────────────────────────────────────────── */}
      <section aria-label="Why VOLTAGE" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BadgeCheck, title: 'Genuine warranty', desc: 'Every IMEI registered. Claims honoured by brand service centres.' },
          { icon: Truck, title: 'Fast, insured delivery', desc: 'Same-day dispatch in metros. Tracked, insured, signature on delivery.' },
          { icon: ShieldCheck, title: 'No-cost EMI', desc: 'Up to 24 months. Credit, debit & cardless options from major banks.' },
          { icon: Zap, title: 'Exchange & upgrade', desc: 'Instant credit for your old device. Doorstep pickup, data-safe wipe.' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <Panel key={i} flat className="p-6 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-volt-400/10 text-volt-300">
              <Icon className="size-5" aria-hidden />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 text-xs text-ink-3">{desc}</p>
          </Panel>
        ))}
      </section>
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