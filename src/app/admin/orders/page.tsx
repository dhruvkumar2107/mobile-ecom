import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatINR } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { ORDER_STATUSES, ORDER_STATUS_META } from '@/lib/enums';
import { Panel, PanelBody, PanelHeader, PanelFooter, Row, Divider, EmptyState, Badge } from '@/components/ui/panel';
import { ButtonLink } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { Select } from '@/components/ui/input';
import { ChevronRight, Package, Filter, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Orders' };

const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_META[s].label }))];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  await requireStaff('orders.read');
  const { status, q, page = '1' } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = 20;

  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNo: { contains: q } },
      { user: { name: { contains: q } } },
      { user: { email: { contains: q } } },
      { user: { phone: { contains: q } } },
      { items: { some: { productName: { contains: q } } } },
    ];
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNo: true,
        status: true,
        paymentStatus: true,
        fulfilmentType: true,
        totalPaise: true,
        amountPaidPaise: true,
        placedAt: true,
        expectedDeliveryAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        addressSnapshot: true,
        items: { select: { productName: true, quantity: true }, take: 1 },
        _count: { select: { items: true } },
      },
    }),
    db.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Orders</h1>
          <p className="text-sm text-ink-3">{total} orders · Page {pageNum} of {totalPages}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <ButtonLink href="/admin/orders?status=pending" variant="outline" size="sm">
            <Package className="size-3.5" aria-hidden />
            Pending
          </ButtonLink>
        </div>
      </div>

      <Panel>
        <PanelBody pad={false} className="space-y-4 p-4">
          <form className="flex flex-wrap items-center gap-3">
            <SearchInput
              name="q"
              placeholder="Search order #, customer, product..."
              defaultValue={q}
              className="w-64"
            />
            <Select name="status" options={STATUS_OPTIONS} defaultValue={status} className="w-48" />
            <ButtonLink href="/admin/orders" variant="ghost" size="sm">
              Clear filters
            </ButtonLink>
          </form>
        </PanelBody>
      </Panel>

      <Panel>
        {orders.length === 0 ? (
          <EmptyState
            icon={<Package className="size-5" />}
            title={q || status ? 'No matching orders' : 'No orders yet'}
            description={q || status ? 'Try adjusting your filters.' : 'Orders will appear here as customers place them.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left" role="table">
                <thead>
                  <tr className="border-b border-line text-xs font-medium text-ink-3 uppercase tracking-wider">
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Items</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 hidden md:table-cell">Payment</th>
                    <th className="px-5 py-3 tabular">Total</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Placed</th>
                    <th className="px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((order) => {
                    const statusMeta = ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META];
                    const firstItem = order.items[0];
                    return (
                      <tr key={order.id} className="transition-colors hover:bg-panel-2/60">
                        <td className="px-5 py-4">
                          <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm font-medium text-ink hover:text-volt-300">
                            {order.orderNo}
                          </Link>
                        </td>
                        <td className="px-5 py-4 min-w-0">
                          <div>
                            <p className="text-sm font-medium text-ink truncate">
                              {order.user?.name ?? 'Guest'}
                            </p>
                            <p className="text-xs text-ink-3 truncate">
                              {order.user?.email ?? order.user?.phone ?? '—'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell text-sm text-ink-2">
                          {firstItem ? `${firstItem.productName}${order._count.items > 1 ? ` +${order._count.items - 1}` : ''}` : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={statusMeta?.tone ?? 'slate'} size="sm" dot>
                            {statusMeta?.label ?? order.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <Badge tone={order.paymentStatus === 'paid' ? 'emerald' : order.paymentStatus === 'pending' ? 'amber' : 'rose'} size="xs">
                            {order.paymentStatus.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 tabular text-sm font-semibold text-ink">
                          {formatINR(order.totalPaise)}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell text-xs text-ink-3">
                          {formatDate(order.placedAt)}
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/admin/orders/${order.id}`} className="text-ink-3 hover:text-ink">
                            <MoreHorizontal className="size-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <PanelFooter className="flex items-center justify-between">
                <p className="text-sm text-ink-3">Showing {(pageNum - 1) * pageSize + 1}–{Math.min(pageNum * pageSize, total)} of {total}</p>
                <div className="flex items-center gap-2">
                  {pageNum > 1 && (
                    <ButtonLink href={`/admin/orders?${new URLSearchParams({ status, q, page: String(pageNum - 1) } as Record<string, string>).toString()}`} variant="outline" size="sm">
                      <ChevronRight className="size-3.5" style={{ transform: 'rotate(180deg)' }} />
                      Prev
                    </ButtonLink>
                  )}
                  {pageNum < totalPages && (
                    <ButtonLink href={`/admin/orders?${new URLSearchParams({ status, q, page: String(pageNum + 1) } as Record<string, string>).toString()}`} variant="primary" size="sm">
                      Next
                      <ChevronRight className="size-3.5" />
                    </ButtonLink>
                  )}
                </div>
              </PanelFooter>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}