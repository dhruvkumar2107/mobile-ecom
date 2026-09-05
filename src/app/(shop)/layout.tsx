import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/services/settings';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';

const PageTransition = dynamic(
  () => import('@/components/ui/page-transition').then((m) => m.PageTransition),
  { ssr: false },
);

/**
 * The `(shop)` route group wraps every storefront page. It resolves the
 * signed-in user and the cart count on the server, then hands those four
 * serialisable fields down to the chrome. The chrome is deliberately pure
 * client — no data fetching, no server-only imports — so the initial HTML
 * stream is as fast as possible.
 */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const [settings, cart] = await Promise.all([
    getSettings(),
    // Read-only count: `resolveCart` would create a cart row on every page view.
    db.cart.findFirst({
      where: { userId: user?.id ?? undefined, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      select: { items: { select: { quantity: true } } },
    }),
  ]);

  const cartCount = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        user={user
          ? {
              name: user.name,
              email: user.email,
              role: user.role,
              loyaltyTier: user.loyaltyTier,
            }
          : null}
        cartCount={cartCount}
        announcement={{
          text: settings.announcementText,
          enabled: settings.announcementEnabled,
        }}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <PageTransition>{children}</PageTransition>
      </main>

      <SiteFooter supportEmail={settings.supportEmail} supportPhone={settings.supportPhone} />
    </div>
  );
}