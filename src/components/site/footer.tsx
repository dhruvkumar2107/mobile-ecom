'use client';

import Link from 'next/link';
import { ChevronRight, Mail, MessageSquare, Phone, Truck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand-mark';

export function SiteFooter({
  supportEmail,
  supportPhone,
}: {
  supportEmail: string;
  supportPhone: string;
}) {
  return (
    <footer className="relative border-t border-line bg-abyss/40" aria-labelledby="footer-heading">
      {/* Subtle top glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt-500/20 to-transparent" aria-hidden="true" />
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex" aria-label="VOLTAGE — home">
              <BrandMark size="md" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-ink-3 leading-relaxed">
              Ultra-premium mobile & electronics commerce. GST-invoiced,
              warranty-tracked, same-day dispatch.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-volt-300"
              >
                <Mail className="size-4" aria-hidden />
                {supportEmail}
              </a>
              <a
                href={`tel:${supportPhone}`}
                className="flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-volt-300"
              >
                <Phone className="size-4" aria-hidden />
                {supportPhone}
              </a>
            </div>
          </div>

          <nav aria-label="Shop">
            <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">Shop</h3>
            <ul className="mt-3 space-y-2.5" role="list">
              {[
                { href: '/category/mobiles', label: 'Phones' },
                { href: '/category/tablets', label: 'Tablets' },
                { href: '/category/audio', label: 'Audio' },
                { href: '/category/wearables', label: 'Wearables' },
                { href: '/category/accessories', label: 'Accessories' },
                { href: '/products', label: 'All devices' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-2 transition-colors hover:text-volt-300 hover:pl-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Tools">
            <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">Tools</h3>
            <ul className="mt-3 space-y-2.5" role="list">
              {[
                { href: '/compare', label: 'Compare devices' },
                { href: '/track', label: 'Track order' },
                { href: '/service-centres', label: 'Service centres' },
                { href: '/p/warranty-policy', label: 'Warranty policy' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-2 transition-colors hover:text-volt-300 hover:pl-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">Company</h3>
            <ul className="mt-3 space-y-2.5" role="list">
              {[
                { href: '/p/about', label: 'About VOLTAGE' },
                { href: '/p/careers', label: 'Careers' },
                { href: '/p/press', label: 'Press' },
                { href: '/p/sustainability', label: 'Sustainability' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-2 transition-colors hover:text-volt-300 hover:pl-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">Legal</h3>
            <ul className="mt-3 space-y-2.5" role="list">
              {[
                { href: '/p/privacy', label: 'Privacy policy' },
                { href: '/p/terms', label: 'Terms of service' },
                { href: '/p/returns', label: 'Returns & refunds' },
                { href: '/p/shipping', label: 'Shipping policy' },
                { href: '/p/grievance', label: 'Grievance officer' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-2 transition-colors hover:text-volt-300 hover:pl-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <p className="text-xs text-ink-4">
            © {new Date().getFullYear()} VOLTAGE. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="/p/accessibility"
              className="text-xs text-ink-4 transition-colors hover:text-volt-300"
            >
              Accessibility
            </a>
            <a
              href="/p/sitemap"
              className="text-xs text-ink-4 transition-colors hover:text-volt-300"
            >
              Sitemap
            </a>
            <span className="flex items-center gap-1.5 text-xs text-ink-4">
              <Zap className="size-3 fill-volt-300 text-volt-300" aria-hidden />
              Made in India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}