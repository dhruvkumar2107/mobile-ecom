'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Coins, Share2, Copy, ExternalLink, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR, formatNumber } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { COMMISSION_STATUS_META } from '@/lib/enums';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, Divider, EmptyState, StatTile } from '@/components/ui/panel';
import { Pagination } from '@/components/ui/table';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';

type ReferralSummary = {
  totalInvites: number;
  convertedInvites: number;
  pendingCommissionPaise: number;
  unlockedCommissionPaise: number;
  paidCommissionPaise: number;
  referralCode: string;
};

type ReferralChainRow = {
  id: string;
  refereeName: string | null;
  refereeEmail: string | null;
  status: string;
  createdAt: Date;
  firstOrderId: string | null;
  firstOrderTotalPaise: number | null;
  commissionPaise: number;
};

type CommissionRow = {
  id: string;
  refereeName: string | null;
  orderId: string;
  orderNo: string;
  amountPaise: number;
  status: string;
  createdAt: Date;
};

type ReferralsClientProps = {
  initialSummary: ReferralSummary;
  initialChain: ReferralChainRow[];
  initialChainPagination: { page: number; pages: number; total: number };
  initialCommissions: CommissionRow[];
  currentTab: string;
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: Users },
  { id: 'invites', label: 'Invites', icon: Users },
  { id: 'commissions', label: 'Commissions', icon: Coins },
] as const;

