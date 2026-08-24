import 'server-only';

import { db } from '../db';
import { AppError } from '../api';
import { invoiceNo } from '../ids';
import { roundToRupee } from '../money';
import { getSettings } from './settings';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  GST INVOICING
 * ════════════════════════════════════════════════════════════════════════
 *  Indian GST on a B2C sale splits by place of supply:
 *
 *    intra-state  →  CGST + SGST, each half the rate
 *    inter-state  →  IGST at the full rate
 *
 *  Prices on the storefront are GST-INCLUSIVE (which is what Indian customers
 *  expect to see), so tax is extracted backwards out of the line total rather
 *  than added on top:
 *
 *    taxable = round(gross × 100 / (100 + rate))
 *    tax     = gross − taxable
 *
 *  Doing it in that order guarantees taxable + tax === gross to the paise, so
 *  the invoice always reconciles against what the customer was actually charged.
 */

export type TaxSplit = {
  grossPaise: number;
  taxablePaise: number;
  taxPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  gstRate: number;
};

export function extractGst(grossPaise: number, gstRate: number, isInterState: boolean): TaxSplit {
  const taxable = Math.round((grossPaise * 100) / (100 + gstRate));
  const tax = grossPaise - taxable;

  // Half of an odd paise amount has to land somewhere; CGST takes the extra
  // paise, which matches the convention accounting software uses.
  const half = Math.floor(tax / 2);
  return {
    grossPaise,
    taxablePaise: taxable,
    taxPaise: tax,
    cgstPaise: isInterState ? 0 : tax - half,
    sgstPaise: isInterState ? 0 : half,
    igstPaise: isInterState ? tax : 0,
    gstRate,
  };
}

/** Normalises the many ways a state name arrives before comparing. */
export function sameState(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.trim().toLowerCase().replace(/[^a-z]/g, '').replace(/^orissa$/, 'odisha');
  return norm(a) === norm(b);
}

export type HsnSummaryRow = {
  hsnCode: string;
  description: string;
  quantity: number;
  taxablePaise: number;
  gstRate: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
};

/**
 * Issues the tax invoice for an order. Idempotent — an order already invoiced
 * returns its existing invoice, because a second invoice number against one
 * sale is a compliance problem, not a convenience.
 */
export async function generateInvoice(orderId: string) {
  const existing = await db.invoice.findUnique({ where: { orderId } });
  if (existing) return existing;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { name: true } } },
  });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.paymentStatus !== 'paid' && order.status === 'pending') {
    throw new AppError('An invoice is issued once the order is confirmed.', 409);
  }

  const settings = await getSettings();
  const address = JSON.parse(order.addressSnapshot) as {
    name: string;
    state: string;
    city: string;
    pincode: string;
    gstin?: string | null;
  };

  const isInterState = !sameState(address.state, settings.sellerState);

  // Per-HSN aggregation. Every rupee the customer paid must appear in exactly
  // one bucket, so shipping, COD fee and protection are folded in explicitly.
  const rows = new Map<string, HsnSummaryRow>();

  const addToRow = (
    hsn: string,
    description: string,
    grossPaise: number,
    gstRate: number,
    quantity: number,
  ) => {
    if (grossPaise <= 0) return;
    const split = extractGst(grossPaise, gstRate, isInterState);
    const key = `${hsn}:${gstRate}`;
    const row = rows.get(key) ?? {
      hsnCode: hsn,
      description,
      quantity: 0,
      taxablePaise: 0,
      gstRate,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalPaise: 0,
    };
    row.quantity += quantity;
    row.taxablePaise += split.taxablePaise;
    row.cgstPaise += split.cgstPaise;
    row.sgstPaise += split.sgstPaise;
    row.igstPaise += split.igstPaise;
    row.totalPaise += grossPaise;
    rows.set(key, row);
  };

  for (const item of order.items) {
    addToRow(item.hsnCode, item.productName, item.lineTotalPaise, item.gstRate, item.quantity);
    if (item.protectionPaise > 0) {
      // Insurance/service contracts sit under SAC 9971 at 18%.
      addToRow('9971', item.protectionName ?? 'Protection plan', item.protectionPaise, 18, 1);
    }
  }

  if (order.shippingPaise > 0) {
    addToRow('996812', 'Delivery charges', order.shippingPaise, 18, 1);
  }
  if (order.codFeePaise > 0) {
    addToRow('996812', 'Cash-on-delivery handling', order.codFeePaise, 18, 1);
  }

  const summary = [...rows.values()];
  const taxable = summary.reduce((s, r) => s + r.taxablePaise, 0);
  const cgst = summary.reduce((s, r) => s + r.cgstPaise, 0);
  const sgst = summary.reduce((s, r) => s + r.sgstPaise, 0);
  const igst = summary.reduce((s, r) => s + r.igstPaise, 0);
  const gross = summary.reduce((s, r) => s + r.totalPaise, 0);

  const [rounded, roundOff] = roundToRupee(gross);

  // Invoice numbers are gapless per financial year, so the sequence is taken
  // from the count of invoices already issued this year.
  const fyStart = fyStartFor(new Date());
  const seq = (await db.invoice.count({ where: { issuedAt: { gte: fyStart } } })) + 1;

  return db.invoice.create({
    data: {
      orderId: order.id,
      invoiceNo: invoiceNo(seq),
      sellerGstin: settings.sellerGstin,
      sellerName: settings.sellerName,
      sellerState: settings.sellerState,
      buyerName: address.name || order.user.name || 'Customer',
      buyerGstin: address.gstin ?? null,
      placeOfSupply: `${address.state} (${address.pincode})`,
      isInterState,
      taxablePaise: taxable,
      cgstPaise: cgst,
      sgstPaise: sgst,
      igstPaise: igst,
      roundOffPaise: roundOff,
      totalPaise: rounded,
      hsnSummary: JSON.stringify(summary),
    },
  });
}

