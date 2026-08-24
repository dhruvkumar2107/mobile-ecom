import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getEmiSchedule } from '@/lib/services/orders';
import { formatINR } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { EmiClient } from './EmiClient';

export const metadata: Metadata = { title: 'EMI schedule' };

export default async function EmiPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/emi');

  const schedule = await getEmiSchedule(user.id);

  return <EmiClient initialSchedule={schedule} />;
}