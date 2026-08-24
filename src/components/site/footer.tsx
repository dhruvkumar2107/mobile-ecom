'use client';

import Link from 'next/link';
import { ChevronRight, Mail, MessageSquare, Phone, Truck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SiteFooter({
  supportEmail,
  supportPhone,
}: {
  supportEmail: string;
  supportPhone: string;
}) {
  return (
    <footer className="border-t border-line bg-abyss/40" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex" aria-label="VOLTAGE — home">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="size-8"
                aria-hidden="true"
              >
                <rect
                  width="32"
                  height="32"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 16h16M16 8v16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-ink-3">
              Ultra-premium mobile & electronics commerce. GST-invoiced,
              warranty-tracked, same-day dispatch.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
              >
                <Mail className="size-4" aria-hidden />
                {supportEmail}
              </a>
              <a
                href={`tel:${supportPhone}`}
                className="flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
              >
                <Phone className="size-4" aria-hidden />
                {supportPhone}
              </a>
            </div>
          </div>

          <nav aria-label="Shop">
            <h3 className="text-sm font-semibold tracking-wide text-ink-4 uppercase">Shop</h3>
            <ul className="mt-3 space-y-2" role="list">
              <li>
                <Link
                  href="/category/phones"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Phones
                </Link>
              </li>
              <li>
                <Link
                  href="/category/tablets"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Tablets
                </Link>
              </li>
              <li>
                <Link
                  href="/category/audio"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Audio
                </Link>
              </li>
              <li>
                <Link
                  href="/category/wearables"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Wearables
                </Link>
              </li>
              <li>
                <Link
                  href="/category/accessories"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Accessories
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  All devices
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Tools">
            <h3 className="text-sm font-semibold tracking-wide text-ink-4 uppercase">Tools</h3>
            <ul className="mt-3 space-y-2" role="list">
              <li>
                <Link
                  href="/compare"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Compare devices
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Track order
                </Link>
              </li>
              <li>
                <Link
                  href="/service-centres"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Service centres
                </Link>
              </li>
              <li>
                <Link
                  href="/p/warranty-policy"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Warranty policy
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="text-sm font-semibold tracking-wide text-ink-4 uppercase">Company</h3>
            <ul className="mt-3 space-y-2" role="list">
              <li>
                <Link
                  href="/p/about"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  About VOLTAGE
                </Link>
              </li>
              <li>
                <Link
                  href="/p/careers"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/p/press"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Press
                </Link>
              </li>
              <li>
                <Link
                  href="/p/sustainability"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Sustainability
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-sm font-semibold tracking-wide text-ink-4 uppercase">Legal</h3>
            <ul className="mt-3 space-y-2" role="list">
              <li>
                <Link
                  href="/p/privacy"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  href="/p/terms"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Terms of service
                </Link>
              </li>
              <li>
                <Link
                  href="/p/returns"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Returns & refunds
                </Link>
              </li>
              <li>
                <Link
                  href="/p/shipping"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Shipping policy
                </Link>
              </li>
              <li>
                <Link
                  href="/p/grievance"
                  className="text-sm text-ink-2 transition-colors hover:text-ink"
                >
                  Grievance officer
                </Link>
              </li>
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
              className="text-xs text-ink-4 transition-colors hover:text-ink"
            >
              Accessibility
            </a>
            <a
              href="/p/sitemap"
              className="text-xs text-ink-4 transition-colors hover:text-ink"
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