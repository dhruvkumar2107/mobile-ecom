import 'server-only';

import { db } from '../db';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  SETTINGS
 * ════════════════════════════════════════════════════════════════════════
 *  Every operational knob the admin Settings screen edits lives in one
 *  key/value table, but the rest of the codebase reads it through this typed
 *  facade so a missing or malformed row can never crash checkout — the default
 *  below is always the fallback.
 *
 *  Values are JSON-encoded in the column, which keeps numbers as numbers and
 *  booleans as booleans instead of stringly-typed "true".
 */

export type AppSettings = {
  // Seller identity — printed on every GST invoice
  sellerName: string;
  sellerGstin: string;
  sellerState: string;
  sellerAddress: string;
  supportEmail: string;
  supportPhone: string;

  // Commerce rules
  freeShippingAbovePaise: number;
  standardShippingPaise: number;
  expressShippingPaise: number;
  codFeePaise: number;
  codMaxOrderPaise: number;
  /** Wallet money usable on one order, as a percentage of the order total. */
  walletMaxPercentOnOrder: number;
  returnWindowDays: number;

  // Payouts
  payoutMinPaise: number;
  payoutMaxPerDayPaise: number;
  /** Withdrawals at or below this auto-approve; above it an admin must sign off. */
  payoutAutoApproveBelowPaise: number;
  payoutRequiresVerifiedBank: boolean;

  // Loyalty
  loyaltyEarnRateBps: number;
  loyaltyRedeemRatePaise: number;

  // Storefront
  siteTitle: string;
  siteTagline: string;
  announcementText: string;
  announcementEnabled: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  sellerName: 'VOLTAGE Retail Private Limited',
  sellerGstin: '29AABCV1234K1ZP',
  sellerState: 'Karnataka',
  sellerAddress: 'Tower B, Prestige Tech Park, Outer Ring Road, Bengaluru 560103',
  supportEmail: 'support@voltage.store',
  supportPhone: '1800-123-8654',

  freeShippingAbovePaise: 4_999_00,
  standardShippingPaise: 9_900,
  expressShippingPaise: 19_900,
  codFeePaise: 4_900,
  codMaxOrderPaise: 5_000_000,
  walletMaxPercentOnOrder: 100,
  returnWindowDays: 10,

  payoutMinPaise: 10_000,
  payoutMaxPerDayPaise: 5_000_000,
  payoutAutoApproveBelowPaise: 100_000,
  payoutRequiresVerifiedBank: true,

  loyaltyEarnRateBps: 50,
  loyaltyRedeemRatePaise: 100,

  siteTitle: 'VOLTAGE — Flagship Tech, Charged Up',
  siteTagline: 'The command centre for your next device.',
  announcementText: 'Free express delivery on every order above ₹49,999',
  announcementEnabled: true,
};

const SETTING_GROUPS: Record<keyof AppSettings, string> = {
  sellerName: 'general',
  sellerGstin: 'tax',
  sellerState: 'tax',
  sellerAddress: 'general',
  supportEmail: 'general',
  supportPhone: 'general',
  freeShippingAbovePaise: 'shipping',
  standardShippingPaise: 'shipping',
  expressShippingPaise: 'shipping',
  codFeePaise: 'payment',
  codMaxOrderPaise: 'payment',
  walletMaxPercentOnOrder: 'wallet',
  returnWindowDays: 'general',
  payoutMinPaise: 'wallet',
  payoutMaxPerDayPaise: 'wallet',
  payoutAutoApproveBelowPaise: 'wallet',
  payoutRequiresVerifiedBank: 'wallet',
  loyaltyEarnRateBps: 'general',
  loyaltyRedeemRatePaise: 'general',
  siteTitle: 'seo',
  siteTagline: 'seo',
  announcementText: 'theme',
  announcementEnabled: 'theme',
};

