'use client';

import { useEffect, useState } from 'react';
import { Heart, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useWishlist } from '@/hooks/use-wishlist';
import { Panel, PanelHeader, PanelBody, EmptyState } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/money';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WishlistProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    brandName: string;
    imageUrl: string | null;
    heroGradient: string;
    mrpPaise: number;
    pricePaise: number;
    ratingAvg: number;
    inStock: boolean;
  };
  addedAt: string;
}

const HeartIcon = () => <Heart className="size-6" />;
const TrashIcon = () => <Trash2 className="size-4" />;
const CartIcon = () => <ShoppingCart className="size-4" />;
const LoaderIcon = () => <Loader2 className="size-4 animate-spin" />;

export function WishlistClient() {
  const { items, removeItem, syncWithServer, hasHydrated } = useWishlist();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.items);
        }
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (hasHydrated) {
      fetchWishlist();
    }
  }, [hasHydrated, items]);

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        toast.success('Added to cart');
        // Optionally remove from wishlist after adding to cart
        // await removeItem(productId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleRemove = async (productId: string) => {
    await removeItem(productId);
    setProducts((prev) => prev.filter((item) => item.productId !== productId));
  };

  const discountPercent = (product: WishlistProduct['product']) => {
    if (product.mrpPaise <= product.pricePaise) return 0;
    return Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-volt-400" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Panel>
          <PanelHeader
            title="My Wishlist"
            description="Save your favorite products and never miss a deal"
          />
          <PanelBody>
            <EmptyState
              icon={<HeartIcon />}
              title="Your wishlist is empty"
              description="Browse products and click the heart icon to save items you love"
              action={<Link href="/products" className="inline-flex items-center justify-center rounded-lg bg-volt-400 px-4 py-2 text-sm font-medium text-white hover:bg-volt-300">Browse products</Link>}
            />
          </PanelBody>
        </Panel>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Panel>
        <PanelHeader
          title={`My Wishlist (${products.length})`}
          description="Your saved products and price drop alerts"
        />
        <PanelBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-lg border border-ink-8 bg-void-lighter p-4 transition-all hover:border-volt-400 hover:shadow-lg"
              >
                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="absolute top-2 right-2 z-10 rounded-full bg-void/80 p-1.5 text-ink-3 opacity-0 transition-all hover:bg-bad-400/20 hover:text-bad-400 group-hover:opacity-100"
                  aria-label="Remove from wishlist"
                >
<TrashIcon />
                </button>

                <Link href={`/products/${item.product.slug}`} className="block">
                  {/* Product Image */}
                  <div
                    className="relative mb-3 aspect-square rounded-lg overflow-hidden"
                    style={{
                      background: item.product.heroGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="size-full object-contain p-4"
                      />
                    ) : (
                      <div className="flex items-center justify-center size-full text-ink-4">
                        No image
                      </div>
                    )}

                    {!item.product.inStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-void/80">
                        <Badge tone="rose" size="sm">
                          Out of stock
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-2">
                    <Badge tone="cyan" size="xs">
                      {item.product.brandName}
                    </Badge>

                    <h3 className="font-medium text-ink line-clamp-2 group-hover:text-volt-400 transition-colors">
                      {item.product.name}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-ink">
                        {formatINR(item.product.pricePaise)}
                      </span>
                      {item.product.mrpPaise > item.product.pricePaise && (
                        <>
                          <span className="text-sm text-ink-4 line-through">
                            {formatINR(item.product.mrpPaise)}
                          </span>
                          <Badge tone="emerald" size="xs">
                            {discountPercent(item.product)}% off
                          </Badge>
                        </>
                      )}
                    </div>

                    {item.product.ratingAvg > 0 && (
                      <div className="flex items-center gap-1 text-xs text-ink-3">
                        <span className="text-good-400">★</span>
                        <span>{item.product.ratingAvg.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Add to Cart Button */}
                <Button
                  onClick={() => handleAddToCart(item.productId)}
                  disabled={!item.product.inStock || addingToCart === item.productId}
                  className={cn(
                    'mt-4 w-full',
                    !item.product.inStock && 'opacity-50 cursor-not-allowed'
                  )}
                  size="sm"
                >
                  {addingToCart === item.productId ? (
<LoaderIcon />
                  ) : (
                    <>
<CartIcon />
                      {item.product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </>
                  )}
                </Button>

                {/* Added Date */}
                <p className="mt-2 text-xs text-ink-4 text-center">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
