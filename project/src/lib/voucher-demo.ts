/**
 * Demo QR voucher storage.
 *
 * This is a purely client-side demo of the SENIM QR voucher flow. Vouchers
 * live in localStorage so the donor and the partner-scan demo can interact in
 * the same browser. The QR code itself contains ONLY the voucher code
 * (`SENIM-XXXX-XXXX`) — the trusted details (amount, campaign title) are never
 * embedded in the QR, matching how a real system would store the identifier
 * server-side and look up the rest on scan.
 *
 * The legacy global store (`senim_demo_vouchers`) is kept for backward
 * compatibility with the existing DonationModal flow. New user-scoped APIs
 * (`senim_demo_vouchers_{userId}`) let the SUSN "My Vouchers" screen and the
 * Partner Dashboard show vouchers per user.
 */

export type VoucherStatus = 'active' | 'redeemed';

export interface Voucher {
  code: string;
  amount: number;
  campaignTitle: string;
  status: VoucherStatus;
  createdAt: string;
  /** Optional owner user id (for user-scoped demo vouchers). */
  ownerId?: string;
  /** Optional partner name that redeemed the voucher. */
  redeemedBy?: string;
  /** Optional redemption timestamp. */
  redeemedAt?: string;
}

const STORAGE_KEY = 'senim_demo_vouchers';

function userKey(userId: string): string {
  return `senim_demo_vouchers_${userId}`;
}

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

function readUser(userId: string): Record<string, Voucher> {
  try {
    const raw = localStorage.getItem(userKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Voucher>;
  } catch {
    return {};
  }
}

function writeUser(userId: string, vouchers: Record<string, Voucher>): void {
  localStorage.setItem(userKey(userId), JSON.stringify(vouchers));
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
 * Create a voucher owned by a specific user (used by the SUSN demo flow).
 * The voucher is stored in BOTH the global store (so the partner scan demo
 * can find it) and the user-scoped store (so "My Vouchers" can list it).
 */
export function createUserVoucher(userId: string, amount: number, campaignTitle: string): Voucher {
  const code = generateVoucherCode();
  const voucher: Voucher = {
    code,
    amount,
    campaignTitle,
    status: 'active',
    createdAt: new Date().toISOString(),
    ownerId: userId,
  };
  const all = readAll();
  all[code] = voucher;
  writeAll(all);
  const userVouchers = readUser(userId);
  userVouchers[code] = voucher;
  writeUser(userId, userVouchers);
  return voucher;
}

/**
 * Look up a voucher by its code. Returns null when the code is unknown.
 */
export function getVoucher(code: string): Voucher | null {
  return readAll()[code] ?? null;
}

/** List all vouchers owned by a user (for "My Vouchers"). */
export function listUserVouchers(userId: string): Voucher[] {
  return Object.values(readUser(userId)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export type RedeemResult =
  | { found: true; voucher: Voucher; alreadyRedeemed: boolean }
  | { found: false };

/**
 * Redeem an active voucher. Always re-reads the latest state from
 * localStorage so the caller receives the freshly updated voucher.
 */
export function redeemVoucher(code: string, partnerName?: string): RedeemResult {
  const all = readAll();
  const existing = all[code];
  if (!existing) return { found: false };
  if (existing.status === 'redeemed') {
    return { found: true, voucher: existing, alreadyRedeemed: true };
  }
  const updated: Voucher = {
    ...existing,
    status: 'redeemed',
    redeemedBy: partnerName,
    redeemedAt: new Date().toISOString(),
  };
  all[code] = updated;
  writeAll(all);
  // Keep the user-scoped copy in sync.
  if (updated.ownerId) {
    const userVouchers = readUser(updated.ownerId);
    if (userVouchers[code]) {
      userVouchers[code] = updated;
      writeUser(updated.ownerId, userVouchers);
    }
  }
  return { found: true, voucher: updated, alreadyRedeemed: false };
}

/** All vouchers across the global store (for the Partner Dashboard). */
export function listAllVouchers(): Voucher[] {
  return Object.values(readAll()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Active (unredeemed) vouchers. */
export function listActiveVouchers(): Voucher[] {
  return listAllVouchers().filter((v) => v.status === 'active');
}

/** Redeemed vouchers. */
export function listRedeemedVouchers(): Voucher[] {
  return listAllVouchers().filter((v) => v.status === 'redeemed');
}

/** Vouchers redeemed today (local date). */
export function listRedeemedToday(): Voucher[] {
  const today = new Date().toDateString();
  return listRedeemedVouchers().filter((v) => {
    if (!v.redeemedAt) return false;
    return new Date(v.redeemedAt).toDateString() === today;
  });
}

/** Total assistance delivered (sum of redeemed voucher amounts). */
export function totalAssistanceDelivered(): number {
  return listRedeemedVouchers().reduce((sum, v) => sum + v.amount, 0);
}