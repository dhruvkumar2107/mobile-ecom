'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Truck, RotateCcw, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, FileText, ShieldCheck, Calendar, MapPin, CreditCard, DollarSign, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/money';
import { formatDate, formatDateTime, pluralise, initials } from '@/lib/utils';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/enums';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, Divider, EmptyState } from '@/components/ui/panel';
import { Button, ButtonLink } from '@/components/ui/button';
import { Modal } from '@/components/ui/overlay';
import { LiveOrderTracking } from '@/components/ui/live-order-tracking';
import { getOrder } from '@/lib/services/orders';

type OrderDetail = Awaited<ReturnType<typeof getOrder>>;

type OrderDetailClientProps = {
  initialOrder: OrderDetail;
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

export function OrderDetailClient({ initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [expandedEvents, setExpandedEvents] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  const currentStatus = order.status;
  const currentIndex = STATUS_ORDER.indexOf(currentStatus as OrderStatus);
  const canCancel = order.canCancel && currentIndex <= STATUS_ORDER.indexOf('packed');
  const canReturn = order.canReturn;

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      const res = await fetch('/api/account/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, reason: cancelReason }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setShowCancelModal(false);
        setCancelReason('');
      } else {
        const err = await res.json();
        alert(err.error ?? 'Failed to cancel order');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) return;
    setIsReturning(true);
    try {
      const res = await fetch('/api/account/orders/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, reason: returnReason }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setShowReturnModal(false);
        setReturnReason('');
      } else {
        const err = await res.json();
        alert(err.error ?? 'Failed to create return');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setIsReturning(false);
    }
  };

  const timelineEvents = order.events.map((e, i) => ({
    ...e,
    isCurrent: e.status === currentStatus,
    isPast: STATUS_ORDER.indexOf(e.status as OrderStatus) <= currentIndex,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-ink-3">
            <span className="tabular">{order.orderNo}</span>
            <Badge tone={ORDER_STATUS_META[currentStatus as OrderStatus]?.tone ?? 'violet'} size="sm" dot>
              {ORDER_STATUS_META[currentStatus as OrderStatus]?.label ?? currentStatus}
            </Badge>
            {order.invoice && (
              <Badge tone="violet" size="xs">Invoice: {order.invoice.invoiceNo}</Badge>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {order.items.length === 1
              ? `${order.items[0].brandName} ${order.items[0].productName}`
              : `${order.items.length} items`}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/account/orders" variant="secondary" size="sm">
            <ArrowRight className="size-3.5 mr-1.5 rotate-180" aria-hidden />
            Back to orders
          </ButtonLink>
        </div>
      </div>

      {/* Live order tracking for shipped orders */}
      {['shipped', 'out_for_delivery'].includes(currentStatus) && (
        <LiveOrderTracking orderId={order.id} />
      )}

      {/* Timeline */}
      <Panel>
        <PanelHeader title="Order timeline" icon={<Package className="size-4" />} />
        <PanelBody className="p-5 pt-0">
          <button
            type="button"
            onClick={() => setExpandedEvents((e) => !e)}
            className="flex w-full items-center justify-between gap-3 py-2 text-left"
          >
            <span className="text-sm font-medium text-ink">
              {timelineEvents.length} updates · {expandedEvents ? 'Hide' : 'Show'} timeline
            </span>
            {expandedEvents ? <ChevronUp className="size-4 shrink-0 text-ink-3" /> : <ChevronDown className="size-4 shrink-0 text-ink-3" />}
          </button>
          {expandedEvents && (
            <div className="relative border-l border-line pl-6 ml-6">
              {timelineEvents.map((event, i) => {
                const isCurrent = event.isCurrent;
                const isPast = event.isPast;
                const Icon = STATUS_ICONS[event.status as OrderStatus] ?? Clock;

                return (
                  <div key={`${event.status}-${i}`} className="relative pb-6 last:pb-0">
                    <div className="absolute -left-6 top-0 flex size-10 items-center justify-center rounded-full ring-4 transition-colors">
                      {isCurrent ? (
                        <div className="size-5 text-void rounded-full flex items-center justify-center" style={{ background: 'var(--color-volt-400)' }}>
                          <Icon className="size-5" aria-hidden />
                        </div>
                      ) : isPast ? (
                        <div className="size-5 text-void rounded-full flex items-center justify-center" style={{ background: 'var(--color-good-400)' }}>
                          <Icon className="size-5" aria-hidden />
                        </div>
                      ) : (
                        <div className="size-5 text-ink-3 rounded-full flex items-center justify-center" style={{ background: 'var(--color-panel-2)' }}>
                          <Icon className="size-5" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium', isCurrent ? 'text-ink' : 'text-ink-2')}>
                          {ORDER_STATUS_META[event.status as OrderStatus]?.label ?? event.status}
                        </span>
                        {isCurrent && <Badge tone="cyan" size="xs">Current</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-ink-3">{event.note}</p>
                      {event.location && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-4">
                          <MapPin className="size-3" aria-hidden />
                          {event.location}
                        </p>
                      )}
                      <p className="tabular mt-1 text-xs text-ink-4">{formatDateTime(event.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PanelBody>
      </Panel>

      {/* Items */}
      <Panel>
        <PanelHeader title="Items" icon={<Package className="size-4" />} />
        <PanelBody className="p-5 pt-0 space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-4 py-3 border-t border-line first:border-0 first:pt-0">
              <div className="size-20 shrink-0 rounded-lg ring-1 ring-inset ring-line" style={{ background: item.imageGradient ?? undefined }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.brandName} {item.productName}</p>
                <p className="mt-0.5 text-xs text-ink-3 truncate">{item.variantLabel}</p>
                <p className="tabular mt-1 text-xs text-ink-4">Qty: {item.quantity} · {formatINR(item.unitPricePaise * item.quantity)}</p>
                {item.units.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.units.map((unit) => (
                      <Badge key={unit.id} tone="violet" size="xs">
                        {unit.imei1 ?? unit.serialNumber}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="tabular text-lg font-semibold text-ink">{formatINR(item.taxPaise)}</div>
              </div>
            </div>
          ))}
        </PanelBody>
      </Panel>

      {/* Delivery address */}
      {order.deliveryAddress && (
        <Panel>
          <PanelHeader title="Delivery address" icon={<MapPin className="size-4" />} />
          <PanelBody className="p-5">
            <address className="not-italic text-sm text-ink-2">
              {order.deliveryAddress.name}<br />
              {order.deliveryAddress.line1}<br />
              {order.deliveryAddress.line2 && `${order.deliveryAddress.line2}<br />`}
              {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}<br />
              {order.deliveryAddress.phone && `Phone: ${order.deliveryAddress.phone}`}
            </address>
          </PanelBody>
        </Panel>
      )}

      {/* Payment & pricing */}
      <Panel>
        <PanelHeader title="Payment & pricing" icon={<CreditCard className="size-4" />} />
        <PanelBody className="p-5 space-y-3">
          <Row label="Payment method" value={order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—'} />
          <Row label="Payment status" value={order.paymentStatus} />
          {order.emiPlanId && (
            <Row label="EMI plan" value={`${order.emiTenure} months · ${formatINR(order.emiMonthlyPaise ?? 0)}/mo`} />
          )}
          <Divider />
          <Row label="Subtotal" value={formatINR(order.subtotalPaise)} />
          {order.discountPaise > 0 && <Row label="Discount" value={formatINR(order.discountPaise)} tone="good" />}
          {order.couponDiscountPaise > 0 && <Row label="Coupon" value={formatINR(order.couponDiscountPaise)} tone="good" />}
          {order.walletAppliedPaise > 0 && <Row label="Wallet" value={formatINR(order.walletAppliedPaise)} tone="muted" />}
          {order.protectionPaise > 0 && <Row label="Protection plans" value={formatINR(order.protectionPaise)} />}
          {order.shippingPaise > 0 && <Row label="Shipping" value={formatINR(order.shippingPaise)} />}
          <Row label="Tax (GST)" value={formatINR(order.taxPaise)} />
          <Divider />
          <Row label="Total paid" value={formatINR(order.totalPaise)} strong tone="default" />
          {order.amountDuePaise > 0 && (
            <Row label="Amount due" value={formatINR(order.amountDuePaise)} tone="bad" strong />
          )}
        </PanelBody>
      </Panel>

      {/* Courier tracking */}
      {order.shipments.length > 0 && (
        <Panel>
          <PanelHeader title="Shipments" icon={<Truck className="size-4" />} />
          <PanelBody className="p-5 pt-0 space-y-4">
            {order.shipments.map((shipment) => (
              <div key={shipment.id} className="space-y-3 border-t border-line pt-4 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="cyan" size="sm">{shipment.courier}</Badge>
                  <Badge tone="violet" size="sm">AWB: {shipment.awb}</Badge>
                  <Badge tone={ORDER_STATUS_META[shipment.status as OrderStatus]?.tone ?? 'violet'} size="sm">
                    {ORDER_STATUS_META[shipment.status as OrderStatus]?.label ?? shipment.status}
                  </Badge>
                </div>
                {shipment.labelUrl && (
                  <a
                    href={shipment.labelUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-volt-300 hover:text-volt-200"
                  >
                    Track on courier site
                    <ArrowRight className="size-3.5" aria-hidden />
                  </a>
                )}
                <div className="grid gap-2 sm:grid-cols-3 text-sm">
                  <div>
                    <span className="text-ink-3">Shipped</span>
                    <p className="font-medium text-ink">{shipment.shippedAt ? formatDateTime(shipment.shippedAt) : '—'}</p>
                  </div>
                  {shipment.deliveredAt && (
                    <div>
                      <span className="text-ink-3">Delivered</span>
                      <p className="font-medium text-ink">{formatDateTime(shipment.deliveredAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </PanelBody>
        </Panel>
      )}

      {/* Invoice */}
      {order.invoice && (
        <Panel>
          <PanelHeader
            title="GST Invoice"
            icon={<FileText className="size-4" />}
            action={
              <ButtonLink href={`/api/invoice/${order.invoice.id}/download`} variant="secondary" size="sm">
                Download PDF
              </ButtonLink>
            }
          />
          <PanelBody className="p-5 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <Row label="Invoice number" value={order.invoice.invoiceNo} strong />
              <Row label="Date" value={formatDate(order.invoice.issuedAt)} />
              <Row label="GSTIN" value={order.invoice.sellerGstin ?? '—'} />
              <Row label="IRN" value={order.invoice.irn ?? '—'} />
            </div>
          </PanelBody>
        </Panel>
      )}

      {/* Warranty cards */}
      {order.items.some((i) => i.units.some((u) => u.warrantyCard)) && (
        <Panel>
          <PanelHeader title="Warranty cards" icon={<ShieldCheck className="size-4" />} />
          <PanelBody className="p-5 pt-0 space-y-3">
            {order.items.flatMap((item) =>
              item.units
                .filter((u) => u.warrantyCard)
                .map((unit) => (
                  <div key={unit.warrantyCard!.id} className="p-3 rounded-lg bg-panel-2 ring-1 ring-inset ring-line">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{item.brandName} {item.productName}</p>
                        <p className="text-xs text-ink-3">IMEI: {unit.imei1 ?? unit.serialNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-ink">{unit.warrantyCard!.cardNo}</p>
                        <p className="text-xs text-ink-3">
                          Valid: {formatDate(unit.warrantyCard!.validFrom)} – {formatDate(unit.warrantyCard!.validTill)}
                        </p>
                        {unit.warrantyCard!.isExtended && <Badge tone="violet" size="xs">Extended</Badge>}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </PanelBody>
        </Panel>
      )}

      {/* Actions */}
      {(canCancel || canReturn) && (
        <Panel className="ring-1 ring-warn-400/20 ring-inset">
          <PanelHeader title="Actions" icon={<AlertCircle className="size-4" />} />
          <PanelBody className="p-5 space-y-3">
            {canCancel && (
              <Button
                variant="danger"
                size="md"
                onClick={() => setShowCancelModal(true)}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="size-3.5 mr-1.5" aria-hidden />
                Cancel order
              </Button>
            )}
            {canReturn && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowReturnModal(true)}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="size-3.5 mr-1.5" aria-hidden />
                Request return
              </Button>
            )}
          </PanelBody>
        </Panel>
      )}

      {/* Cancel Modal */}
      <Modal open={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel order">
        <div className="space-y-4">
          <p className="text-sm text-ink-2">
            This will cancel your order and initiate a refund. The refund will be processed to your original payment method
            (wallet balance returns instantly; gateway refunds take 5–10 business days).
          </p>
          <div>
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-ink mb-1">
              Reason for cancellation
            </label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please tell us why you want to cancel…"
              rows={3}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-volt-400"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={isCancelling}>
              Keep order
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={isCancelling} disabled={isCancelling || !cancelReason.trim()}>
              Confirm cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal open={showReturnModal} onClose={() => setShowReturnModal(false)} title="Request return">
        <div className="space-y-4">
          <p className="text-sm text-ink-2">
            Returns are accepted within {order.returnDeadline ? 'the return window' : '14 days'} of delivery.
            The item must be unused, in original packaging with all accessories. Refund is issued after the return is received and inspected.
          </p>
          <div>
            <label htmlFor="return-reason" className="block text-sm font-medium text-ink mb-1">
              Reason for return
            </label>
            <textarea
              id="return-reason"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Please tell us why you want to return…"
              rows={3}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-volt-400"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowReturnModal(false)} disabled={isReturning}>
              Keep order
            </Button>
            <Button variant="primary" onClick={handleReturn} loading={isReturning} disabled={isReturning || !returnReason.trim()}>
              Submit return request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}