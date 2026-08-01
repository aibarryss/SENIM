import type { TKey } from '@/lib/i18n';

export interface City {
  /** Canonical DB value (stored in campaigns.region / transactions.city). */
  key: string;
  /** i18n key resolving to the localized city name. */
  labelKey: TKey;
}

/**
 * Canonical city list shared by BrowseRequests, CreateRequest, and
 * ImpactDashboard. The `key` is the value persisted to the DB; the
 * `labelKey` resolves to the localized display name via `t()`.
 */
export const CITIES: City[] = [
  { key: 'Almaty', labelKey: 'region.almaty' },
  { key: 'Astana', labelKey: 'region.astana' },
  { key: 'Shymkent', labelKey: 'region.shymkent' },
  { key: 'Karaganda', labelKey: 'region.karaganda' },
  { key: 'Aktobe', labelKey: 'region.aktobe' },
];

type TFunc = (key: TKey, params?: Record<string, string | number>) => string;

/**
 * Returns the localized city name for a raw DB value (case-insensitive
 * match against `CITIES[].key`). Falls back to the raw value when the
 * city is unknown, so unknown DB entries never break the UI.
 */
export function cityLabel(city: string, t: TFunc): string {
  const found = CITIES.find((c) => c.key.toLowerCase() === city.toLowerCase());
  return found ? t(found.labelKey) : city;
}