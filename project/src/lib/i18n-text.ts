import type { Locale } from '@/lib/i18n';

/**
 * Returns the localized text for a campaign field.
 *
 * Resolution order:
 *   1. `i18n[locale]` — exact match for the active locale
 *   2. `i18n['en']` — English fallback (historical seed language)
 *   3. `fallback` — the plain-text column value (`title` / `description`)
 *
 * This keeps legacy rows (no `*_i18n`) and partially-translated rows
 * visible in every locale without ever showing an empty string.
 */
export function localizedText(
  fallback: string,
  i18n: Record<string, string> | null | undefined,
  locale: Locale,
): string {
  if (i18n) {
    if (typeof i18n[locale] === 'string' && i18n[locale]) return i18n[locale];
    if (typeof i18n.en === 'string' && i18n.en) return i18n.en;
  }
  return fallback;
}