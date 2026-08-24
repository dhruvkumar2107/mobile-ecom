'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Truck, AlertCircle, CheckCircle, Clock, Package, MapPin, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/enums';
import { formatINR } from '@/lib/money';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, EmptyState, Divider } from '@/components/ui/panel';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackOrder } from '@/lib/services/orders';

type TrackOrder = Awaited<ReturnType<typeof trackOrder>> | null;

type TrackClientProps = {
  initialOrder: TrackOrder;
  initialOrderNo: string;
};

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
];

const STATUS_ICONS: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  confirmed: CheckCircle,
  packed: Package,
  shipped: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle,
  returned: RotateCcw,
};

export function TrackClient({ initialOrder, initialOrderNo }: TrackClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderNo, setOrderNo] = useState(initialOrderNo);
  const [order, setOrder] = useState<TrackOrder>(initialOrder);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const value = orderNo.trim().toUpperCase();
    if (!value) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track?orderNo=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        router.push(`/track?orderNo=${encodeURIComponent(value)}`);
      } else {
        const err = await res.json();
        setError(err.error ?? 'Order not found');
        setOrder(null);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderNo, router]);

  const currentStatus = order?.status ?? null;
  const currentIndex = currentStatus ? STATUS_ORDER.indexOf(currentStatus as OrderStatus) : -1;

  return (
    <div className="space-y-6">
      {/* Search form */}
      <Panel flat>
        <PanelBody className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-4" aria-hidden />
              <Input
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="Enter order number (e.g., VOL-2024-001234)"
                className="pl-10 h-11 text-lg"
                autoComplete="off"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" loading={isLoading} className="shrink-0">
              Track
            </Button>
          </form>
          <p className="mt-3 text-sm text-ink-3">
            Find your order number in the confirmation email or SMS. No account needed.
          </p>
        </PanelBody>
      </Panel>

      {error && (
        <Panel className="ring-1 ring-inset ring-bad-400/30">
          <PanelBody className="p-5">
            <div className="flex items-center gap-3 text-bad-400">
              <AlertCircle className="size-5 shrink-0" aria-hidden />
              <p className="text-sm">{error}</p>
            </div>
          </PanelBody>
        </Panel>
      )}

      {order && (
        <>
          {/* Timeline */}
          <Panel>
            <PanelHeader
              title={`Order ${order.orderNo}`}
              description={
                <div className="flex flex-wrap items-center gap-4 text-sm text-ink-3">
                  <span>Placed {formatDateTime(order.placedAt)}</span>
                  {order.expectedDeliveryAt && (
                    <span className="flex items-center gap-1.5 text-warn-400">
                      <MapPin className="size-3.5" aria-hidden />
                      Expected {formatDate(order.expectedDeliveryAt)}
                    </span>
                  )}
                </div>
              }
              icon={<Package className="size-4" />}
            />
            <PanelBody className="p-5 pt-0">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-line" aria-hidden />

                {order.events.map((event, i) => {
                  const isCurrent = event.status === currentStatus;
                  const isPast = STATUS_ORDER.indexOf(event.status as OrderStatus) <= currentIndex;
                  const Icon = STATUS_ICONS[event.status as OrderStatus] ?? Clock;
                  const meta = ORDER_STATUS_META[event.status as OrderStatus];

                  return (
                    <div key={`${event.status}-${i}`} className="relative flex gap-4">
                      <div className="relative flex-shrink-0 w-12">
                        <div
                          className={cn(
                            'relative size-10 rounded-full flex items-center justify-center ring-4 transition-colors',
                            isCurrent
                              ? 'bg-volt-400 ring-volt-400/30 text-void'
                              : isPast
                              ? 'bg-good-400 ring-good-400/30 text-void'
                              : 'bg-panel-2 ring-line text-ink-3'
                          )}
                        >
                          <Icon className="size-5" aria-hidden />
                        </div>
                        {i < order.events.length - 1 && (
                          <div
                            className="absolute left-5 top-10 bottom-0 w-0.5"
                            style={{ background: isPast ? 'var(--color-good-400)' : 'var(--color-line)' }}
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1 pb-6">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-medium', isCurrent ? 'text-ink' : 'text-ink-2')}>
                            {meta?.label ?? event.status}
                          </span>
                          {isCurrent && (
                            <Badge tone="cyan" size="xs">Current</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-ink-3">{event.note}</p>
                        {event.location && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-4">
                            <MapPin className="size-3" aria-hidden />
                            {event.location}
                          </p>
                        )}
                        <p className="mt-1 tabular text-xs text-ink-4">{formatDateTime(event.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PanelBody>
          </Panel>

          {/* Courier tracking */}
          {(order.courier || order.awb || order.trackingUrl) && (
            <Panel>
              <PanelHeader title="Courier details" icon={<Truck className="size-4" />} />
              <PanelBody className="p-5 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {order.courier && (
                    <Row label="Courier" value={order.courier} />
                  )}
                  {order.awb && (
                    <Row label="AWB / Tracking No." value={order.awb} strong />
                  )}
                </div>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 text-sm font-medium text-volt-300 hover:text-volt-200"
                  >
                    View on courier site
                    <ChevronRight className="size-3.5" aria-hidden />
                  </a>
                )}
              </PanelBody>
            </Panel>
          )}

          {/* Items */}
          <Panel>
            <PanelHeader title="Items in this order" icon={<Package className="size-4" />} />
            <PanelBody className="p-5 pt-0">
              <ul className="divide-y divide-line">
                {order.items.map((item) => (
                  <li key={item.productName} className="flex items-center gap-3 py-3">
                    <div
                      className="size-16 rounded-lg ring-1 ring-inset ring-line"
                      style={{ background: item.imageGradient ?? undefined }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{item.brandName} {item.productName}</p>
                      <p className="tabular text-sm text-ink-3">Qty: {item.quantity}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>

          {/* Help */}
          <Panel flat className="bg-panel-2/50">
            <PanelBody className="p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 mt-0.5 shrink-0 text-warn-400" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-ink">Need help?</p>
                  <p className="mt-1 text-sm text-ink-3">
                    If your order is delayed or you have questions about delivery, contact our support team at{' '}
                    <a href="mailto:support@voltage.store" className="underline underline-offset-2 text-volt-300 hover:text-volt-200">
                      support@voltage.store
                    </a>
                    {' '}or call{' '}
                    <a href="tel:+918000000000" className="underline underline-offset-2 text-volt-300 hover:text-volt-200">
                      1800-VOLTAGE
                    </a>
                    .
                  </p>
                </div>
              </div>
            </PanelBody>
          </Panel>
        </>
      )}

      {!order && !error && !orderNo && (
        <EmptyState
          icon={<Truck className="size-5" />}
          title="Track your order"
          description="Enter your order number above to see real-time delivery updates. You don&apos;t need an account to track."
        />
      )}
    </div>
  );
}