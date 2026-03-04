"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Locale = "th" | "en";

interface LanguageContextType {
  locale: Locale;
  toggle: () => void;
  /** Returns th string when locale is "th", en string otherwise */
  t: (th: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "th",
  toggle: () => {},
  t: (th) => th,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("th");

  // Persist preference across sessions
  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "th" || saved === "en") setLocale(saved);
  }, []);

  const toggle = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "th" ? "en" : "th";
      localStorage.setItem("locale", next);
      return next;
    });
  }, []);

  const t = useCallback(
    (th: string, en: string) => (locale === "th" ? th : en),
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
