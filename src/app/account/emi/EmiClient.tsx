'use client';

import { useState } from 'react';
import { CalendarClock, AlertCircle, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { formatINR, formatNumber } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Panel, PanelHeader, PanelBody, PanelFooter, Row, Badge, EmptyState, Divider, StatTile } from '@/components/ui/panel';
import { Button, ButtonLink } from '@/components/ui/button';
import { Modal } from '@/components/ui/overlay';
import { getEmiSchedule } from '@/lib/services/orders';

type EmiOrder = Awaited<ReturnType<typeof getEmiSchedule>>[number];

type EmiClientProps = {
  initialSchedule: EmiOrder[];
};

export function EmiClient({ initialSchedule }: EmiClientProps) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState<{ orderId: string; instalmentId: string; amount: number } | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const totalDue = schedule.reduce((sum, o) => sum + o.remainingPaise, 0);
  const totalOverdue = schedule.reduce((sum, o) => sum + (o.nextInstalment && o.nextInstalment.status === 'overdue' ? o.nextInstalment.amountPaise : 0), 0);

  const handlePay = async () => {
    if (!showPayModal || isPaying) return;
    setIsPaying(true);
    try {
      const res = await fetch('/api/account/emi/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instalmentId: showPayModal.instalmentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSchedule(data);
        setShowPayModal(null);
      } else {
        const err = await res.json();
        alert(err.error ?? 'Failed to process payment');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">EMI schedule</h1>
          <p className="mt-1 text-sm text-ink-3">Track your instalments, pay early and avoid late fees.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Total outstanding"
          value={formatINR(totalDue)}
          tone="violet"
          icon={<CreditCard className="size-4" />}
        />
        <StatTile
          label="Overdue"
          value={formatINR(totalOverdue)}
          tone={totalOverdue > 0 ? 'rose' : 'emerald'}
          icon={<AlertCircle className="size-4" />}
          sub={totalOverdue > 0 ? 'Pay immediately' : 'All current'}
        />
        <StatTile
          label="Active EMI plans"
          value={formatNumber(schedule.length)}
          tone="cyan"
          icon={<CalendarClock className="size-4" />}
        />
      </div>

      {schedule.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="size-5" />}
          title="No active EMI plans"
          description="Your EMI purchases will appear here. Choose EMI at checkout to split payments over 3–24 months."
        />
      ) : (
        <div className="space-y-4">
          {schedule.map((order) => (
            <EmiOrderCard
              key={order.orderId}
              order={order}
              onToggle={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
              onPay={(instalment) => { if (instalment) setShowPayModal({ orderId: order.orderId, instalmentId: instalment.id, amount: instalment.amountPaise }); }}
            />
          ))}
        </div>
      )}

      {/* Pay modal */}
      <Modal open={!!showPayModal} onClose={() => setShowPayModal(null)} title="Pay instalment">
        {showPayModal && (
          <div className="space-y-4">
            <p className="text-sm text-ink-2">
              Pay your instalment of <strong className="text-ink">{formatINR(showPayModal.amount)}</strong>.
              This will redirect you to the payment gateway.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowPayModal(null)} disabled={isPaying}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePay} loading={isPaying} disabled={isPaying}>
                Pay now
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function EmiOrderCard({ order, onToggle, onPay }: { order: EmiOrder; onToggle: () => void; onPay: (instalment: EmiOrder['nextInstalment']) => void }) {
  const isExpanded = false; // handled by parent
  const next = order.nextInstalment;
  const isOverdue = next?.status === 'overdue';

  return (
    <Panel className={isOverdue ? 'ring-1 ring-rose-400/30 ring-inset' : ''}>
      <PanelHeader
        title={order.title}
        description={`${order.paidCount} of ${order.tenure} paid · ${formatINR(order.monthlyPaise)}/mo`}
        action={
          <ButtonLink href={`/account/orders/${order.orderId}`} variant="secondary" size="sm">
            View order
          </ButtonLink>
        }
      />
      <PanelBody className="p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Paid" value={formatINR(order.paidPaise)} tone="emerald" icon={<CheckCircle className="size-4" />} />
          <StatTile label="Remaining" value={formatINR(order.remainingPaise)} tone="violet" icon={<CreditCard className="size-4" />} />
          <StatTile label={isOverdue ? 'Overdue' : 'Next due'} value={next ? formatINR(next.amountPaise) : '—'} tone={isOverdue ? 'rose' : 'amber'} icon={isOverdue ? <AlertCircle className="size-4" /> : <CalendarClock className="size-4" />} />
        </div>

        {next && (
          <div className={cn('p-3 rounded-lg', isOverdue ? 'bg-rose-400/10 ring-1 ring-inset ring-rose-400/30' : 'bg-panel-2')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOverdue ? <AlertCircle className="size-4 text-rose-400" /> : <CalendarClock className="size-4 text-amber-400" />}
                <span className="text-sm font-medium text-ink">
                  {isOverdue ? 'Overdue since' : 'Due'} {formatDate(next.dueDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular text-lg font-semibold text-ink">{formatINR(next.amountPaise)}</span>
                {next.status !== 'paid' && (
                  <Button size="sm" onClick={() => onPay(next)} variant={isOverdue ? 'danger' : 'primary'}>
                    Pay now
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <Divider />
        <div className="space-y-2">
          {order.schedule.map((instalment, i) => {
            const isPaid = instalment.status === 'paid';
            const isCurrent = instalment === next && !isPaid;
            const isOverdueInstalment = instalment.status === 'overdue';
            return (
              <div
                key={instalment.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg transition-colors',
                  isCurrent ? 'bg-volt-400/5 ring-1 ring-inset ring-volt-400/20' : 'hover:bg-panel-2'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-medium text-ink-3">#{instalment.seqNo}</span>
                  <Badge
                    tone={
                      isPaid ? 'emerald' : isOverdueInstalment ? 'rose' : isCurrent ? 'cyan' : 'slate'
                    }
                    size="sm"
                  >
                    {isPaid ? 'Paid' : isOverdueInstalment ? 'Overdue' : isCurrent ? 'Due now' : 'Upcoming'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="tabular font-medium text-ink shrink-0">{formatINR(instalment.amountPaise)}</span>
                  <span className="text-ink-3">{formatDate(instalment.dueDate)}</span>
                  {isPaid && instalment.paidAt && (
                    <span className="text-xs text-ink-4">Paid {formatDate(instalment.paidAt)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PanelBody>
    </Panel>
  );
}