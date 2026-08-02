/**
 * Demo QR voucher storage.
 *
 * This is a purely client-side demo of the SENIM QR voucher flow. Vouchers
 * live in localStorage so the donor and the partner-scan demo can interact in
 * the same browser. The QR code itself contains ONLY the voucher code
 * (`SENIM-XXXX-XXXX`) — the trusted details (amount, campaign title) are never
 * embedded in the QR, matching how a real system would store the identifier
 * server-side and look up the rest on scan.
 */

export type VoucherStatus = 'active' | 'redeemed';

export interface Voucher {
  code: string;
  amount: number;
  campaignTitle: string;
  status: VoucherStatus;
  createdAt: string;
}

const STORAGE_KEY = 'senim_demo_vouchers';

function readAll(): Record<string, Voucher> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Voucher>;
  } catch {
    return {};
  }
}

function writeAll(vouchers: Record<string, Voucher>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
}

function randomSegment(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateVoucherCode(): string {
  return `SENIM-${randomSegment()}-${randomSegment()}`;
}

export function createVoucher(amount: number, campaignTitle: string): Voucher {
  const code = generateVoucherCode();
  const voucher: Voucher = {
    code,
    amount,
    campaignTitle,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all[code] = voucher;
  writeAll(all);
  return voucher;
}

/**
 * Look up a voucher by its code. Returns null when the code is unknown.
 */
export function getVoucher(code: string): Voucher | null {
  return readAll()[code] ?? null;
}

export type RedeemResult =
  | { found: true; voucher: Voucher; alreadyRedeemed: boolean }
  | { found: false };

/**
 * Redeem an active voucher. Always re-reads the latest state from
 * localStorage so the caller receives the freshly updated voucher.
 */
export function redeemVoucher(code: string): RedeemResult {
  const all = readAll();
  const existing = all[code];
  if (!existing) return { found: false };
  if (existing.status === 'redeemed') {
    return { found: true, voucher: existing, alreadyRedeemed: true };
  }
  const updated: Voucher = { ...existing, status: 'redeemed' };
  all[code] = updated;
  writeAll(all);
  return { found: true, voucher: updated, alreadyRedeemed: false };
}