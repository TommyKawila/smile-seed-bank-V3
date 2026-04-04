"use client";

import { useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getMessage } from "@/lib/i18n-messages";

/**
 * Key-based translations from locales/th.json and locales/en.json.
 * Signature matches common i18n: t(key, fallbackEn).
 */
export function useTranslations() {
  const { locale } = useLanguage();
  const t = useCallback(
    (key: string, fallbackEn?: string) => {
      const v = getMessage(locale, key);
      if (v !== undefined && v !== "") return v;
      return fallbackEn ?? key;
    },
    [locale]
  );
  return { t, locale };
}
