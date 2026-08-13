'use client';

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Locale } from '@/types/locale';

const STORAGE_KEY = 'heart-symbol-locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
});

// ---------------------------------------------------------------------------
// useSyncExternalStore helpers — the React 19 idiomatic way to read external
// stores such as localStorage without triggering setState-in-effect warnings.
// ---------------------------------------------------------------------------

function subscribeToLocale(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getLocaleSnapshot(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') return stored;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

function getServerLocale(): Locale {
  return 'en';
}

// ---------------------------------------------------------------------------

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    getServerLocale,
  );

  // Keep <html lang> in sync — this is a DOM side-effect, not setState.
  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
      // Dispatch a storage event so useSyncExternalStore subscribers re-read.
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: next }),
      );
    } catch {
      // localStorage unavailable; locale still updates in-memory via the event.
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext(): LocaleContextValue {
  return useContext(LocaleContext);
}
