'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Truck, RotateCcw, AlertCircle, CheckCircle, Clock, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/enums';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, EmptyState, Divider } from '@/components/ui/panel';
import { Pagination } from '@/components/ui/table';
import { Button, ButtonLink } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { listOrders } from '@/lib/services/orders';

type OrderRow = Awaited<ReturnType<typeof listOrders>>['rows'][number];

type OrdersClientProps = {
  initialOrders: OrderRow[];
  initialPagination: { page: number; pages: number; total: number };
  currentStatus: string;
};

const STATUS_FILTERS: Array<{ value: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'all', label: 'All orders', icon: Package },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { value: 'packed', label: 'Packed', icon: Package },
  { value: 'shipped', label: 'Shipped', icon: Truck },
  { value: 'out_for_delivery', label: 'Out for delivery', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: AlertCircle },
  { value: 'returned', label: 'Returned', icon: RotateCcw },
];

export function OrdersClient({ initialOrders, initialPagination, currentStatus }: OrdersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [pagination, setPagination] = useState(initialPagination);
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = useCallback(async (page: number, statusFilter: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/account/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.rows);
        setPagination({ page: data.page, pages: data.pages, total: data.total });
      }
    } catch {
      // Keep current orders
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      setStatus(newStatus);
      router.push(`/account/orders?status=${newStatus}${newStatus === 'all' ? '' : `&page=1`}`);
      fetchOrders(1, newStatus);
    },
    [router, fetchOrders]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      router.push(`/account/orders?page=${page}${status !== 'all' ? `&status=${status}` : ''}`);
      fetchOrders(page, status);
    },
    [router, fetchOrders, status]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Your orders</h1>
          <p className="mt-1 text-sm text-ink-3">
            {pagination.total} {pagination.total === 1 ? 'order' : 'orders'}{' '}
            {status !== 'all' && `(${STATUS_FILTERS.find((f) => f.value === status)?.label})`}
          </p>
        </div>
      </div>

      {/* Status filter */}
      <Panel flat className="overflow-hidden">
        <PanelBody className="p-4 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-ink-3 shrink-0" aria-hidden />
            <span className="text-sm font-medium text-ink-3 shrink-0">Filter:</span>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => {
                const isActive = status === filter.value;
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleStatusChange(filter.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-volt-400 text-void'
                        : 'bg-panel-2 text-ink ring-1 ring-inset ring-line hover:ring-volt-400/50'
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {filter.label}
                  </button>
                );
              })}
            </div>
            {status !== 'all' && (
              <button
                type="button"
                onClick={() => handleStatusChange('all')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-3 bg-panel-2 ring-1 ring-inset ring-line hover:ring-volt-400/50"
              >
                <X className="size-3.5" aria-hidden />
                Clear
              </button>
            )}
          </div>
        </PanelBody>
      </Panel>

      {/* Orders list */}
      {isLoading && orders.length === 0 ? (
        <Panel>
          <PanelBody className="flex h-64 items-center justify-center">
            <div className="animate-spin text-volt-300" style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid', borderColor: 'var(--color-line) transparent', animation: 'spin 1s linear infinite' }} />
          </PanelBody>
        </Panel>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title={status === 'all' ? 'No orders yet' : 'No orders match this filter'}
          description={status === 'all' ? 'Your wallet, warranty cards and service history all begin with the first device.' : 'Try a different status filter or clear the filter.'}
          action={
            status === 'all' ? (
              <ButtonLink href="/products" size="md">
                Browse the catalogue
              </ButtonLink>
            ) : (
              <Button onClick={() => handleStatusChange('all')} size="md">
                Show all orders
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-3" role="list">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              perPage={10}
              hrefFor={(page) =>
                `/account/orders?page=${page}${status !== 'all' ? `&status=${status}` : ''}`
              }
            />
          )}
        </>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const statusMeta = ORDER_STATUS_META[order.status as OrderStatus];
  const firstItem = order.items[0];
  const extraItems = order.items.length - 1;
  const totalUnits = order.items.reduce((n, i) => n + i.quantity, 0);
  const gstNumber = order.gstNumber || '19AAAAA0000A1Z5'; // fallback GSTIN; replace with real value from DB

  return (
    <Panel>
      <PanelBody className="p-5">
        <Link
          href={`/account/orders/${order.id}`}
          className="flex items-start gap-4 transition-colors hover:bg-panel-2/60 -m-4 p-4 rounded-lg"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-tile bg-panel-2 text-[11px] font-semibold text-ink-3 ring-1 ring-line ring-inset">
            {firstItem ? firstItem.brandName.charAt(0) : 'V'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular text-xs text-ink-3">{order.orderNo}</span>
              <Badge tone={statusMeta?.tone ?? 'violet'} size="sm" dot>
                {statusMeta?.label ?? order.status}
              </Badge>
              {order.invoice && (
                <Badge tone="violet" size="xs">Invoice: {order.invoice.invoiceNo}</Badge>
              )}
            </div>
            <p className="mt-1 truncate text-sm font-medium text-ink">
              {firstItem ? `${firstItem.brandName} ${firstItem.productName}` : 'Order'}
              {extraItems > 0 ? ` + ${extraItems} more` : ''}
            </p>
            <p className="tabular mt-1 text-xs text-ink-4">
              {formatDate(order.placedAt)} · {totalUnits} {totalUnits === 1 ? 'item' : 'items'}
            </p>
            <p className="mt-1 text-xs text-ink-4">
              GSTIN: {gstNumber}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <div className="tabular text-lg font-semibold text-ink">{formatINR(order.totalPaise)}</div>
              <ChevronRight className="size-4 mt-1 text-ink-4" aria-hidden />
            </div>
            <ButtonLink
              href={`/account/orders/${order.id}/invoice`}
              size="icon"
              variant="ghost"
              className="rounded-md p-1.5 text-volt-300 hover:bg-panel-2/60 transition-colors"
              aria-label="Download invoice"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="17" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <line x1="3" y1="11" x2="3.01" y2="11" />
                <line x1="17" y1="11" x2="17.01" y2="11" />
              </svg>
            </ButtonLink>
          </div>
        </Link>
      </PanelBody>
    </Panel>
  );
}