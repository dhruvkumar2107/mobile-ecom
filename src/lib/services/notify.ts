import 'server-only';

import { db } from '../db';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  NOTIFICATIONS
 * ════════════════════════════════════════════════════════════════════════
 *  Transactional messages (order confirmed, payout paid, back in stock) go
 *  through one funnel so adding a real provider later means editing one file.
 *
 *  Drivers, chosen by env var:
 *
 *    MAIL_DRIVER=console  prints the message to the server log (default)
 *    SMS_DRIVER=console   same for SMS
 *
 *  Marketing broadcasts are a different thing entirely — those are the
 *  PushNotification campaign model, driven from the admin Marketing module.
 */

type Channel = 'email' | 'sms' | 'push';

export type NotifyInput = {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
  subject: string;
  body: string;
  /** Where the in-app version of this message should link. */
  deepLink?: string | null;
  channels?: Channel[];
};

const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

function print(channel: Channel, to: string, subject: string, body: string) {
  const line = '─'.repeat(58);
  console.log(
    `\n${CYAN}┌${line}┐${RESET}\n` +
      `${CYAN}│${RESET} ${channel.toUpperCase().padEnd(6)} → ${to}\n` +
      `${CYAN}│${RESET} ${subject}\n` +
      `${CYAN}├${line}┤${RESET}\n` +
      body
        .split('\n')
        .map((l) => `${CYAN}│${RESET} ${DIM}${l}${RESET}`)
        .join('\n') +
      `\n${CYAN}└${line}┘${RESET}\n`,
  );
}

/**
 * Best-effort delivery: a failing notification must never fail the business
 * operation that triggered it. An order is placed whether or not the email
 * goes out, so everything here swallows its own errors.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    let { email, phone } = input;

    if (input.userId && (!email || !phone)) {
      const user = await db.user.findUnique({
        where: { id: input.userId },
        select: { email: true, phone: true },
      });
      email = email ?? user?.email ?? null;
      phone = phone ?? user?.phone ?? null;
    }

    const channels = input.channels ?? ['email'];
    const mailDriver = (process.env.MAIL_DRIVER ?? 'console').toLowerCase();
    const smsDriver = (process.env.SMS_DRIVER ?? 'console').toLowerCase();

    if (channels.includes('email') && email && mailDriver === 'console') {
      print('email', email, input.subject, input.body);
    }
    if (channels.includes('sms') && phone && smsDriver === 'console') {
      print('sms', phone, input.subject, input.body);
    }
    if (channels.includes('push')) {
      print('push', input.userId ?? 'anonymous', input.subject, input.body);
    }
  } catch (err) {
    console.error('[notify] delivery failed:', err);
  }
}

// ── Templates ─────────────────────────────────────────────────────────
// Kept as small functions rather than a template engine: they're transactional
// messages with fixed shapes, and inline text is easier to audit than a DSL.

const inr = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export const templates = {
  orderPlaced: (o: { orderNo: string; totalPaise: number; expectedBy?: Date | null }) => ({
    subject: `Order ${o.orderNo} confirmed`,
    body: [
      `Your VOLTAGE order ${o.orderNo} is confirmed.`,
      `Amount: ${inr(o.totalPaise)}`,
      o.expectedBy ? `Expected delivery: ${o.expectedBy.toDateString()}` : '',
      `Track it any time from your account.`,
    ]
      .filter(Boolean)
      .join('\n'),
  }),

  orderShipped: (o: { orderNo: string; courier: string; awb: string }) => ({
    subject: `Order ${o.orderNo} is on the way`,
    body: `${o.courier} has picked up your order.\nTracking number: ${o.awb}`,
  }),

  orderDelivered: (o: { orderNo: string }) => ({
    subject: `Order ${o.orderNo} delivered`,
    body: `Your order has been delivered. Your warranty card and invoice are in your account.`,
  }),

  orderCancelled: (o: { orderNo: string; reason: string; refundPaise: number }) => ({
    subject: `Order ${o.orderNo} cancelled`,
    body: [
      `Order ${o.orderNo} has been cancelled.`,
      `Reason: ${o.reason}`,
      o.refundPaise > 0
        ? `A refund of ${inr(o.refundPaise)} has been initiated and will reach you in 3–5 working days.`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
  }),

  paymentFailed: (o: { orderNo: string; reason: string }) => ({
    subject: `Payment failed for ${o.orderNo}`,
    body: `We couldn't complete your payment.\n${o.reason}\nYour order is held for 30 minutes — retry from your account to keep it.`,
  }),

  refundIssued: (o: { orderNo: string; amountPaise: number; destination: string }) => ({
    subject: `Refund of ${inr(o.amountPaise)} issued`,
    body: `Your refund for order ${o.orderNo} has been issued to ${o.destination}.`,
  }),

  bankVerified: (b: { bankName: string; last4: string }) => ({
    subject: 'Bank account verified',
    body: `Your ${b.bankName} account ending ${b.last4} passed verification. Withdrawals are now enabled.`,
  }),

  bankVerificationFailed: (b: { bankName: string; reason: string }) => ({
    subject: 'Bank verification could not be completed',
    body: `We couldn't verify your ${b.bankName} account.\n${b.reason}\nCheck the account number, IFSC and holder name, then try again.`,
  }),

  withdrawalRequested: (w: { requestNo: string; amountPaise: number }) => ({
    subject: `Withdrawal request ${w.requestNo} received`,
    body: `We've received your request to withdraw ${inr(w.amountPaise)}. It's under review and usually clears within one working day.`,
  }),

  withdrawalPaid: (w: { requestNo: string; amountPaise: number; utr: string | null }) => ({
    subject: `${inr(w.amountPaise)} sent to your bank`,
    body: [
      `Your withdrawal ${w.requestNo} has been paid out.`,
      w.utr ? `Reference (UTR): ${w.utr}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  }),

  withdrawalRejected: (w: { requestNo: string; amountPaise: number; reason: string }) => ({
    subject: `Withdrawal ${w.requestNo} could not be processed`,
    body: `${w.reason}\n${inr(w.amountPaise)} has been returned to your VOLTAGE wallet balance.`,
  }),

  commissionEarned: (c: { amountPaise: number; refereeName: string; unlockAt: Date }) => ({
    subject: `You earned ${inr(c.amountPaise)}`,
    body: `${c.refereeName} completed their first VOLTAGE order. Your commission unlocks on ${c.unlockAt.toDateString()}.`,
  }),

  backInStock: (s: { productName: string; url: string }) => ({
    subject: `${s.productName} is back in stock`,
    body: `The device you were waiting for is available again. Stock is limited.\n${s.url}`,
  }),

  serviceUpdate: (s: { ticketNo: string; status: string; note: string }) => ({
    subject: `Service request ${s.ticketNo} — ${s.status.replace(/_/g, ' ')}`,
    body: s.note,
  }),
};
