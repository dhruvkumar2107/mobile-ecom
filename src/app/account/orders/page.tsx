import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listOrders } from '@/lib/services/orders';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/enums';
import { formatINR } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { OrdersClient } from './OrdersClient';

type OrderListRow = Awaited<ReturnType<typeof listOrders>>['rows'][number];

export const metadata: Metadata = { title: 'Orders' };

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/orders');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const status = params.status ?? 'all';

  const skip = (page - 1) * 10;
const result = await listOrders(user.id, { take: 10, skip, status: status === 'all' ? undefined : status });

  const pages = Math.max(1, Math.ceil(result.total / 10));
  return (
    <OrdersClient
      initialOrders={result.rows}
      initialPagination={{ page, pages, total: result.total }}
      currentStatus={status}
    />
  );
}