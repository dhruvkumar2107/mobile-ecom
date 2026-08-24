import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/services/settings';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { AccountNav } from '@/components/account/nav';

/**
 * The account area sits outside the `(shop)` route group, so it renders its own
 * site chrome — a signed-in customer still needs the header search, cart and
 * footer support numbers while they are managing their orders.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account');

  const [settings, cart] = await Promise.all([
    getSettings(),
    // Read-only count: `resolveCart` would create a cart row on every page view.
    db.cart.findFirst({
      where: { userId: user.id, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      select: { items: { select: { quantity: true } } },
    }),
  ]);

  const cartCount = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          loyaltyTier: user.loyaltyTier,
        }}
        cartCount={cartCount}
        announcement={{ text: settings.announcementText, enabled: settings.announcementEnabled }}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              <AccountNav
                walletBalancePaise={user.walletBalancePaise}
                loyaltyTier={user.loyaltyTier}
                loyaltyPoints={user.loyaltyPoints}
              />
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>

      <SiteFooter supportEmail={settings.supportEmail} supportPhone={settings.supportPhone} />
    </div>
  );
}
