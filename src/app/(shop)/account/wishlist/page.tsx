import { Metadata } from 'next';
import { WishlistClient } from './WishlistClient';

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'Save your favorite products and get notified about price drops.',
};

export default function WishlistPage() {
  return <WishlistClient />;
}
