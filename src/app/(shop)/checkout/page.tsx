import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { resolveCart, getCart } from '@/lib/services/cart';
import { db } from '@/lib/db';
import { CheckoutClient } from './CheckoutClient';

export const metadata = {
  title: 'Checkout — VOLTAGE',
  description: 'Complete your order at VOLTAGE',
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login?next=/checkout');
  }

  const cartId = await resolveCart(user.id);
  const cart = await getCart(cartId, { loyaltyTier: user.loyaltyTier });

  if (cart.isEmpty) {
    redirect('/cart');
  }

  if (cart.hasStockIssues) {
    redirect('/cart');
  }

  const addresses = await db.address.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return (
    <CheckoutClient
      cart={cart}
      user={user}
      addresses={addresses}
    />
  );
}
