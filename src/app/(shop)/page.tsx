import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, ChevronRight, ShieldCheck, Truck, Zap, Smartphone, Headphones, Watch, Tablet, Package, Star, TrendingUp, Percent } from 'lucide-react';
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
  title: 'Home',
  description: 'Ultra-premium mobile & electronics commerce. GST-invoiced, warranty-tracked, same-day dispatch.',
};

async function getCachedHomeData(loyaltyTier: string | null): Promise<HomeData> {
  return homepageData({ loyaltyTier });
}

const CATEGORY_META: Record<string, { icon: React.ComponentType<{ className?: string }>; gradient: string; accent: string }> = {
  mobiles: { icon: Smartphone, gradient: 'from-cyan-500/20 to-blue-600/10', accent: '#22d3ee' },
  audio: { icon: Headphones, gradient: 'from-purple-500/20 to-violet-600/10', accent: '#a78bfa' },
  wearables: { icon: Watch, gradient: 'from-emerald-500/20 to-teal-600/10', accent: '#34d399' },
  tablets: { icon: Tablet, gradient: 'from-amber-500/20 to-orange-600/10', accent: '#fbbf24' },
  accessories: { icon: Package, gradient: 'from-rose-500/20 to-pink-600/10', accent: '#fb7185' },
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const data = await unstable_cache(
    () => getCachedHomeData(user?.loyaltyTier ?? null),
    ['homepage', user?.loyaltyTier ?? 'none'],
    { revalidate: 120, tags: ['homepage'] }
  )();

  return (
    <div className="space-y-10">
      <ThemeToggle />
      <SocialProofPopup />

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="relative -mx-4 sm:-mx-6 lg:-mx-8">
        {/* Ambient glow background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-volt-500/8 blur-3xl" />
          <div className="absolute -top-1/3 -right-1/4 w-[600px] h-[600px] rounded-full bg-plasma-500/6 blur-3xl" />
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-6 lg:grid-cols-12 lg:grid-rows-[auto_auto] items-end">
              {/* Main hero copy */}
              <div className="lg:col-span-7 lg:row-span-2 space-y-6">
                <Badge tone="violet" size="sm" className="w-fit">
                  <Zap className="size-3 mr-1.5" aria-hidden />
                  Exchange your old device — instant credit
                </Badge>
                <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.1]">
                  The phone you want,
                  <br />
                  <span className="text-gradient">the way you want it</span>
                </h1>
                <p className="text-base lg:text-lg text-ink-2 max-w-lg leading-relaxed">
                  Flagship phones, tablets, audio & wearables — genuine warranty, GST invoice, no-cost EMI. Same-day dispatch across India.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <ButtonLink href="/products" size="lg" className="shadow-lg shadow-volt-500/20">
                    Shop now
                    <ArrowRight className="size-4 ml-2" aria-hidden />
                  </ButtonLink>
                  <ButtonLink href="/compare" variant="outline" size="lg">
                    Compare devices
                  </ButtonLink>
                </div>
                {/* Quick stats */}
                <div className="flex items-center gap-6 pt-2">
                  {[
                    { value: '10K+', label: 'Happy customers' },
                    { value: '4.8', label: 'Average rating', icon: Star },
                    { value: '24hr', label: 'Same-day dispatch' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {stat.icon && <stat.icon className="size-3.5 text-warn-400 fill-warn-400" />}
                      <span className="text-sm font-semibold text-ink">{stat.value}</span>
                      <span className="text-xs text-ink-3 hidden sm:inline">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side — category quick links */}
              <div className="lg:col-span-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {data.categories.slice(0, 4).map((cat) => {
                    const meta = CATEGORY_META[cat.slug] ?? { icon: Package, gradient: 'from-gray-500/20 to-gray-600/10', accent: '#94a3b8' };
                    const Icon = meta.icon;
                    return (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient} border border-white/5 p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-white/10`}
                      >
                        <div className="size-6 mb-2 transition-transform group-hover:scale-110" style={{ color: meta.accent }}>
                          <Icon className="size-full" />
                        </div>
                        <h3 className="text-sm font-semibold text-ink">{cat.name}</h3>
                        <p className="text-[11px] text-ink-3 mt-0.5">{cat.productCount} devices</p>
                        <ChevronRight className="absolute top-3 right-3 size-4 text-ink-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Flash Sale ──────────────────────────────────────────────── */}
      {data.flashSale && (
        <section aria-labelledby="flash-sale-heading">
          <FlashSaleCountdown sale={data.flashSale} items={data.flashSale.items} />
        </section>
      )}

      {/* ── Featured ─────────────────────────────────────────────────── */}
      {data.featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <PanelHeader
            title={
              <span className="flex items-center gap-2">
                <Star className="size-4 text-warn-400 fill-warn-400" aria-hidden />
                Featured
              </span>
            }
            description="Hand-picked by our merchandising team."
            action={
              <Link href="/products?sort=featured" className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200 flex items-center">
                View all <ChevronRight className="size-3.5 ml-1" aria-hidden />
              </Link>
            }
          />
          <ProductRail products={data.featured} />
        </section>
      )}

      {/* ── Promo Banner ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-volt-500/10 via-plasma-500/10 to-volt-500/10 border border-white/5 p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-volt-500/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Percent className="size-5 text-volt-300" />
              <h2 className="text-lg sm:text-xl font-semibold text-ink">No-Cost EMI on all phones</h2>
            </div>
            <p className="text-sm text-ink-2 max-w-md">
              Up to 24 months. HDFC, ICICI, SBI, Axis & more. Credit, debit & cardless options available.
            </p>
          </div>
          <ButtonLink href="/products" variant="outline" size="sm" className="shrink-0">
            Explore EMI options
            <ArrowRight className="size-3.5 ml-1.5" aria-hidden />
          </ButtonLink>
        </div>
      </section>

      {/* ── Trending ─────────────────────────────────────────────────── */}
      {data.trending.length > 0 && (
        <section aria-labelledby="trending-heading">
          <PanelHeader
            title={
              <span className="flex items-center gap-2">
                <TrendingUp className="size-4 text-good-400" aria-hidden />
                Trending now
              </span>
            }
            description="What other customers are buying right now."
            action={
              <Link href="/products?sort=popular" className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200 flex items-center">
                View all <ChevronRight className="size-3.5 ml-1" aria-hidden />
              </Link>
            }
          />
          <ProductRail products={data.trending} />
        </section>
      )}

      {/* ── Deals ────────────────────────────────────────────────────── */}
      {data.deals.length > 0 && (
        <section aria-labelledby="deals-heading">
          <PanelHeader
            title={
              <span className="flex items-center gap-2">
                <Percent className="size-4 text-bad-400" aria-hidden />
                Top deals
              </span>
            }
            description="Biggest discounts across the catalogue."
            action={
              <Link href="/products?sort=discount" className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200 flex items-center">
                View all <ChevronRight className="size-3.5 ml-1" aria-hidden />
              </Link>
            }
          />
          <ProductRail products={data.deals} />
        </section>
      )}

      {/* ── Launching Soon ──────────────────────────────────────────── */}
      {data.launching.length > 0 && (
        <section aria-labelledby="launching-heading">
          <PanelHeader
            title={
              <span className="flex items-center gap-2">
                <Zap className="size-4 text-plasma-300" aria-hidden />
                Launching soon
              </span>
            }
            description="Pre-order or get notified when they drop."
            action={
              <Link href="/products?badge=preorder" className="text-sm font-medium text-volt-300 transition-colors hover:text-volt-200 flex items-center">
                View all <ChevronRight className="size-3.5 ml-1" aria-hidden />
              </Link>
            }
          />
          <ProductRail products={data.launching} />
        </section>
      )}

      {/* ── Brands ───────────────────────────────────────────────────── */}
      {data.brands.length > 0 && (
        <section aria-labelledby="brands-heading">
          <PanelHeader title="Brands" description="Official partners. Every device is genuine, warranty-honoured." />
          <BrandRail brands={data.brands} />
        </section>
      )}

      {/* ── Categories ───────────────────────────────────────────────── */}
      {data.categories.length > 0 && (
        <section aria-labelledby="categories-heading">
          <PanelHeader title="Shop by category" description="Browse the full catalogue by device type." />
          <CategoryGrid categories={data.categories} />
        </section>
      )}

      {/* ── Trust Bar ───────────────────────────────────────────────── */}
      <section aria-label="Why VOLTAGE" className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-volt-500/3 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BadgeCheck, title: 'Genuine warranty', desc: 'Every IMEI registered. Claims honoured by brand service centres.', color: 'text-good-400', bg: 'bg-good-400/10' },
            { icon: Truck, title: 'Fast, insured delivery', desc: 'Same-day dispatch in metros. Tracked, insured, signature on delivery.', color: 'text-volt-300', bg: 'bg-volt-400/10' },
            { icon: ShieldCheck, title: 'No-cost EMI', desc: 'Up to 24 months. Credit, debit & cardless options from major banks.', color: 'text-plasma-300', bg: 'bg-plasma-400/10' },
            { icon: Zap, title: 'Exchange & upgrade', desc: 'Instant credit for your old device. Doorstep pickup, data-safe wipe.', color: 'text-warn-400', bg: 'bg-warn-400/10' },
          ].map(({ icon: Icon, title, desc, color, bg }, i) => (
            <Panel key={i} flat className="p-5 text-center glass-card group hover:shadow-lift transition-all duration-300">
              <div className={`mx-auto flex size-11 items-center justify-center rounded-xl ${bg} ${color} transition-transform group-hover:scale-110`}>
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-xs text-ink-3 leading-relaxed">{desc}</p>
            </Panel>
          ))}
        </div>
      </section>

      <MiniCartBar />
    </div>
  );
}

function ProductRail({ products }: { products: Awaited<ReturnType<typeof homepageData>>['featured'] }) {
  return (
    <div className="snap-rail no-scrollbar fade-x -mx-4 px-4 pb-4" role="list">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} compact />
      ))}
    </div>
  );
}
