'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/money';
import { DeviceArt, DeviceStage } from './device-art';
import { Panel } from '@/components/ui/panel';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from './card';
import type { FlashSaleCountdownProps } from './types';

function formatEndDate(dateStr: Date | string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function FlashSaleCountdown({ sale, items }: FlashSaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number }>({ h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!sale) return;
    const update = () => {
      const diff = new Date(sale.endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0 });
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setTimeLeft({ h, m, s });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [sale]);

  if (!sale || !items.length) return null;

  return (
    <section className="relative" aria-labelledby="flash-sale-heading">
      <div className="panel bevel relative overflow-hidden ring-1 ring-volt-400/30">
        <div className="absolute inset-0 bg-gradient-to-r from-volt-500/8 via-transparent to-volt-500/8" aria-hidden />
        <div className="absolute top-0 left-1/3 w-[300px] h-[300px] rounded-full bg-volt-400/5 blur-[80px] pointer-events-none" aria-hidden />
        <div className="relative p-5 lg:p-8 lg:grid lg:grid-cols-[auto_1fr] lg:gap-8 lg:items-center">
          <div className="flex flex-col items-center gap-3 lg:items-start text-center lg:text-left">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-volt-300" aria-hidden />
              <span className="text-lg font-semibold tracking-wide text-ink">{sale.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 bg-volt-400/10 rounded-xl px-3 py-1.5 ring-1 ring-inset ring-volt-400/20">
                <Clock className="size-3.5 text-volt-300" aria-hidden />
                <span className="tabular font-mono font-medium text-volt-300">
                  {mounted
                    ? `${timeLeft.h.toString().padStart(2, '0')}:${timeLeft.m.toString().padStart(2, '0')}:${timeLeft.s.toString().padStart(2, '0')}`
                    : '--:--:--'}
                </span>
              </div>
              <span className="text-ink-3 hidden lg:inline">Ends {formatEndDate(sale.endsAt)}</span>
            </div>
            <Link
              href="/products?badge=flash_sale"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-volt-300 transition-colors hover:text-volt-200"
            >
              View all deals
              <Zap className="size-3.5" aria-hidden />
            </Link>
          </div>

          <div className="mt-6 lg:mt-0 snap-rail no-scrollbar fade-x -mx-4 lg:mx-0 px-4 lg:px-0 pb-4" role="list">
            {items.slice(0, 6).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group shrink-0 w-56 sm:w-64 flex flex-col"
                role="listitem"
              >
                <Panel flat className="relative flex-1 overflow-hidden transition-shadow duration-300 group-hover:shadow-lift">
                  <DeviceStage gradient={product.heroGradient} glow={false}>
                    <DeviceArt
                      colorHex={product.colors[0]?.hex || '#06b6d4'}
                      colorHex2={product.colors[0]?.hex2 || null}
                      kind={product.kind}
                      seed={product.slug}
                      brandMark={product.brand.name.length <= 8 ? product.brand.name.toUpperCase() : null}
                      className="size-full"
                    />
                  </DeviceStage>
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-void/95 via-void/60 to-transparent">
                    <Badge tone="cyan" size="xs" className="mb-2 inline-flex items-center gap-1">
                      <Zap className="size-2.5" aria-hidden />
                      FLASH
                    </Badge>
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <Badge tone="cyan" size="xs" className="capitalize">
                        {product.brand.name}
                      </Badge>
                    </div>
                    <h4 className="mt-1.5 truncate text-sm font-medium text-ink group-hover:text-volt-300 transition-colors">
                      {product.name}
                    </h4>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="tabular text-base font-semibold text-ink">{formatINR(product.finalPaise)}</span>
                      <span className="tabular text-sm text-ink-4 line-through">{formatINR(product.mrpPaise)}</span>
                      <Badge tone="emerald" size="xs" className="ml-auto">
                        {product.discountPercent}% off
                      </Badge>
                    </div>
                  </div>
                </Panel>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}