import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getOrder } from '@/lib/services/orders';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/enums';
import { formatINR } from '@/lib/money';
import { formatDate, formatDateTime, pluralise } from '@/lib/utils';
import { OrderDetailClient } from './OrderDetailClient';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(0, 8)}` };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/orders');

  const { id } = await params;
  const order = await getOrder(id, user.id).catch(() => null);
  if (!order) notFound();

  return <OrderDetailClient initialOrder={order} />;
}