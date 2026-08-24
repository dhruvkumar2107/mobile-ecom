'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, ShieldCheck, RotateCcw, Tag, Gift, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR, discountPercent } from '@/lib/money';
import { type CartView, type CartLine } from '@/lib/services/cart';
import { type ProtectionPlan } from '@prisma/client';

type ProtectionPlanWithExtras = Omit<ProtectionPlan, 'coverage'> & {
  forItemId: string;
  forProduct: string;
  pricePaise?: number;
  coverage?: string | string[];
};
import { type AppSettings } from '@/lib/services/settings';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, EmptyState, Divider, StatTile } from '@/components/ui/panel';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';

const FREE_DELIVERY_THRESHOLD_PAISE = 4_999_900;

export function CartClient({ initialCart, initialProtectionOffers, settings, user }: {
  initialCart: CartView;
  initialProtectionOffers?: ProtectionPlanWithExtras[];
  settings: AppSettings;
  user: { id: string; name: string | null; email: string | null; role: string; loyaltyTier: string } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [cart, setCart] = useState<CartView>(initialCart);
  const [protectionOffers, setProtectionOffers] = useState<ProtectionPlanWithExtras[]>(initialProtectionOffers ?? []);
  const [couponCode, setCouponCode] = useState(cart.couponCode ?? '');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(cart.couponCode ?? null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const subtotalPaise = cart.subtotalPaise + cart.protectionPaise;
  const deliveryPaise = subtotalPaise >= FREE_DELIVERY_THRESHOLD_PAISE ? 0 : 5_900;
  const totalPaise = subtotalPaise + deliveryPaise;
  const savingsPercent = cart.mrpTotalPaise > 0 ? discountPercent(cart.mrpTotalPaise, cart.subtotalPaise) : 0;

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity === cart.lines.find((l) => l.itemId === itemId)?.quantity) return;
    setIsUpdating(itemId);
    try {
      const res = await api(`/api/cart`, {
        method: 'PATCH',
        json: { itemId, quantity },
      });
      if (res.ok) {
        const newCart = res.data as CartView;
        setCart(newCart);
        toast.success('Cart updated');
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdating(null);
    }
  }, [cart, toast]);

  const removeItem = useCallback(async (itemId: string) => {
    setIsUpdating(itemId);
    try {
      const res = await api(`/api/cart`, {
        method: 'DELETE',
        json: { itemId },
      });
      if (res.ok) {
        const newCart = res.data as CartView;
        setCart(newCart);
        toast.success('Item removed');
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setIsUpdating(null);
    }
  }, [toast]);

  const setProtection = useCallback(async (itemId: string, protectionPlanId: string | null) => {
    setIsUpdating(itemId);
    try {
      const res = await api(`/api/cart`, {
        method: 'PATCH',
        json: { itemId, protectionPlanId },
      });
      if (res.ok) {
        const newCart = res.data as CartView;
        setCart(newCart);
        toast.success('Protection plan updated');
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to update protection');
    } finally {
      setIsUpdating(null);
    }
  }, [toast]);

  const applyCoupon = useCallback(async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setIsApplyingCoupon(true);
    try {
      const res = await api(`/api/cart/coupon`, {
        method: 'POST',
        json: { couponCode: code },
      });
      if (res.ok) {
        const newCart = res.data as CartView;
        setCart(newCart);
        setAppliedCoupon(code);
        toast.success('Coupon applied');
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [couponCode, toast]);

  const removeCoupon = useCallback(async () => {
    setIsApplyingCoupon(true);
    try {
      const res = await api(`/api/cart/coupon`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const newCart = res.data as CartView;
        setCart(newCart);
        setAppliedCoupon(null);
        setCouponCode('');
        toast.success('Coupon removed');
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to remove coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [toast]);

  const handleCheckout = useCallback(async () => {
    if (cart.isEmpty || cart.hasStockIssues || isCheckingOut) return;
    if (!user) {
      router.push(`/login?next=/checkout`);
      return;
    }
    setIsCheckingOut(true);
    try {
      router.push('/checkout');
    } finally {
      setIsCheckingOut(false);
    }
  }, [cart.isEmpty, cart.hasStockIssues, user, router]);

  const protectionForItem = (itemId: string) => protectionOffers.find((o) => o.forItemId === itemId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Your cart</h1>

      {cart.isEmpty ? (
        <EmptyState
          icon={<Gift className="size-5" />}
          title="Your cart is empty"
          description="Looks like you haven&apos;t added anything yet. Browse our catalogue and pick your next device."
          action={
            <ButtonLink href="/products" size="md">
              <ArrowRight className="size-4 ml-2" aria-hidden />
              Continue shopping
            </ButtonLink>
          }
        />
      ) : (
        <>
          {/* Cart items */}
          <Panel>
            <PanelBody className="p-5 pt-0 space-y-0">
              {cart.lines.map((line) => (
                <CartLineItem
                  key={line.itemId}
                  line={line}
                  cart={cart}
                  protectionOffers={protectionOffers}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  onSetProtection={setProtection}
                  isUpdating={isUpdating === line.itemId}
                />
              ))}

              {cart.hasStockIssues && (
                <PanelFooter className="border-t border-line bg-bad-400/5">
                  <div className="flex items-center gap-2 text-sm text-bad-400">
                    <X className="size-4 shrink-0" aria-hidden />
                    Some items have stock issues — please review before checkout.
                  </div>
                </PanelFooter>
              )}
            </PanelBody>
          </Panel>

          {/* Coupon & Protection */}
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
            <div className="space-y-4">
              {/* Coupon */}
              <Panel>
                <PanelHeader title="Coupon code" icon={<Tag className="size-4" />} />
                <PanelBody className="p-5 space-y-3">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between">
                      <span className="tabular text-lg font-semibold text-ink">{appliedCoupon}</span>
                      <Button variant="ghost" size="sm" onClick={removeCoupon} disabled={isApplyingCoupon}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1"
                        disabled={isApplyingCoupon}
                      />
                      <Button size="md" onClick={applyCoupon} loading={isApplyingCoupon} disabled={isApplyingCoupon}>
                        Apply
                      </Button>
                    </div>
                  )}
                </PanelBody>
              </Panel>

              {/* Protection offers */}
              {protectionOffers.length > 0 && (
                <Panel>
                  <PanelHeader title="Protect your device" icon={<ShieldCheck className="size-4" />} />
                  <PanelBody className="p-5 space-y-3">
                    {protectionOffers.map((offer) => (
                      <ProtectionOfferCard
                        key={offer.id}
                        offer={offer}
                        cart={cart}
                        onSelect={setProtection}
                      />
                    ))}
                  </PanelBody>
                </Panel>
              )}

              {/* Continue shopping */}
              <ButtonLink href="/products" variant="secondary" fullWidth>
                <ArrowRight className="size-3.5 mr-1.5" aria-hidden />
                Continue shopping
              </ButtonLink>
            </div>

            {/* Order summary */}
            <aside className="lg:sticky lg:top-24">
              <Panel>
                <PanelHeader title="Order summary" />
                <PanelBody className="p-5 space-y-3">
                  <Row label="Subtotal" value={formatINR(cart.subtotalPaise)} />
                  {cart.savingsPaise > 0 && (
                    <Row
                      label="Savings"
                      value={formatINR(cart.savingsPaise)}
                      tone="good"
                      hint={`(${savingsPercent}% off MRP)`}
                    />
                  )}
                  {cart.protectionPaise > 0 && (
                    <Row label="Protection plans" value={formatINR(cart.protectionPaise)} />
                  )}
                  <Row label="Coupon discount" value={cart.couponCode ? formatINR(0) : '—'} />
                  <Divider />
                  <Row
                    label="Delivery"
                    value={deliveryPaise === 0 ? 'Free' : formatINR(deliveryPaise)}
                    hint={
                      deliveryPaise === 0
                        ? 'Free delivery unlocked'
                        : `Add ₹${formatINR(FREE_DELIVERY_THRESHOLD_PAISE - subtotalPaise).replace('₹', '')} more for free delivery`
                    }
                  />
                  <Divider />
                  <Row
                    label="Total"
                    value={formatINR(totalPaise)}
                    strong
                    tone="default"
                  />
                  <p className="text-xs text-ink-3">GST included. Prices in INR.</p>
                </PanelBody>
                <PanelFooter>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleCheckout}
                    disabled={cart.isEmpty || cart.hasStockIssues || !user || isCheckingOut}
                    loading={isCheckingOut}
                  >
                    {user ? 'Proceed to checkout' : 'Sign in to checkout'}
                    <ArrowRight className="size-3.5 ml-2" aria-hidden />
                  </Button>
                  {!user && (
                    <p className="mt-2 text-center text-xs text-ink-3">
                      Sign in to use wallet balance, loyalty points and saved addresses.
                    </p>
                  )}
                </PanelFooter>
              </Panel>

              {/* Trust badges */}
              <Panel flat className="p-4 space-y-2">
                <StatTile
                  label="Genuine warranty"
                  value="IMEI-locked"
                  icon={<RotateCcw className="size-4" />}
                  tone="violet"
                />
                <StatTile
                  label="Free delivery"
                  value={`Over ${formatINR(FREE_DELIVERY_THRESHOLD_PAISE).replace('₹', '')}`}
                  icon={<Gift className="size-4" />}
                  tone="cyan"
                />
                <StatTile
                  label="Easy returns"
                  value="14 days"
                  icon={<RotateCcw className="size-4" />}
                  tone="emerald"
                />
              </Panel>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function CartLineItem({
  line,
  cart,
  protectionOffers,
  onUpdateQuantity,
  onRemove,
  onSetProtection,
  isUpdating,
}: {
  line: CartLine;
  cart: CartView;
  protectionOffers: Array<ProtectionPlanWithExtras>;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onSetProtection: (itemId: string, protectionPlanId: string | null) => void;
  isUpdating: boolean;
}) {
  const currentProtection = line.protection?.id ?? null;
  const itemProtectionOffers = protectionOffers.filter((o) => o.forItemId === line.itemId);

  return (
    <div className="border-t border-line py-4 first:border-0">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Product image & info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="size-20 shrink-0 rounded-lg ring-1 ring-inset ring-line"
            style={{ background: line.heroGradient }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">{line.brandName} {line.productName}</p>
            <p className="mt-0.5 text-xs text-ink-3 truncate">{line.variantLabel}</p>
            {line.isAccessory && (
              <Badge tone="violet" size="xs" className="mt-1.5 inline-block">Accessory</Badge>
            )}
            {line.stockIssue && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-warn-400">
                <X className="size-3" aria-hidden />
                {line.stockIssue}
              </p>
            )}
          </div>
        </div>

        {/* Price & quantity */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <span className="tabular text-lg font-semibold text-ink">
              {formatINR(line.price.finalPaise * line.quantity)}
            </span>
            {line.price.mrpPaise > line.price.finalPaise && (
              <span className="tabular text-sm text-ink-4 line-through">
                {formatINR(line.price.mrpPaise * line.quantity)}
              </span>
            )}
            {line.price.discountPercent > 0 && (
              <Badge tone="emerald" size="xs">{line.price.discountPercent}% off</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 border border-line rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.itemId, line.quantity - 1)}
              disabled={line.quantity <= 1 || isUpdating}
              className="p-2 text-ink-3 hover:text-ink hover:bg-panel-2 transition-colors disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>
            <span className="px-3 tabular text-sm font-medium text-ink min-w-[3rem] text-center">{line.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.itemId, line.quantity + 1)}
              disabled={line.quantity >= 5 || line.quantity >= line.sellable || isUpdating}
              className="p-2 text-ink-3 hover:text-ink hover:bg-panel-2 transition-colors disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* Protection & Remove */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 min-w-[180px]">
          {itemProtectionOffers.length > 0 && (
            <Select
              value={currentProtection ?? ''}
              onChange={(e) => onSetProtection(line.itemId, e.target.value || null)}
              disabled={isUpdating}
              className="w-full lg:w-48"
              options={[
                { value: '', label: 'No protection' },
                ...itemProtectionOffers.map((o) => ({
                  value: o.id,
                  label: `${o.name} · ${formatINR(o.priceType === 'percent' ? Math.round(line.price.finalPaise * o.priceValue / 100) : o.priceValue)}`,
                })),
              ]}
            />
          )}
          <button
            type="button"
            onClick={() => onRemove(line.itemId)}
            disabled={isUpdating}
            className="text-ink-4 hover:text-bad-400 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function ProtectionOfferCard({
  offer,
  cart,
  onSelect,
}: {
  offer: ProtectionPlanWithExtras;
  cart: CartView;
  onSelect: (itemId: string, protectionPlanId: string | null) => void;
}) {
  const line = cart.lines.find((l) => l.itemId === offer.forItemId);
  const isSelected = line?.protection?.id === offer.id;

  return (
    <div
      className={cn(
        'p-3 rounded-lg ring-1 ring-inset transition-colors',
        isSelected ? 'bg-volt-400/5 ring-volt-400/30' : 'bg-panel-2 ring-line'
      )}
    >
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name={`protection-${offer.forItemId}`}
            checked={isSelected}
            onChange={() => onSelect(offer.forItemId, offer.id)}
            className="size-4 text-volt-400 border-line bg-panel-2 focus:ring-volt-400"
          />
          <div>
            <p className="text-sm font-medium text-ink">{offer.name}</p>
            <p className="text-xs text-ink-3">{offer.durationMonths} months coverage · {formatINR(offer.priceType === 'percent' ? Math.round(line?.price.finalPaise ?? 0 * offer.priceValue / 100) : offer.priceValue)}</p>
          </div>
          <span className="tabular text-sm font-semibold text-ink shrink-0">{formatINR(offer.priceType === 'percent' ? Math.round(line?.price.finalPaise ?? 0 * offer.priceValue / 100) : offer.priceValue)}</span>
        </div>
      </label>
    </div>
  );
}