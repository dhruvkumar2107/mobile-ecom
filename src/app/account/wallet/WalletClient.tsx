'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, CreditCard, RotateCcw, ArrowDown, ArrowUp, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';
import { WALLET_TXN_META } from '@/lib/enums';

type WalletTransactionType = 'referral_commission' | 'cashback' | 'refund' | 'order_payment' | 'withdrawal' | 'adjustment' | 'reversal' | 'signup_bonus';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, EmptyState, Divider, StatTile } from '@/components/ui/panel';
import { Pagination } from '@/components/ui/table';
import { Button, ButtonLink } from '@/components/ui/button';
import { Select, Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';

type WalletSummary = {
  balancePaise: number;
  pendingPaise: number;
  lifetimeEarnedPaise: number;
  lifetimeSpentPaise: number;
};

type WalletTransaction = {
  id: string;
  type: string;
  amountPaise: number;
  balanceAfterPaise: number;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  orderId: string | null;
  createdAt: Date;
};

type WalletClientProps = {
  initialSummary: WalletSummary;
  initialTransactions: WalletTransaction[];
  initialPagination: { page: number; pages: number; total: number };
  currentType: string;
};

const TYPE_FILTERS: Array<{ value: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'all', label: 'All', icon: Wallet },
  { value: 'credit', label: 'Credits', icon: ArrowDown },
  { value: 'debit', label: 'Debits', icon: ArrowUp },
  { value: 'refund', label: 'Refunds', icon: RotateCcw },
  { value: 'payout', label: 'Withdrawals', icon: CreditCard },
];

export function WalletClient({ initialSummary, initialTransactions, initialPagination, currentType }: WalletClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [summary, setSummary] = useState(initialSummary);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [pagination, setPagination] = useState(initialPagination);
  const [type, setType] = useState(currentType);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTransactions = useCallback(async (page: number, typeFilter: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/account/wallet/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.rows);
        setPagination({ page: data.page, pages: data.pages, total: data.total });
      }
    } catch {
      // Keep current
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTypeChange = useCallback(
    (newType: string) => {
      setType(newType);
      router.push(`/account/wallet?type=${newType}${newType === 'all' ? '' : `&page=1`}`);
      fetchTransactions(1, newType);
    },
    [router, fetchTransactions]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      router.push(`/account/wallet?page=${page}${type !== 'all' ? `&type=${type}` : ''}`);
      fetchTransactions(page, type);
    },
    [router, fetchTransactions, type]
  );

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount < 10 || amount > 100000) {
      toast.error('Enter an amount between ₹10 and ₹1,00,000');
      return;
    }
    setIsAdding(true);
    try {
      const res = await api('/api/account/wallet/add', {
        method: 'POST',
        json: { amountPaise: Math.round(amount * 100) },
      });
      if (res.ok) {
        const data = res.data as { orderId: string; paymentUrl: string };
        setShowAddModal(false);
        setAddAmount('');
        // Redirect to payment gateway
        window.location.href = data.paymentUrl;
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error('Failed to initiate add money');
    } finally {
      setIsAdding(false);
    }
  };

  const getTypeMeta = (type: string) => WALLET_TXN_META[type as WalletTransactionType] ?? { label: type, tone: 'slate' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Wallet</h1>
          <p className="mt-1 text-sm text-ink-3">Manage your balance, view transactions and add money.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="md" variant="primary">
          <Wallet className="size-3.5 mr-1.5" aria-hidden />
          Add money
        </Button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Available balance"
          value={formatINR(summary.balancePaise)}
          tone="violet"
          icon={<Wallet className="size-4" />}
          sub="Use at checkout"
        />
        <StatTile
          label="Pending"
          value={formatINR(summary.pendingPaise)}
          tone="violet"
          icon={<RotateCcw className="size-4" />}
          sub="Clearing soon"
        />
        <StatTile
          label="Lifetime earned"
          value={formatINR(summary.lifetimeEarnedPaise)}
          tone="cyan"
          icon={<ArrowDown className="size-4" />}
        />
        <StatTile
          label="Lifetime spent"
          value={formatINR(summary.lifetimeSpentPaise)}
          tone="amber"
          icon={<ArrowUp className="size-4" />}
        />
      </div>

      {/* Type filter */}
      <Panel flat className="overflow-hidden">
        <PanelBody className="p-4 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink-3 shrink-0">Filter:</span>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((filter) => {
                const isActive = type === filter.value;
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleTypeChange(filter.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-volt-400 text-void'
                        : 'bg-panel-2 text-ink ring-1 ring-inset ring-line hover:ring-volt-400/50'
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </PanelBody>
      </Panel>

      {/* Transactions */}
      {isLoading && transactions.length === 0 ? (
        <Panel>
          <PanelBody className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-volt-300" aria-hidden />
          </PanelBody>
        </Panel>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Wallet className="size-5" />}
          title="No transactions"
          description={type === 'all' ? 'Your transaction history will appear here once you start using your wallet.' : 'No transactions match this filter.'}
        />
      ) : (
        <>
          <Panel>
            <PanelBody className="p-5 pt-0 space-y-0">
              {transactions.map((txn) => (
                <TransactionRow key={txn.id} txn={txn} getTypeMeta={getTypeMeta} />
              ))}
            </PanelBody>
          </Panel>

          {pagination.pages > 1 && (
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              perPage={20}
              hrefFor={(page) => `/account/wallet?page=${page}${type !== 'all' ? `&type=${type}` : ''}`}
            />
          )}
        </>
      )}

      {/* Add money modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add money to wallet">
        <div className="space-y-4">
          <p className="text-sm text-ink-2">
            Minimum ₹10, maximum ₹1,00,000. Money added via UPI, card or net banking is available instantly.
          </p>
          <div>
            <label htmlFor="add-amount" className="block text-sm font-medium text-ink mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">₹</span>
              <Input
                id="add-amount"
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="500"
                className="pl-7 h-11 text-xl text-center"
                inputMode="decimal"
                min="10"
                max="100000"
                step="1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddMoney} loading={isAdding} disabled={isAdding || !addAmount}>
              Proceed to pay
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TransactionRow({
  txn,
  getTypeMeta,
}: {
  txn: WalletTransaction;
  getTypeMeta: (type: string) => { label: string; tone: string };
}) {
  const meta = getTypeMeta(txn.type);
  const isCredit = ['credit', 'refund'].includes(txn.type);

  return (
    <div className="border-t border-line py-3 first:border-0 first:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Badge tone={meta.tone as any} size="sm">{meta.label}</Badge>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{txn.description}</p>
            <p className="tabular text-xs text-ink-4">{formatDateTime(txn.createdAt)}</p>
            {txn.orderId && (
              <p className="tabular text-xs text-ink-4">Order: {txn.orderId.slice(0, 8)}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className={cn('tabular text-lg font-semibold', isCredit ? 'text-good-400' : 'text-bad-400')}>
              {isCredit ? '+' : '−'}{formatINR(txn.amountPaise)}
            </div>
            <div className="tabular text-xs text-ink-3">Bal: {formatINR(txn.balanceAfterPaise)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" />
      <div className="relative mx-auto mt-20 max-w-md panel bevel p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="p-1 text-ink-4 hover:text-ink" aria-label="Close">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}