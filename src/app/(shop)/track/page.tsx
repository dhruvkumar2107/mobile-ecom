import { Metadata } from 'next';
import Link from 'next/link';
import { Search, Truck, AlertCircle, CheckCircle, Clock, Package, MapPin } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { trackOrder } from '@/lib/services/orders';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/enums';
import { TrackClient } from './TrackClient';

export const metadata: Metadata = {
  title: 'Track order',
  description: 'Track your VOLTAGE order by order number. No sign-in required — enter your order number to see real-time delivery status.',
};

interface TrackPageProps {
  searchParams: Promise<{
    orderNo?: string;
  }>;
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;
  const orderNo = params.orderNo?.trim().toUpperCase();

  let order: Awaited<ReturnType<typeof trackOrder>> | null = null;
  if (orderNo) {
    try {
      order = await trackOrder(orderNo);
    } catch {
      order = null;
    }
  }

  return <TrackClient initialOrder={order} initialOrderNo={orderNo ?? ''} />;
}