export function ReferralsClient({ initialSummary, initialChain, initialChainPagination, initialCommissions, currentTab }: ReferralsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [summary, setSummary] = useState(initialSummary);
  const [chain, setChain] = useState(initialChain);
  const [chainPagination, setChainPagination] = useState(initialChainPagination);
  const [commissions, setCommissions] = useState(initialCommissions);
  const [tab, setTab] = useState(currentTab);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleTabChange = useCallback((newTab: string) => {
    setTab(newTab);
    router.push(`/account/referrals?tab=${newTab}`);
  }, [router]);

  const handlePageChange = useCallback((page: number) => {
    router.push(`/account/referrals?page=${page}&tab=${tab}`);
  }, [router, tab]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(summary.referralCode);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
      toast.success('Referral code copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/signup?ref=${summary.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
      toast.success('Invite link copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const share = async () => {
    const link = `${window.location.origin}/signup?ref=${summary.referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on VOLTAGE',
          text: 'I buy my phones on VOLTAGE — GST invoice, warranty tracked, same-day dispatch.',
          url: link,
        });
      } catch {
        // User cancelled
      }
    } else {
      await copyLink();
    }
  };

  const getStatusMeta = (status: string) => COMMISSION_STATUS_META[status as keyof typeof COMMISSION_STATUS_META] ?? { label: status, tone: 'slate' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Referral program</h1>
          <p className="mt-1 text-sm text-ink-3">
            Earn commission when your friends place their first order. Commission unlocks after their return window closes.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
<StatTile
          label="Total invites"
          value={formatNumber(summary.totalInvites)}
          tone="violet"
          icon={<Users className="size-4" />}
          sub={`${summary.convertedInvites} converted`}
        />
        <StatTile
          label="Pending"
          value={formatINR(summary.pendingCommissionPaise)}
          tone="amber"
          icon={<Coins className="size-4" />}
          sub="In hold period"
        />
        <StatTile
          label="Ready to withdraw"
          value={formatINR(summary.unlockedCommissionPaise)}
          tone="emerald"
          icon={<Coins className="size-4" />}
          sub="Available now"
        />
        <StatTile
          label="Paid out"
          value={formatINR(summary.paidCommissionPaise)}
          tone="cyan"
          icon={<Coins className="size-4" />}
        />
      </div>

      {/* Referral code card */}
      <Panel className="ring-1 ring-plasma-400/20 ring-inset">
        <PanelHeader title="Your referral code" icon={<Users className="size-4" />} />
        <PanelBody className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <code className="tabular rounded-xl bg-plasma-500/10 px-4 py-3 text-xl font-semibold tracking-[0.2em] text-plasma-300 ring-1 ring-plasma-400/25 ring-inset flex-1 text-center">
              {summary.referralCode}
            </code>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={copyCode} className="flex items-center gap-1.5">
                <Copy className="size-3.5" aria-hidden />
                {showCopySuccess ? 'Copied!' : 'Copy code'}
              </Button>
              <Button variant="secondary" size="sm" onClick={copyLink} className="flex items-center gap-1.5">
                <ExternalLink className="size-3.5" aria-hidden />
                Copy link
              </Button>
              <Button variant="outline" size="sm" onClick={share} className="flex items-center gap-1.5">
                <Share2 className="size-3.5" aria-hidden />
                Share
              </Button>
            </div>
          </div>
          <p className="text-sm text-ink-3">
            Share this link: <code className="break-all text-volt-300">{window.location.origin}/signup?ref={summary.referralCode}</code>
          </p>
        </PanelBody>
      </Panel>

      {/* Tabs */}
      <Panel flat className="overflow-hidden">
        <PanelBody className="p-4 pt-0">
          <div className="flex flex-wrap gap-2" role="tablist">
            {TABS.map((t) => {
              const isActive = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-volt-400 text-void'
                      : 'bg-panel-2 text-ink ring-1 ring-inset ring-line hover:ring-volt-400/50'
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {t.label}
                </button>
              );
            })}
          </div>
        </PanelBody>
      </Panel>

      {/* Tab content */}
      {tab === 'overview' && (
        <Panel>
          <PanelHeader title="How it works" icon={<Users className="size-4" />} />
          <PanelBody className="p-5 space-y-3">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-panel-2 ring-1 ring-inset ring-line">
                <div className="flex size-10 items-center justify-center rounded-lg bg-volt-400/10 text-volt-300 mb-3">
                  <Share2 className="size-5" aria-hidden />
                </div>
                <h4 className="font-medium text-ink">Share your code</h4>
                <p className="mt-1 text-sm text-ink-3">Send your referral link to friends. They get a welcome discount on signup.</p>
              </div>
              <div className="p-4 rounded-lg bg-panel-2 ring-1 ring-inset ring-line">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400 mb-3">
                  <Coins className="size-5" aria-hidden />
                </div>
                <h4 className="font-medium text-ink">They buy, you earn</h4>
                <p className="mt-1 text-sm text-ink-3">When their first order is delivered, you earn commission based on their order value.</p>
              </div>
              <div className="p-4 rounded-lg bg-panel-2 ring-1 ring-inset ring-line">
                <div className="flex size-10 items-center justify-center rounded-lg bg-plasma-400/10 text-plasma-300 mb-3">
                  <ExternalLink className="size-5" aria-hidden />
                </div>
                <h4 className="font-medium text-ink">Withdraw anytime</h4>
                <p className="mt-1 text-sm text-ink-3">Commission unlocks after the 14-day return window. Withdraw to your bank account instantly.</p>
              </div>
            </div>
          </PanelBody>
        </Panel>
      )}

      {tab === 'invites' && (
        <>
          {isLoading && chain.length === 0 ? (
            <Panel>
              <PanelBody className="flex h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-volt-300" aria-hidden />
              </PanelBody>
            </Panel>
          ) : chain.length === 0 ? (
            <EmptyState
              icon={<Users className="size-5" />}
              title="No invites yet"
              description="Share your referral code to start earning. Your friends get a discount, you get commission."
            />
          ) : (
            <>
              <Panel>
                <PanelBody className="p-5 pt-0 space-y-0">
                  {chain.map((invite) => (
                    <div key={invite.id} className="border-t border-line py-3 first:border-0 first:pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink">{invite.refereeName ?? 'Anonymous'}</p>
                          <p className="text-xs text-ink-3 truncate">{invite.refereeEmail}</p>
                        </div>
                        <Badge tone={getStatusMeta(invite.status).tone} size="sm" dot>
                          {getStatusMeta(invite.status).label}
                        </Badge>
                        {invite.firstOrderId && (
                          <div className="flex items-center gap-2 text-sm text-ink-3">
                            <span>Order: {invite.firstOrderId.slice(0, 8)}</span>
                            <span className="tabular">{formatINR(invite.firstOrderTotalPaise ?? 0)}</span>
                          </div>
                        )}
                        <div className="tabular text-sm font-medium text-ink shrink-0">
                          {formatINR(invite.commissionPaise)}
                        </div>
                        <p className="tabular text-xs text-ink-4">{formatDate(invite.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </PanelBody>
              </Panel>

              {chainPagination.pages > 1 && (
                <Pagination
                  page={chainPagination.page}
                  pages={chainPagination.pages}
                  total={chainPagination.total}
                  perPage={10}
                  hrefFor={(page) => `/account/referrals?page=${page}&tab=invites`}
                />
              )}
            </>
          )}
        </>
      )}

      {tab === 'commissions' && (
        <>
          {isLoading && commissions.length === 0 ? (
            <Panel>
              <PanelBody className="flex h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-volt-300" aria-hidden />
              </PanelBody>
            </Panel>
          ) : commissions.length === 0 ? (
            <EmptyState
              icon={<Coins className="size-5" />}
              title="No commissions yet"
              description="Commissions appear here once your invited friends complete their first order."
            />
          ) : (
            <Panel>
              <PanelBody className="p-5 pt-0 space-y-0">
                {commissions.map((c) => (
                  <div key={c.id} className="border-t border-line py-3 first:border-0 first:pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {c.refereeName ?? 'Anonymous'} · {c.orderNo}
                        </p>
                        <p className="text-xs text-ink-3">{formatDate(c.createdAt)}</p>
                      </div>
                      <Badge tone={getStatusMeta(c.status).tone} size="sm" dot>
                        {getStatusMeta(c.status).label}
                      </Badge>
                      <div className="tabular text-lg font-semibold text-ink shrink-0">
                        {formatINR(c.amountPaise)}
                      </div>
                    </div>
                  </div>
                ))}
              </PanelBody>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}