import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getWalletSummary, getWalletTransactions } from '@/lib/services/wallet';
import { formatINR } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';
import { WalletClient } from './WalletClient';

type WalletTransaction = Awaited<ReturnType<typeof getWalletTransactions>>['rows'][number];

export const metadata: Metadata = { title: 'Wallet' };

interface WalletPageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
  }>;
}

export default async function WalletPage({ searchParams }: WalletPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/wallet');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const type = params.type ?? 'all';

  const [summary, transactions] = await Promise.all([
    getWalletSummary(user.id),
    getWalletTransactions(user.id, { page, perPage: 20, type: type === 'all' ? undefined : type }),
  ]);

  return (
    <WalletClient
      initialSummary={summary}
      initialTransactions={transactions.rows}
      initialPagination={{ page: transactions.page, pages: transactions.pages, total: transactions.total }}
      currentType={type}
    />
  );
}