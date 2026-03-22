"use client";

import { useState, useEffect, useCallback } from "react";

export type SocialLink = { platform: string; handle: string };

export interface SiteSettings {
  logo_main_url?: string;
  logo_secondary_png_url?: string;
  site_name?: string;
  hero_bg_mode?: "static_image" | "animated_svg";
  hero_svg_code?: string;
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  social_media?: string;
  legal_seed_license_url?: string;
  legal_seed_license_number?: string;
  legal_business_registration_url?: string;
  legal_business_registration_number?: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json() as SiteSettings;
        setSettings(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetch_(); }, [fetch_]);

  const updateSetting = useCallback(async (key: string, value: string) => {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const socialLinks = ((): SocialLink[] => {
    try {
      const s = settings.social_media;
      if (!s) return [];
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })();

  return { settings, isLoading, refetch: fetch_, updateSetting, socialLinks };
}
