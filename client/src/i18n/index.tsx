import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { ar } from './ar';
import type { Dict } from './types';

export type Locale = 'en' | 'ar';

const DICTS: Record<Locale, Dict> = { en, ar };
const STORAGE_KEY = 'gomrok-locale';

interface I18nContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  t: Dict;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ar') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir: locale === 'ar' ? 'rtl' : 'ltr', t: DICTS[locale], setLocale }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** true when a display string contains Arabic script — used to force
 * per-value LTR/RTL isolation the way the mockup's dirOfSafe() did. */
export function dirOfSafe(s: unknown): 'rtl' | 'ltr' {
  return /[؀-ۿ]/.test(String(s ?? '')) ? 'rtl' : 'ltr';
}