/** Indian financial year starts 1 April. */
function fyStartFor(d: Date): Date {
  const year = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return new Date(year, 3, 1);
}

export async function getInvoice(orderId: string) {
  const invoice = await db.invoice.findUnique({
    where: { orderId },
    include: {
      order: {
        include: { items: true, user: { select: { name: true, email: true, phone: true } } },
      },
    },
  });
  if (!invoice) return null;
  return {
    ...invoice,
    hsnRows: JSON.parse(invoice.hsnSummary) as HsnSummaryRow[],
    address: JSON.parse(invoice.order.addressSnapshot) as Record<string, string>,
  };
}

/**
 * GSTR-style rollup for the admin Reports module: taxable value and tax
 * collected per rate per month, split intra/inter-state.
 */
export async function gstReport(from: Date, to: Date) {
  const invoices = await db.invoice.findMany({
    where: { issuedAt: { gte: from, lte: to } },
    orderBy: { issuedAt: 'asc' },
  });

  const byRate = new Map<
    number,
    { gstRate: number; taxablePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; invoices: number }
  >();

  let taxable = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let total = 0;
  let interStateCount = 0;

  for (const inv of invoices) {
    taxable += inv.taxablePaise;
    cgst += inv.cgstPaise;
    sgst += inv.sgstPaise;
    igst += inv.igstPaise;
    total += inv.totalPaise;
    if (inv.isInterState) interStateCount += 1;

    for (const row of JSON.parse(inv.hsnSummary) as HsnSummaryRow[]) {
      const b = byRate.get(row.gstRate) ?? {
        gstRate: row.gstRate,
        taxablePaise: 0,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: 0,
        invoices: 0,
      };
      b.taxablePaise += row.taxablePaise;
      b.cgstPaise += row.cgstPaise;
      b.sgstPaise += row.sgstPaise;
      b.igstPaise += row.igstPaise;
      b.invoices += 1;
      byRate.set(row.gstRate, b);
    }
  }

  return {
    from,
    to,
    invoiceCount: invoices.length,
    interStateCount,
    intraStateCount: invoices.length - interStateCount,
    taxablePaise: taxable,
    cgstPaise: cgst,
    sgstPaise: sgst,
    igstPaise: igst,
    totalTaxPaise: cgst + sgst + igst,
    totalPaise: total,
    byRate: [...byRate.values()].sort((a, b) => a.gstRate - b.gstRate),
    invoices,
  };
}

/** Resolves the applicable GST rate for an HSN code, falling back to 18%. */
export async function rateForHsn(hsnCode: string): Promise<number> {
  const rule = await db.taxRule.findFirst({
    where: { hsnCode, isActive: true },
    select: { gstRate: true },
  });
  return rule?.gstRate ?? 18;
}
