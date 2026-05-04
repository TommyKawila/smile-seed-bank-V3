"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Locale = "th" | "en";

interface LanguageContextType {
  locale: Locale;
  toggle: () => void;
  /** Set site language (persisted to localStorage). */
  setLocale: (locale: Locale) => void;
  /** Returns th string when locale is "th", en string otherwise */
  t: (th: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "th",
  toggle: () => {},
  setLocale: () => {},
  t: (th) => th,
});

function persistLocaleCookie(next: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`;
}

type LanguageProviderProps = {
  children: React.ReactNode;
  /** Cookie / server-known locale — must match SSR for storefront client trees. */
  initialLocale?: Locale;
};

export function LanguageProvider({
  children,
  initialLocale = "th",
}: LanguageProviderProps) {
  const seed: Locale = initialLocale === "en" ? "en" : "th";
  const [locale, setLocaleState] = useState<Locale>(seed);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("locale") as Locale | null;
      if (saved === "th" || saved === "en") {
        setLocaleState(saved);
        persistLocaleCookie(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    persistLocaleCookie(seed);
  }, [seed]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("locale", next);
    persistLocaleCookie(next);
  }, []);

  const toggle = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "th" ? "en" : "th";
      localStorage.setItem("locale", next);
      persistLocaleCookie(next);
      return next;
    });
  }, []);

  const t = useCallback(
    (th: string, en: string) => (locale === "th" ? th : en),
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, toggle, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
