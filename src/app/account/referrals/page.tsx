import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getReferralSummary, getReferralChain, getReferralCommissions } from '@/lib/services/referral';
import { formatINR } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { COMMISSION_STATUS_META } from '@/lib/enums';
import { ReferralsClient } from './ReferralsClient';

export const metadata: Metadata = { title: 'Referrals' };

interface ReferralsPageProps {
  searchParams: Promise<{
    page?: string;
    tab?: string;
  }>;
}

export default async function ReferralsPage({ searchParams }: ReferralsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/referrals');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const tab = params.tab ?? 'overview';

  const [summary, chain, commissions] = await Promise.all([
    getReferralSummary(user.id),
    getReferralChain(user.id, { page, perPage: 10 }),
    getReferralCommissions(user.id, { page: 1, perPage: 20 }),
  ]);

  return (
    <ReferralsClient
      initialSummary={summary}
      initialChain={chain.rows}
      initialChainPagination={{ page: chain.page, pages: chain.pages, total: chain.total }}
      initialCommissions={commissions.rows}
      currentTab={tab}
    />
  );
}