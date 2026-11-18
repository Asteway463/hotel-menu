'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { dictionaries, type Dictionary, type Language } from '@burger/shared';

interface UIContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  t: Dictionary;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const value = useMemo<UIContextValue>(
    () => ({
      language,
      setLanguage,
      theme,
      toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
      t: dictionaries[language],
    }),
    [language, theme]
  );

  const setLanguageAndPersist = useCallback((l: Language) => {
    setLanguage(l);
    try {
      window.localStorage.setItem('bh-language', l);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleThemeAndPersist = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem('bh-theme', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const valueWithActions: UIContextValue = {
    ...value,
    setLanguage: setLanguageAndPersist,
    toggleTheme: toggleThemeAndPersist,
  };

  return <UIContext.Provider value={valueWithActions}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
