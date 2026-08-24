import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatINR } from '@/lib/money';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Package, Users, CreditCard, Wallet, ArrowUpRight, ArrowDownRight, BadgeCheck, Truck, ShieldCheck, Zap } from 'lucide-react';
import { Panel, PanelBody, PanelHeader, StatTile, Row, Meter } from '@/components/ui/panel';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { DashboardChart } from '@/components/admin/DashboardChart';

export const metadata: Metadata = { title: 'Dashboard' };

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24'];

function sparklineData(days: number) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(now, days - 1 - i);
    return { date: format(d, 'MMM d'), value: 0 };
  });
}

export default async function DashboardPage() {
  const user = await requireStaff();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayEnd = endOfDay(subDays(now, 1));
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);

  const [
    // Today
    ordersToday,
    revenueToday,
    // Yesterday
    ordersYesterday,
    revenueYesterday,
    // 7d
    orders7d,
    revenue7d,
    // 30d
    orders30d,
    revenue30d,
    // Counts
    totalCustomers,
    totalProducts,
    pendingOrders,
    walletBalance,
    pendingWithdrawals,
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    db.order.count({ where: { placedAt: { gte: todayStart, lte: todayEnd }, status: { not: 'cancelled' } } }),
    db.order.aggregate({ where: { placedAt: { gte: todayStart, lte: todayEnd }, status: { not: 'cancelled' } }, _sum: { totalPaise: true } }),
    db.order.count({ where: { placedAt: { gte: yesterdayStart, lte: yesterdayEnd }, status: { not: 'cancelled' } } }),
    db.order.aggregate({ where: { placedAt: { gte: yesterdayStart, lte: yesterdayEnd }, status: { not: 'cancelled' } }, _sum: { totalPaise: true } }),
    db.order.count({ where: { placedAt: { gte: weekAgo }, status: { not: 'cancelled' } } }),
    db.order.aggregate({ where: { placedAt: { gte: weekAgo }, status: { not: 'cancelled' } }, _sum: { totalPaise: true } }),
    db.order.count({ where: { placedAt: { gte: monthAgo }, status: { not: 'cancelled' } } }),
    db.order.aggregate({ where: { placedAt: { gte: monthAgo }, status: { not: 'cancelled' } }, _sum: { totalPaise: true } }),
    db.user.count({ where: { role: 'customer' } }),
    db.product.count({ where: { status: 'active' } }),
    db.order.count({ where: { status: { in: ['pending', 'confirmed', 'packed'] } } }),
    db.wallet.aggregate({ _sum: { balancePaise: true, pendingPaise: true } }),
    db.withdrawalRequest.count({ where: { status: { in: ['requested', 'approved'] } } }),
    db.order.findMany({
      where: { status: { not: 'cancelled' } },
      orderBy: { placedAt: 'desc' },
      take: 5,
      select: { id: true, orderNo: true, status: true, totalPaise: true, placedAt: true, user: { select: { name: true, email: true } } },
    }),
    db.user.findMany({
      where: { role: 'customer' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true, referralCode: true },
    }),
  ]);

  const revToday = revenueToday._sum.totalPaise ?? 0;
  const revYesterday = revenueYesterday._sum.totalPaise ?? 0;
  const rev7d = revenue7d._sum.totalPaise ?? 0;
  const rev30d = revenue30d._sum.totalPaise ?? 0;

  const orderDelta = ordersYesterday ? Math.round(((ordersToday - ordersYesterday) / ordersYesterday) * 100) : 0;
  const revenueDelta = revYesterday ? Math.round(((revToday - revYesterday) / revYesterday) * 100) : 0;

  const ordersByDay = await db.$queryRawUnsafe<{ day: string; count: number }[]>(
    `SELECT date(placedAt) as day, COUNT(*) as count
    FROM "Order"
    WHERE placedAt >= ${weekAgo} AND status != 'cancelled'
    GROUP BY date(placedAt)
    ORDER BY day ASC`
  );

  const revenueByDay = await db.$queryRawUnsafe<{ day: string; total: number }[]>(
    `SELECT date(placedAt) as day, SUM(totalPaise) as total
    FROM "Order"
    WHERE placedAt >= ${weekAgo} AND status != 'cancelled'
    GROUP BY date(placedAt)
    ORDER BY day ASC`
  );

  const dayMap = new Map(ordersByDay.map((d) => [d.day, d.count]));
  const revMap = new Map(revenueByDay.map((d) => [d.day, d.total]));
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const key = format(d, 'yyyy-MM-dd');
    return {
      date: format(d, 'EEE'),
      orders: dayMap.get(key) ?? 0,
      revenue: Number(revMap.get(key) ?? 0) / 100,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="text-sm text-ink-3">Welcome back. Here's what's happening with your store.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <ButtonLink href="/admin/orders" variant="outline" size="sm">
            View all orders
            <ArrowUpRight className="size-3.5" aria-hidden />
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Orders today"
          value={ordersToday}
          delta={orderDelta}
          icon={<Package className="size-4" />}
          tone="cyan"
        />
        <StatTile
          label="Revenue today"
          value={formatINR(revToday)}
          delta={revenueDelta}
          icon={<CreditCard className="size-4" />}
          tone="emerald"
        />
        <StatTile
          label="New customers (7d)"
          value={recentUsers.length}
          icon={<Users className="size-4" />}
          tone="violet"
        />
        <StatTile
          label="Wallet balance"
          value={formatINR((walletBalance._sum.balancePaise ?? 0) + (walletBalance._sum.pendingPaise ?? 0))}
          sub={walletBalance._sum.pendingPaise ? `${formatINR(walletBalance._sum.pendingPaise)} pending` : undefined}
          icon={<Wallet className="size-4" />}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Orders & Revenue (7 days)"
            action={<span className="text-xs text-ink-3">{orders7d} orders · {formatINR(rev7d)}</span>}
          />
          <PanelBody pad={false} className="h-64">
            <DashboardChart data={chartData} />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Key Metrics" description="30-day rolling window" />
          <PanelBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="panel-flat p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink-3 uppercase tracking-wide">Orders (30d)</p>
                    <p className="tabular mt-1 text-2xl font-semibold text-ink">{orders30d}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-volt-400/10 text-volt-300">
                    <Package className="size-5" />
                  </div>
                </div>
                <Meter value={orders30d} max={Math.max(orders30d, 1)} tone="cyan" className="mt-3" />
              </div>
              <div className="panel-flat p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink-3 uppercase tracking-wide">Revenue (30d)</p>
                    <p className="tabular mt-1 text-2xl font-semibold text-ink">{formatINR(rev30d)}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-plasma-400/10 text-plasma-300">
                    <CreditCard className="size-5" />
                  </div>
                </div>
                <Meter value={rev30d} max={Math.max(rev30d, 1)} tone="violet" className="mt-3" />
              </div>
              <div className="panel-flat p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink-3 uppercase tracking-wide">Active products</p>
                    <p className="tabular mt-1 text-2xl font-semibold text-ink">{totalProducts}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-good-400/10 text-good-400">
                    <BadgeCheck className="size-5" />
                  </div>
                </div>
                <Meter value={totalProducts} max={Math.max(totalProducts, 1)} tone="emerald" className="mt-3" />
              </div>
              <div className="panel-flat p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink-3 uppercase tracking-wide">Registered customers</p>
                    <p className="tabular mt-1 text-2xl font-semibold text-ink">{totalCustomers}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-warn-400/10 text-warn-400">
                    <Users className="size-5" />
                  </div>
                </div>
                <Meter value={totalCustomers} max={Math.max(totalCustomers, 1)} tone="amber" className="mt-3" />
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Pending actions"
            action={<ButtonLink href="/admin/orders?status=pending" variant="outline" size="sm">View all</ButtonLink>}
          />
          <PanelBody pad={false}>
            <ul className="divide-y divide-line">
              {pendingOrders > 0 && (
                <li className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <Package className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{pendingOrders} orders need attention</p>
                      <p className="text-xs text-ink-3">Pending, confirmed or packed</p>
                    </div>
                  </div>
                  <ButtonLink href="/admin/orders?status=pending" variant="secondary" size="sm">Process</ButtonLink>
                </li>
              )}
              {pendingWithdrawals > 0 && (
                <li className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                      <Wallet className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{pendingWithdrawals} withdrawal requests pending</p>
                      <p className="text-xs text-ink-3">Requires admin approval</p>
                    </div>
                  </div>
                  <ButtonLink href="/admin/payouts" variant="secondary" size="sm">Review</ButtonLink>
                </li>
              )}
              {pendingOrders === 0 && pendingWithdrawals === 0 && (
                <li className="px-5 py-8 text-center text-ink-3">All caught up — nothing pending right now.</li>
              )}
            </ul>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent orders"
            action={<ButtonLink href="/admin/orders" variant="outline" size="sm">View all</ButtonLink>}
          />
          <PanelBody pad={false}>
            <ul className="divide-y divide-line">
              {recentOrders.length === 0 ? (
                <li className="px-5 py-8 text-center text-ink-3">No orders yet.</li>
              ) : (
                recentOrders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="tabular text-xs text-ink-3">{order.orderNo}</span>
                        <Badge tone="amber" size="xs">{order.status}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-ink">
                        {order.user?.name ?? order.user?.email ?? 'Guest'}
                      </p>
                    </div>
                    <span className="tabular text-sm font-semibold text-ink shrink-0">{formatINR(order.totalPaise)}</span>
                  </li>
                ))
              )}
            </ul>
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="New customers"
          action={<ButtonLink href="/admin/customers" variant="outline" size="sm">View all</ButtonLink>}
        />
        <PanelBody pad={false}>
          <ul className="divide-y divide-line">
            {recentUsers.length === 0 ? (
              <li className="px-5 py-8 text-center text-ink-3">No customers yet.</li>
            ) : (
              recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{u.name ?? '—'}</p>
                    <p className="truncate text-xs text-ink-3">{u.email ?? u.referralCode}</p>
                  </div>
                  <span className="tabular text-xs text-ink-3 shrink-0">{format(new Date(u.createdAt), 'MMM d, yyyy')}</span>
                </li>
              ))
            )}
          </ul>
        </PanelBody>
      </Panel>
    </div>
  );
}