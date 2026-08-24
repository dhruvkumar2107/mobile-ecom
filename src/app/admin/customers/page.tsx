import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatINR } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { Panel, PanelBody, PanelHeader, PanelFooter, EmptyState, Badge, StatTile } from '@/components/ui/panel';
import { Select } from '@/components/ui/input';
import { ButtonLink } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { Users, Wallet, Coins, ShieldCheck, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Customers' };

const TIER_OPTIONS = [
  { value: '', label: 'All tiers' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'titanium', label: 'Titanium' },
];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ tier?: string; q?: string; page?: string }> }) {
  await requireStaff('customers.read');
  const { tier, q, page = '1' } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = 20;

  const where: any = { role: 'customer' };
  if (tier) where.loyaltyTier = tier;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { referralCode: { contains: q.toUpperCase() } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        loyaltyTier: true,
        loyaltyPoints: true,
        lifetimeSpendPaise: true,
        createdAt: true,
        status: true,
        wallet: { select: { balancePaise: true, pendingPaise: true } },
        _count: { select: { orders: true, referralsMade: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Customers</h1>
          <p className="text-sm text-ink-3">{total} customers · Page {pageNum} of {totalPages}</p>
        </div>
      </div>

      <Panel>
        <PanelBody pad={false} className="space-y-4 p-4">
          <form className="flex flex-wrap items-center gap-3">
            <SearchInput
              name="q"
              placeholder="Search name, email, phone, referral code..."
              defaultValue={q}
              className="w-72"
            />
            <Select name="tier" options={TIER_OPTIONS} defaultValue={tier} className="w-40" />
            <ButtonLink href="/admin/customers" variant="ghost" size="sm">Clear</ButtonLink>
          </form>
        </PanelBody>
      </Panel>

      <Panel>
        {users.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" />}
            title={q || tier ? 'No matching customers' : 'No customers yet'}
            description={q || tier ? 'Try adjusting your filters.' : 'Customers will appear here as they sign up.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left" role="table">
                <thead>
                  <tr className="border-b border-line text-xs font-medium text-ink-3 uppercase tracking-wider">
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Contact</th>
                    <th className="px-5 py-3">Tier & Points</th>
                    <th className="px-5 py-3 hidden md:table-cell">Wallet</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Lifetime spend</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Orders</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Referrals</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((user) => {
                    const tierColors: Record<string, 'slate' | 'amber' | 'cyan' | 'violet'> = {
                      silver: 'slate', gold: 'amber', platinum: 'cyan', titanium: 'violet',
                    };
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-panel-2/60">
                        <td className="px-5 py-4 min-w-0">
                          <Link href={`/admin/customers/${user.id}`} className="font-medium text-ink hover:text-volt-300">
                            {user.name ?? '—'}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge tone={tierColors[user.loyaltyTier] || 'slate'} size="xs" dot>{user.loyaltyTier}</Badge>
                            <span className="text-xs text-ink-3">{user.loyaltyPoints.toLocaleString()} pts</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell text-sm text-ink-2">
                          <div className="flex flex-col gap-1">
                            {user.email && <span className="flex items-center gap-1"><Mail className="size-3" /> {user.email}</span>}
                            {user.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {user.phone}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell tabular text-sm text-ink">
                          {formatINR(user.wallet?.balancePaise ?? 0)}
                          {user.wallet?.pendingPaise && <span className="text-xs text-warn-400 ml-1">+{formatINR(user.wallet.pendingPaise)} pending</span>}
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell tabular text-sm text-ink">{formatINR(user.lifetimeSpendPaise)}</td>
                        <td className="px-5 py-3 hidden lg:table-cell tabular text-sm text-ink-3">{user._count.orders}</td>
                        <td className="px-5 py-3 hidden lg:table-cell tabular text-sm text-ink-3">{user._count.referralsMade}</td>
                        <td className="px-5 py-4 text-xs text-ink-3">{formatDate(user.createdAt)}</td>
                        <td className="px-5 py-4">
                          <Link href={`/admin/customers/${user.id}`} className="text-ink-3 hover:text-ink">
                            <ChevronRight className="size-4" />
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
                    <ButtonLink href={`/admin/customers?${new URLSearchParams({ tier, q, page: String(pageNum - 1) } as Record<string, string>).toString()}`} variant="outline" size="sm">Prev</ButtonLink>
                  )}
                  {pageNum < totalPages && (
                    <ButtonLink href={`/admin/customers?${new URLSearchParams({ tier, q, page: String(pageNum + 1) } as Record<string, string>).toString()}`} variant="primary" size="sm">Next</ButtonLink>
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