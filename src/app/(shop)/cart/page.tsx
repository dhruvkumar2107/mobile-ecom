import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { resolveCart, getCart, protectionOffersForCart } from '@/lib/services/cart';
import { getSettings } from '@/lib/services/settings';
import { CartClient } from './CartClient';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Review your VOLTAGE cart, apply protection plans and coupons, then proceed to checkout.',
};

export default async function CartPage() {
  const user = await getCurrentUser();
  const cartId = await resolveCart(user?.id ?? null);
  const [cart, settings] = await Promise.all([
    getCart(cartId, { loyaltyTier: user?.loyaltyTier ?? null }),
    getSettings(),
  ]);

  if (cart.isEmpty && !user) {
    // For empty guest cart, just show empty state
    return <CartClient initialCart={cart} settings={settings} user={null} />;
  }

  if (cart.isEmpty) {
    return <CartClient initialCart={cart} settings={settings} user={user} />;
  }

  // Get protection offers for the most expensive phone
  const protectionOffers = await protectionOffersForCart(cartId);

  return (
    <CartClient
      initialCart={cart}
      initialProtectionOffers={protectionOffers}
      settings={settings}
      user={user}
    />
  );
}