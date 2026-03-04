"use client";

import { useState, useEffect, useCallback } from "react";

export interface SiteSettings {
  logo_main_url?: string;
  site_name?: string;
  hero_bg_mode?: "static_image" | "animated_svg";
  hero_svg_code?: string;
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

  return { settings, isLoading, refetch: fetch_, updateSetting };
}