export const SETTING_LABELS: Record<keyof AppSettings, string> = {
  sellerName: 'Registered seller name',
  sellerGstin: 'Seller GSTIN',
  sellerState: 'Seller state (place of supply origin)',
  sellerAddress: 'Registered address',
  supportEmail: 'Support email',
  supportPhone: 'Support phone',
  freeShippingAbovePaise: 'Free shipping above',
  standardShippingPaise: 'Standard shipping charge',
  expressShippingPaise: 'Express shipping charge',
  codFeePaise: 'COD handling fee',
  codMaxOrderPaise: 'Maximum COD order value',
  walletMaxPercentOnOrder: 'Max wallet usage per order (%)',
  returnWindowDays: 'Return window (days)',
  payoutMinPaise: 'Minimum withdrawal',
  payoutMaxPerDayPaise: 'Withdrawal limit per day',
  payoutAutoApproveBelowPaise: 'Auto-approve withdrawals below',
  payoutRequiresVerifiedBank: 'Require verified bank before payout',
  loyaltyEarnRateBps: 'Loyalty earn rate (bps of order value)',
  loyaltyRedeemRatePaise: 'Rupee value of 1 loyalty point (paise)',
  siteTitle: 'Site title',
  siteTagline: 'Site tagline',
  announcementText: 'Announcement bar text',
  announcementEnabled: 'Show announcement bar',
};

/**
 * Reads all settings. Cached for a few seconds rather than per-request: a
 * checkout that reads settings four times shouldn't hit SQLite four times, and
 * an admin edit becoming visible a moment later is fine.
 */
const cache = globalThis as unknown as {
  __voltageSettings?: { value: AppSettings; at: number };
};
const TTL_MS = 5_000;

export async function getSettings(): Promise<AppSettings> {
  const hit = cache.__voltageSettings;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const rows = await db.setting.findMany();
  const merged: AppSettings = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    if (!(row.key in merged)) continue;
    try {
      const parsed = JSON.parse(row.value);
      const key = row.key as keyof AppSettings;
      // Only accept a stored value whose type matches the default, so a bad
      // row can't turn a number setting into a string mid-checkout.
      if (typeof parsed === typeof DEFAULT_SETTINGS[key]) {
        (merged as Record<string, unknown>)[key] = parsed;
      }
    } catch {
      /* malformed row — keep the default */
    }
  }

  cache.__voltageSettings = { value: merged, at: Date.now() };
  return merged;
}

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  return (await getSettings())[key];
}

export async function updateSettings(patch: Partial<AppSettings>, actorId?: string | null) {
  const entries = Object.entries(patch) as [keyof AppSettings, unknown][];

  await db.$transaction(
    entries.map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        create: {
          key,
          value: JSON.stringify(value),
          groupName: SETTING_GROUPS[key] ?? 'general',
          label: SETTING_LABELS[key] ?? key,
        },
        update: { value: JSON.stringify(value) },
      }),
    ),
  );

  cache.__voltageSettings = undefined;

  if (actorId) {
    await db.auditLog.create({
      data: {
        actorId,
        action: 'settings.update',
        entity: 'Setting',
        after: JSON.stringify(patch),
      },
    });
  }

  return getSettings();
}

/** Grouped shape for the admin Settings screen. */
export async function getSettingsForAdmin() {
  const values = await getSettings();
  const groups = new Map<string, { key: string; label: string; value: unknown; type: string }[]>();

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]) {
    const group = SETTING_GROUPS[key] ?? 'general';
    const list = groups.get(group) ?? [];
    list.push({
      key,
      label: SETTING_LABELS[key],
      value: values[key],
      type: typeof DEFAULT_SETTINGS[key],
    });
    groups.set(group, list);
  }

  return [...groups.entries()].map(([group, items]) => ({ group, items }));
}

/** Central audit trail writer — every privileged mutation should call this. */
export async function audit(input: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}) {
  return db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      before: input.before === undefined ? null : JSON.stringify(input.before),
      after: input.after === undefined ? null : JSON.stringify(input.after),
      ip: input.ip ?? null,
    },
  });
}
