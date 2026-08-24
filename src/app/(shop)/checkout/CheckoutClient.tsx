'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Wallet, Plus, ChevronRight, ShieldCheck, Truck, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/money';
import { type CartView } from '@/lib/services/cart';
import { type Address } from '@prisma/client';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, Divider } from '@/components/ui/panel';
import { Button, ButtonLink } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';

type CheckoutClientProps = {
  cart: CartView;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    loyaltyTier: string;
  };
  addresses: Address[];
};

const FREE_DELIVERY_THRESHOLD_PAISE = 4_999_900;

export function CheckoutClient({ cart, user, addresses }: CheckoutClientProps) {
  const router = useRouter();
  const toast = useToast();
  
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find(a => a.isDefault)?.id ?? addresses[0]?.id ?? null
  );
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotalPaise = cart.subtotalPaise + cart.protectionPaise;
  const deliveryPaise = subtotalPaise >= FREE_DELIVERY_THRESHOLD_PAISE ? 0 : 5_900;
  const totalPaise = subtotalPaise + deliveryPaise;

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const placeOrder = useCallback(async () => {
    if (!selectedAddressId || isPlacingOrder) {
      toast.error('Please select a delivery address');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await api('/api/orders', {
        method: 'POST',
        json: {
          addressId: selectedAddressId,
          paymentMethod: paymentMethod,
        },
      });

      if (res.ok) {
        const order = res.data as { id: string; orderNo: string };
        toast.success('Order placed successfully!');
        router.push(`/account/orders/${order.orderNo}`);
      } else {
        toast.error(res.error || 'Failed to place order');
      }
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  }, [selectedAddressId, paymentMethod, isPlacingOrder, toast, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ButtonLink href="/cart" variant="ghost" size="sm" icon={<ArrowLeft className="size-4" />}>
            Back to cart
          </ButtonLink>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Checkout</h1>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* Main content */}
        <div className="space-y-6">
          {/* Delivery address */}
          <Panel>
            <PanelHeader 
              title="Delivery address" 
              icon={<MapPin className="size-4" />}
              action={
                <ButtonLink href="/account/profile?tab=addresses" variant="ghost" size="sm">
                  <Plus className="size-4" />
                  Add new
                </ButtonLink>
              }
            />
            <PanelBody className="space-y-3 p-5">
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-ink-3 mb-4">No saved addresses</p>
                  <ButtonLink href="/account/profile?tab=addresses" variant="secondary" size="sm">
                    Add address
                  </ButtonLink>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-lg ring-1 ring-inset cursor-pointer transition-colors',
                        selectedAddressId === address.id
                          ? 'bg-volt-400/5 ring-volt-400/30'
                          : 'bg-panel-2 ring-line hover:ring-volt-400/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 size-4 text-volt-400 border-line bg-panel-2 focus:ring-volt-400"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-ink">{address.fullName}</p>
                          {address.isDefault && (
                            <Badge tone="violet" size="xs">Default</Badge>
                          )}
                          <Badge tone="neutral" size="xs" className="capitalize">{address.label}</Badge>
                        </div>
                        <p className="text-sm text-ink-3">
                          {address.line1}, {address.line2 && `${address.line2}, `}
                          {address.city}, {address.state} {address.pincode}
                        </p>
                        <p className="text-sm text-ink-3 mt-1">Phone: {address.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </PanelBody>
          </Panel>

          {/* Payment method */}
          <Panel>
            <PanelHeader title="Payment method" icon={<CreditCard className="size-4" />} />
            <PanelBody className="space-y-3 p-5">
              <label
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg ring-1 ring-inset cursor-pointer transition-colors',
                  paymentMethod === 'online'
                    ? 'bg-volt-400/5 ring-volt-400/30'
                    : 'bg-panel-2 ring-line hover:ring-volt-400/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="size-4 text-volt-400 border-line bg-panel-2 focus:ring-volt-400"
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">Online Payment</p>
                    <p className="text-xs text-ink-3">UPI, Cards, Net Banking, Wallets</p>
                  </div>
                </div>
                <Badge tone="emerald" size="xs">Recommended</Badge>
              </label>

              <label
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg ring-1 ring-inset cursor-pointer transition-colors',
                  paymentMethod === 'cod'
                    ? 'bg-volt-400/5 ring-volt-400/30'
                    : 'bg-panel-2 ring-line hover:ring-volt-400/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="size-4 text-volt-400 border-line bg-panel-2 focus:ring-volt-400"
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">Cash on Delivery</p>
                    <p className="text-xs text-ink-3">Pay when you receive</p>
                  </div>
                </div>
              </label>
            </PanelBody>
          </Panel>

          {/* Order items */}
          <Panel>
            <PanelHeader title={`Order items (${cart.lines.length})`} />
            <PanelBody className="p-5 space-y-4">
              {cart.lines.map((line) => (
                <div key={line.itemId} className="flex items-center gap-3">
                  <div
                    className="size-16 shrink-0 rounded-lg ring-1 ring-inset ring-line"
                    style={{ background: line.heroGradient }}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {line.brandName} {line.productName}
                    </p>
                    <p className="text-xs text-ink-3 truncate">{line.variantLabel}</p>
                    <p className="text-xs text-ink-3">Qty: {line.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink tabular">
                      {formatINR(line.price.finalPaise * line.quantity)}
                    </p>
                    {line.price.discountPercent > 0 && (
                      <p className="text-xs text-good-400">{line.price.discountPercent}% off</p>
                    )}
                  </div>
                </div>
              ))}
            </PanelBody>
          </Panel>
        </div>

        {/* Order summary sidebar */}
        <aside className="lg:sticky lg:top-24">
          <Panel>
            <PanelHeader title="Order summary" />
            <PanelBody className="p-5 space-y-3">
              <Row label="Subtotal" value={formatINR(cart.subtotalPaise)} />
              {cart.savingsPaise > 0 && (
                <Row label="Discount" value={`-${formatINR(cart.savingsPaise)}`} tone="good" />
              )}
              {cart.protectionPaise > 0 && (
                <Row label="Protection plans" value={formatINR(cart.protectionPaise)} />
              )}
              <Row
                label="Delivery"
                value={deliveryPaise === 0 ? 'Free' : formatINR(deliveryPaise)}
                tone={deliveryPaise === 0 ? 'good' : 'default'}
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
                onClick={placeOrder}
                disabled={!selectedAddressId || isPlacingOrder || cart.isEmpty || cart.hasStockIssues}
                loading={isPlacingOrder}
              >
                {paymentMethod === 'cod' ? 'Place order' : 'Proceed to payment'}
                <ChevronRight className="size-4 ml-2" aria-hidden />
              </Button>
            </PanelFooter>
          </Panel>

          {/* Trust badges */}
          <Panel flat className="p-4 mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-ink-2">
              <ShieldCheck className="size-4 text-good-400" aria-hidden />
              <span>100% secure payments</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-2">
              <Truck className="size-4 text-volt-400" aria-hidden />
              <span>Same-day dispatch</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-2">
              <ShieldCheck className="size-4 text-plasma-300" aria-hidden />
              <span>GST invoice</span>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
