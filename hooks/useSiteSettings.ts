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

export type { SiteSettings, SocialLink };

type SiteSettingsState = {
  settings: SiteSettings;
  isLoading: boolean;
  refetch: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  socialLinks: SocialLink[];
};

const SiteSettingsContext = createContext<SiteSettingsState | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const useAdmin = useMemo(
    () => pathname?.startsWith("/admin") ?? false,
    [pathname]
  );
  const [settings, setSettings] = useState<SiteSettings>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setIsLoading(true);
    setSettings({});
    try {
      setSettings(await fetchSiteSettings(useAdmin));
    } finally {
      setIsLoading(false);
    }
  }, [useAdmin]);

  useEffect(() => {
    void fetch_();
  }, [fetch_]);

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
