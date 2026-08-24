import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { trackOrder } from '@/lib/services/orders';
import { TrackClient } from '../TrackClient';

interface TrackDetailPageProps {
  params: Promise<{ orderNo: string }>;
}

export async function generateMetadata({ params }: TrackDetailPageProps): Promise<Metadata> {
  const { orderNo } = await params;
  return {
    title: `Track order ${orderNo}`,
    description: `Track your VOLTAGE order ${orderNo}. Real-time delivery status and courier details.`,
  };
}

export default async function TrackDetailPage({ params }: TrackDetailPageProps) {
  const { orderNo } = await params;
  const order = await trackOrder(orderNo.trim().toUpperCase()).catch(() => null);
  if (!order) notFound();

  return <TrackClient initialOrder={order} initialOrderNo={orderNo} />;
}