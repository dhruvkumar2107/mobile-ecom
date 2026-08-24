import { customAlphabet } from 'nanoid';

const NUM = '0123456789';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O — unambiguous when read aloud
const ALNUM = `${UPPER}${NUM}`;

const nanoNum = customAlphabet(NUM, 6);
const nanoAlnum = customAlphabet(ALNUM, 8);
const nanoCode = customAlphabet(ALNUM, 6);

function yymm(d = new Date()): string {
  return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** VLT-2408-4F7K21 */
export function orderNo(): string {
  return `VLT-${yymm()}-${nanoAlnum()}`;
}

/** GST invoices need a monotonic, gap-free-looking series per financial year. */
export function invoiceNo(sequence: number, d = new Date()): string {
  const year = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
  const fy = `${String(year).slice(2)}${String(year + 1).slice(2)}`;
  return `VLT/${fy}/${String(sequence).padStart(6, '0')}`;
}

export function withdrawalNo(): string {
  return `WDR-${yymm()}-${nanoAlnum()}`;
}

export function serviceTicketNo(): string {
  return `SRV-${nanoAlnum()}`;
}

export function supportTicketNo(): string {
  return `TKT-${nanoAlnum()}`;
}

export function poNo(): string {
  return `PO-${yymm()}-${nanoNum()}`;
}

export function warrantyCardNo(): string {
  return `WC-${nanoAlnum()}`;
}

export function awbNo(): string {
  return `AWB${nanoNum()}${nanoNum()}`;
}

export function utrNo(): string {
  return `UTR${nanoNum()}${nanoNum()}${nanoNum()}`;
}

/** Referral codes are user-visible and typed by hand — keep them short. */
export function referralCode(name?: string | null): string {
  const prefix = (name ?? '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase();
  return `${prefix || 'VOLT'}${nanoCode()}`;
}

export function sku(brand: string, model: string, ram: number | null, storage: number | null, color: string): string {
  const seg = (s: string, n: number) =>
    s.replace(/[^a-zA-Z0-9]/g, '').slice(0, n).toUpperCase();
  return [
    seg(brand, 3),
    seg(model, 5),
    ram ? `${ram}R` : null,
    storage ? `${storage}G` : null,
    seg(color, 3),
  ]
    .filter(Boolean)
    .join('-');
}

export function sessionId(): string {
  return nanoAlnum() + nanoAlnum();
}

export function gatewayRef(prefix: string): string {
  return `${prefix}_${nanoAlnum()}${nanoAlnum()}`.toLowerCase();
}

/**
 * A 15-digit IMEI with a valid Luhn check digit. Real IMEIs come printed on the
 * handset, but a demo store still has to allocate *something* per unit, and a
 * checksum-valid number means the warranty lookup and service-request
 * validation paths can be exercised properly instead of being stubbed out.
 *
 * `35` is a genuine reporting-body prefix, so these look right without
 * colliding with any real TAC allocation.
 */
export function imei(): string {
  const body = `35${nanoNum()}${nanoNum()}`.slice(0, 14);
  let sum = 0;
  // Luhn, right to left: every second digit doubles, 9+ folds back down.
  for (let i = 0; i < 14; i += 1) {
    let d = Number(body[13 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return `${body}${(10 - (sum % 10)) % 10}`;
}

/** Device serial printed on the box — distinct from the IMEI. */
export function serialNo(): string {
  return `SN${nanoAlnum()}${nanoNum()}`;
}
