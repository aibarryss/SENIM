import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import kk from './i18n/kk.json';
import ru from './i18n/ru.json';
import en from './i18n/en.json';

export type Locale = 'kk' | 'ru' | 'en';

/** kk is the source of truth — ru/en must structurally match it (compile error otherwise). */
export type Dict = typeof kk;

const dicts: Record<Locale, Dict> = { kk, ru, en };

const STORAGE_KEY = 'senim-locale';

/** Union of dot-paths that resolve to string leaves, e.g. 'nav.donate' | 'impact.time.minute.one'. */
type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPaths<T[K]>}`;
}[keyof T & string];

export type TKey = LeafPaths<Dict>;

type PluralForm = 'one' | 'few' | 'many';

/** Russian-style plural rule — works for all three locales (kk: forms identical, en: one != few). */
function plural(n: number): PluralForm {
  const abs = Math.abs(n) % 100;
  if (abs % 10 === 1 && abs !== 11) return 'one';
  if (abs % 10 >= 2 && abs % 10 <= 4 && !(abs >= 12 && abs <= 14)) return 'few';
  return 'many';
}

type TimeBase = 'impact.time.minute' | 'impact.time.hour';

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Dot-path lookup with {param} interpolation; falls back to the key itself. */
  t: (key: TKey, params?: Record<string, string | number>) => string;
  /** Plural-aware time string, e.g. tp('impact.time.minute', 5) -> '5 минут назад'. */
  tp: (base: TimeBase, n: number) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolve(dict: Dict, key: string): unknown {
  return key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], dict);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'kk' || saved === 'ru' || saved === 'en' ? saved : 'kk';
  });

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLocaleState(l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t('index.title');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const t = useCallback(
    (key: TKey, params?: Record<string, string | number>) => {
      const value = resolve(dicts[locale], key);
      if (typeof value !== 'string') return key; // typecheck prevents; runtime safety
      if (!params) return value;
      return value.replace(/\{(\w+)\}/g, (m, k) => String(params[k] ?? m));
    },
    [locale],
  );

  const tp = useCallback((base: TimeBase, n: number) => t(`${base}.${plural(n)}` as TKey, { n }), [t]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tp }}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
