import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Coins,
  Package,
  Star,
  Tag,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { listOrders, tierForSpend } from '@/lib/services/orders';
import { getWalletSummary } from '@/lib/services/wallet';
import { getSettings } from '@/lib/services/settings';
import {
  LOYALTY_TIERS,
  LOYALTY_TIER_META,
  ORDER_STATUS_META,
  type LoyaltyTier,
  type OrderStatus,
} from '@/lib/enums';
import { formatINR, formatNumber } from '@/lib/money';
import { daysUntil, formatDate, initials, pluralise } from '@/lib/utils';
import {
  Divider,
  EmptyState,
  Meter,
  PageHeader,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  StatTile,
} from '@/components/ui/panel';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';

export const metadata: Metadata = { title: 'Account' };

const IN_TRANSIT: OrderStatus[] = ['shipped', 'out_for_delivery'];

function asTier(value: string): LoyaltyTier {
  return (LOYALTY_TIERS as readonly string[]).includes(value)
    ? (value as LoyaltyTier)
    : 'silver';
}

export default async function AccountOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account');

  const [
    profile,
    recent,
    totals,
    inTransit,
    nextInstalment,
    unverifiedDestinations,
    deliveredItems,
    myReviews,
    wallet,
    settings,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: { createdAt: true, lifetimeSpendPaise: true },
    }),
    listOrders(user.id, { take: 3 }),
    db.order.aggregate({
      where: { userId: user.id, status: { notIn: ['cancelled'] } },
      _count: { _all: true },
      _sum: { discountPaise: true, couponDiscountPaise: true },
    }),
    db.order.findMany({
      where: { userId: user.id, status: { in: IN_TRANSIT } },
      orderBy: { placedAt: 'desc' },
      select: {
        id: true,
        orderNo: true,
        status: true,
        courier: true,
        awb: true,
        trackingUrl: true,
        expectedDeliveryAt: true,
        items: { select: { productName: true, brandName: true }, take: 1 },
      },
    }),
    // Nearest unpaid instalment across every EMI order — the one worth nudging.
    db.emiInstalment.findFirst({
      where: {
        status: { in: ['upcoming', 'overdue'] },
        order: { userId: user.id, status: { notIn: ['cancelled'] } },
      },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        seqNo: true,
        dueDate: true,
        amountPaise: true,
        status: true,
        order: { select: { orderNo: true, emiTenure: true } },
      },
    }),
    db.bankAccount.count({
      where: { userId: user.id, verificationStatus: { in: ['unverified', 'failed'] } },
    }),
    db.orderItem.findMany({
      where: { order: { userId: user.id, status: 'delivered' }, isAccessory: false },
      orderBy: { order: { deliveredAt: 'desc' } },
      take: 12,
      select: {
        id: true,
        productName: true,
        brandName: true,
        variant: { select: { productId: true } },
      },
    }),
    db.review.findMany({ where: { userId: user.id }, select: { productId: true } }),
    getWalletSummary(user.id),
    getSettings(),
  ]);

  // ── Loyalty standing ────────────────────────────────────────────────
  const lifetimeSpendPaise = profile?.lifetimeSpendPaise ?? 0;
  const stored = asTier(user.loyaltyTier);
  const earned = tierForSpend(lifetimeSpendPaise);
  // Tiers never demote, so the badge shows whichever of the two is higher.
  const tier = LOYALTY_TIERS.indexOf(earned) > LOYALTY_TIERS.indexOf(stored) ? earned : stored;
  const meta = LOYALTY_TIER_META[tier];
  const nextTier: LoyaltyTier | undefined = LOYALTY_TIERS[LOYALTY_TIERS.indexOf(tier) + 1];
  const nextMeta = nextTier ? LOYALTY_TIER_META[nextTier] : null;
  const spanPaise = nextMeta ? nextMeta.minSpendPaise - meta.minSpendPaise : 0;
  const intoTierPaise = Math.max(0, lifetimeSpendPaise - meta.minSpendPaise);
  const toNextPaise = nextMeta ? Math.max(0, nextMeta.minSpendPaise - lifetimeSpendPaise) : 0;

  // ── Pending actions ─────────────────────────────────────────────────
  const reviewed = new Set(myReviews.map((r) => r.productId));
  const seenProducts = new Set<string>();
  const awaitingReview = deliveredItems
    .filter((item) => {
      const pid = item.variant.productId;
      if (reviewed.has(pid) || seenProducts.has(pid)) return false;
      seenProducts.add(pid);
      return true;
    })
    .slice(0, 3);

  const instalmentDueDays = nextInstalment ? daysUntil(nextInstalment.dueDate) : null;
  const instalmentIsUrgent =
    nextInstalment !== null &&
    (nextInstalment.status === 'overdue' || (instalmentDueDays ?? 99) <= 21);

  const hasActions = awaitingReview.length > 0 || instalmentIsUrgent || unverifiedDestinations > 0;

  const ordersPlaced = totals._count._all;
  const savedPaise = (totals._sum.discountPaise ?? 0) + (totals._sum.couponDiscountPaise ?? 0);
  const pointsWorthPaise = user.loyaltyPoints * settings.loyaltyRedeemRatePaise;
  const firstName = user.name?.trim().split(/\s+/)[0] ?? null;
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/signup?ref=${user.referralCode}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : 'Your account'}
        description={`${meta.label} member since ${formatDate(profile?.createdAt)} — earning ${(
          meta.rewardRateBps / 100
        ).toFixed(1)}% back in points on every delivered order.`}
        action={
          <ButtonLink href="/account/orders" variant="secondary" size="sm">
            <Package className="size-4" aria-hidden />
            All orders
          </ButtonLink>
        }
      />

      {/* Loyalty standing. Violet, like every other reward surface. */}
      <Panel>
        <PanelBody className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: meta.accent }}
                aria-hidden
              />
              <h2 className="text-sm font-semibold text-ink">{meta.label} tier</h2>
              <span className="tabular text-xs text-ink-3">
                {formatINR(lifetimeSpendPaise)} lifetime
              </span>
            </div>
            {nextMeta ? (
              <p className="tabular text-xs text-ink-3">
                <span className="font-medium text-plasma-300">{formatINR(toNextPaise)}</span> more to{' '}
                {nextMeta.label}
              </p>
            ) : (
              <Badge tone="violet" size="sm">
                Top tier reached
              </Badge>
            )}
          </div>

          <Meter
            value={nextMeta ? intoTierPaise : 1}
            max={nextMeta ? spanPaise : 1}
            tone="violet"
            className="mt-3.5"
          />

          <p className="mt-2.5 text-xs text-ink-3">
            {nextMeta
              ? `${nextMeta.label} lifts your reward rate to ${(
                  nextMeta.rewardRateBps / 100
                ).toFixed(1)}% back in points. Only delivered orders count toward the threshold.`
              : 'You hold the highest reward rate VOLTAGE offers. Points keep accruing on every delivered order.'}
          </p>
        </PanelBody>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Wallet"
          value={formatINR(wallet.balancePaise)}
          tone="violet"
          icon={<Wallet className="size-4" aria-hidden />}
          sub={
            wallet.pendingPaise > 0
              ? `${formatINR(wallet.pendingPaise)} clearing`
              : 'Usable at checkout'
          }
        />
        <StatTile
          label="Loyalty points"
          value={formatNumber(user.loyaltyPoints)}
          tone="violet"
          icon={<Coins className="size-4" aria-hidden />}
          sub={`Worth ${formatINR(pointsWorthPaise)}`}
        />
        <StatTile
          label="Orders placed"
          value={formatNumber(ordersPlaced)}
          tone="cyan"
          icon={<Package className="size-4" aria-hidden />}
          sub={profile ? `Since ${formatDate(profile.createdAt)}` : undefined}
        />
        <StatTile
          label="Total saved"
          value={formatINR(savedPaise)}
          tone="emerald"
          icon={<Tag className="size-4" aria-hidden />}
          sub="Offers and coupons"
        />
      </div>

      {inTransit.length > 0 && (
        <Panel className="ring-1 ring-plasma-400/20 ring-inset">
          <PanelHeader
            title={`${inTransit.length} ${pluralise(inTransit.length, 'order')} on the way`}
            description="Courier status updates as each scan lands."
            icon={<Truck className="size-4" aria-hidden />}
          />
          <ul className="divide-y divide-line">
            {inTransit.map((order) => {
              const status = ORDER_STATUS_META[order.status as OrderStatus];
              const item = order.items[0];
              return (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={status?.tone ?? 'violet'} size="sm" dot>
                        {status?.label ?? order.status}
                      </Badge>
                      <span className="tabular text-xs text-ink-3">{order.orderNo}</span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium text-ink">
                      {item ? `${item.brandName} ${item.productName}` : 'Your order'}
                    </p>
                    <p className="tabular mt-0.5 text-xs text-ink-3">
                      {order.expectedDeliveryAt
                        ? `Expected ${formatDate(order.expectedDeliveryAt)}`
                        : 'Delivery date confirmed shortly'}
                      {order.courier ? ` · ${order.courier}` : ''}
                      {order.awb ? ` · AWB ${order.awb}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs font-medium text-ink-3 underline underline-offset-4 transition-colors hover:text-ink"
                      >
                        Courier site
                      </a>
                    )}
                    <ButtonLink href={`/track/${order.orderNo}`} variant="outline" size="sm">
                      Track
                      <ArrowRight className="size-3.5" aria-hidden />
                    </ButtonLink>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {hasActions && (
        <Panel>
          <PanelHeader
            title="Needs your attention"
            description="Three minutes of housekeeping, at most."
            icon={<AlertTriangle className="size-4" aria-hidden />}
          />
          <ul className="divide-y divide-line">
            {instalmentIsUrgent && nextInstalment && (
              <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-warn-400" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      EMI instalment {nextInstalment.seqNo}
                      {nextInstalment.order.emiTenure
                        ? ` of ${nextInstalment.order.emiTenure}`
                        : ''}{' '}
                      · {formatINR(nextInstalment.amountPaise)}
                    </p>
                    <p className="tabular mt-0.5 text-xs text-ink-3">
                      {nextInstalment.status === 'overdue'
                        ? `Overdue since ${formatDate(nextInstalment.dueDate)}`
                        : `Due ${formatDate(nextInstalment.dueDate)}${
                            instalmentDueDays === 0
                              ? ' — today'
                              : `, in ${instalmentDueDays} ${pluralise(
                                  instalmentDueDays ?? 0,
                                  'day',
                                )}`
                          }`}
                      {' · '}
                      {nextInstalment.order.orderNo}
                    </p>
                  </div>
                </div>
                <ButtonLink href="/account/emi" variant="secondary" size="sm">
                  View schedule
                </ButtonLink>
              </li>
            )}

            {awaitingReview.length > 0 && (
              <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Star className="mt-0.5 size-4 shrink-0 text-volt-300" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {awaitingReview.length} {pluralise(awaitingReview.length, 'device')} you have
                      not reviewed
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-3">
                      {awaitingReview.map((i) => `${i.brandName} ${i.productName}`).join(' · ')}
                    </p>
                  </div>
                </div>
                <ButtonLink href="/account/reviews" variant="secondary" size="sm">
                  Write a review
                </ButtonLink>
              </li>
            )}

            {unverifiedDestinations > 0 && (
              <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-warn-400" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {unverifiedDestinations}{' '}
                      {pluralise(unverifiedDestinations, 'payout destination')} not verified
                    </p>
                    <p className="mt-0.5 text-xs text-ink-3">
                      Withdrawals stay locked until a penny-drop check confirms the account name.
                    </p>
                  </div>
                </div>
                <ButtonLink href="/account/payout-methods" variant="secondary" size="sm">
                  Verify
                </ButtonLink>
              </li>
            )}
          </ul>
        </Panel>
      )}

      <Panel>
        <PanelHeader
          title="Recent orders"
          description={ordersPlaced > 0 ? `${formatNumber(ordersPlaced)} placed to date` : undefined}
          icon={<Package className="size-4" aria-hidden />}
          action={
            recent.rows.length > 0 ? (
              <Link
                href="/account/orders"
                className="text-xs font-medium text-volt-300 transition-colors hover:text-volt-200"
              >
                View all
              </Link>
            ) : undefined
          }
        />

        {recent.rows.length === 0 ? (
          <EmptyState
            icon={<Package className="size-5" aria-hidden />}
            title="No orders yet"
            description="Your wallet, warranty cards and service history all begin with the first device. Browse the catalogue — phones, tablets, wearables and audio, every one GST-invoiced."
            action={
              <ButtonLink href="/products" size="md">
                Browse the catalogue
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {recent.rows.map((order) => {
              const status = ORDER_STATUS_META[order.status as OrderStatus];
              const first = order.items[0];
              const extra = order.items.length - 1;
              const units = order.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-panel-2/60"
                  >
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-tile bg-panel-2 text-[11px] font-semibold text-ink-3 ring-1 ring-line ring-inset"
                      aria-hidden
                    >
                      {initials(first?.brandName ?? 'VOLTAGE')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular text-xs text-ink-3">{order.orderNo}</span>
                        <Badge tone={status?.tone ?? 'slate'} size="xs">
                          {status?.label ?? order.status}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-ink">
                        {first ? `${first.brandName} ${first.productName}` : 'Order'}
                        {extra > 0 ? ` + ${extra} more` : ''}
                      </p>
                      <p className="tabular mt-0.5 text-xs text-ink-4">
                        {formatDate(order.placedAt)} · {units} {pluralise(units, 'item')}
                        {order.invoice ? ` · ${order.invoice.invoiceNo}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="tabular text-sm font-semibold text-ink">
                        {formatINR(order.totalPaise)}
                      </span>
                      <ChevronRight className="size-4 text-ink-4" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel className="ring-1 ring-plasma-400/20 ring-inset">
        <PanelHeader
          title="Your referral code"
          description="Commission lands in your wallet once your friend's first order is delivered."
          icon={<Users className="size-4" aria-hidden />}
        />
        <PanelBody className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <code className="tabular rounded-xl bg-plasma-500/10 px-3.5 py-2 text-base font-semibold tracking-[0.2em] text-plasma-300 ring-1 ring-plasma-400/25 ring-inset">
              {user.referralCode}
            </code>
            <CopyButton value={user.referralCode} label="Copy code" />
            <CopyButton value={shareUrl} label="Copy invite link" />
          </div>
          <Divider className="my-4" />
          <p className="text-sm leading-relaxed text-ink-2">
            &ldquo;I buy my phones on VOLTAGE — GST invoice, warranty tracked against the IMEI, and
            same-day dispatch. Use my code{' '}
            <span className="font-semibold text-plasma-300">{user.referralCode}</span> when you sign
            up.&rdquo;
          </p>
          <p className="tabular mt-2 truncate text-xs text-ink-4">{shareUrl}</p>
        </PanelBody>
        <PanelFooter>
          <ButtonLink href="/account/referrals" variant="wallet" size="sm">
            Referral dashboard
            <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
          <span className="text-xs text-ink-3">
            Track invites, commission holds and withdrawals.
          </span>
        </PanelFooter>
      </Panel>
    </div>
  );
}
