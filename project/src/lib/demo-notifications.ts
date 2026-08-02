/**
 * Demo notifications for the SUSN flow.
 *
 * The current SENIM schema has no `notifications` table, so these are stored
 * in localStorage per user and are clearly marked as DEMO. They are seeded
 * for the demo SUSN account so the "My Requests / My Vouchers" screen shows
 * the three notifications described in the demo script.
 *
 * Only the notification *type* is stored. The title/body text is resolved
 * from i18n keys in the component, so notifications are localized.
 */

export type DemoNotificationType = 'funded' | 'voucher_ready' | 'help_received';

export interface DemoNotification {
  id: string;
  type: DemoNotificationType;
  createdAt: string;
  read: boolean;
}

const STORAGE_PREFIX = 'senim_demo_notifications_';

function keyFor(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function readAll(userId: string): DemoNotification[] {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    return JSON.parse(raw) as DemoNotification[];
  } catch {
    return [];
  }
}

function writeAll(userId: string, items: DemoNotification[]): void {
  localStorage.setItem(keyFor(userId), JSON.stringify(items));
}

function makeId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Seed the three demo notifications for a user (idempotent by type). */
export function seedDemoNotifications(userId: string): DemoNotification[] {
  const existing = readAll(userId);
  const existingTypes = new Set(existing.map((n) => n.type));

  const demo: Omit<DemoNotification, 'id' | 'read'>[] = [
    {
      type: 'funded',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'voucher_ready',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'help_received',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const added: DemoNotification[] = [];
  for (const n of demo) {
    if (existingTypes.has(n.type)) continue;
    const item: DemoNotification = { ...n, id: makeId(), read: false };
    existing.push(item);
    added.push(item);
  }
  if (added.length > 0) {
    writeAll(userId, existing);
  }
  return existing;
}

/** List notifications for a user, newest first. */
export function listNotifications(userId: string): DemoNotification[] {
  return readAll(userId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Mark a single notification as read. */
export function markNotificationRead(userId: string, id: string): void {
  const items = readAll(userId);
  const idx = items.findIndex((n) => n.id === id);
  if (idx === -1) return;
  items[idx].read = true;
  writeAll(userId, items);
}

/** Mark all notifications as read. */
export function markAllNotificationsRead(userId: string): void {
  const items = readAll(userId);
  for (const n of items) n.read = true;
  writeAll(userId, items);
}