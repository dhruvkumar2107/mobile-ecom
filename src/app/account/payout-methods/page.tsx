import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getBankAccounts } from '@/lib/services/wallet';
import { formatDate } from '@/lib/utils';
import { PayoutMethodsClient } from './PayoutMethodsClient';

export const metadata: Metadata = { title: 'Payout methods' };

export default async function PayoutMethodsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/payout-methods');

  const accounts = await getBankAccounts(user.id);

  return <PayoutMethodsClient initialAccounts={accounts} />;
}