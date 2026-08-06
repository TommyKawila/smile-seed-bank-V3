"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  fetchSiteSettings,
  parseSocialLinks,
  updateSiteSetting,
  type SiteSettings,
  type SocialLink,
} from "@/services/site-settings-service";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";

export type { SiteSettings, SocialLink };

/** Soft refresh only — never blank SSR logo on the LCP path. */
const HOME_SETTINGS_IDLE_MS = 3_500;

type SiteSettingsState = {
  settings: SiteSettings;
  isLoading: boolean;
  refetch: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  socialLinks: SocialLink[];
};

const SiteSettingsContext = createContext<SiteSettingsState | null>(null);

export function SiteSettingsProvider({
  children,
  initialSettings = {},
}: {
  children: ReactNode;
  initialSettings?: SiteSettings;
}) {
  const pathname = usePathname();
  const useAdmin = useMemo(
    () => pathname?.startsWith("/admin") ?? false,
    [pathname]
  );
  const isHome = pathname === "/";
  const hasInitial = Object.keys(initialSettings).length > 0;
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(!hasInitial);

  const fetch_ = useCallback(async () => {
    // Do not clear settings before fetch — blanking logo causes Field CLS.
    if (!hasInitial) setIsLoading(true);
    try {
      setSettings(await fetchSiteSettings(useAdmin));
    } finally {
      setIsLoading(false);
    }
  }, [useAdmin, hasInitial]);

  useEffect(() => {
    if (useAdmin) {
      void fetch_();
      return;
    }
    if (hasInitial && isHome) {
      return scheduleIdleWork(() => {
        void fetch_();
      }, HOME_SETTINGS_IDLE_MS);
    }
    if (hasInitial) {
      setIsLoading(false);
      return scheduleIdleWork(() => {
        void fetch_();
      }, HOME_SETTINGS_IDLE_MS);
    }
    void fetch_();
  }, [fetch_, useAdmin, isHome, hasInitial]);

  const updateSetting = useCallback(async (key: string, value: string) => {
    await updateSiteSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const socialLinks = useMemo<SocialLink[]>(() => parseSocialLinks(settings), [settings]);

  const value = useMemo(
    () => ({ settings, isLoading, refetch: fetch_, updateSetting, socialLinks }),
    [settings, isLoading, fetch_, updateSetting, socialLinks]
  );

  return createElement(SiteSettingsContext.Provider, { value }, children);
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error("useSiteSettings must be used inside <SiteSettingsProvider>");
  }
  return ctx;
}
