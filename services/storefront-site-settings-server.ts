import "server-only";

import { createClient } from "@/lib/supabase/server";
import { STOREFRONT_SITE_SETTING_KEYS } from "@/lib/storefront-site-setting-keys";
import type { SiteSettings } from "@/services/site-settings-service";

/** SSR storefront settings (incl. logo) — avoids Leaf→Image CLS after client fetch. */
export async function getStorefrontSiteSettingsServer(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [...STOREFRONT_SITE_SETTING_KEYS]);
    if (error) return {};
    const settings: SiteSettings = {};
    for (const row of data ?? []) {
      if (row.key) {
        (settings as Record<string, string | undefined>)[row.key] = row.value ?? "";
      }
    }
    return settings;
  } catch {
    return {};
  }
}
