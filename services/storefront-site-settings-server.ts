import "server-only";

import { unstable_cache } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  STOREFRONT_SITE_SETTING_KEYS,
  STOREFRONT_SITE_SETTINGS_CACHE_TAG,
} from "@/lib/storefront-site-setting-keys";
import type { SiteSettings } from "@/services/site-settings-service";

async function fetchStorefrontSiteSettings(): Promise<SiteSettings> {
  const supabase = createServiceRoleClient();
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
}

/**
 * SSR storefront settings (incl. logo) — avoids Leaf→Image CLS after client fetch.
 * Service-role REST + module-level unstable_cache (no cookies / no Prisma in layout).
 */
const getCachedStorefrontSiteSettings = unstable_cache(
  fetchStorefrontSiteSettings,
  ["storefront-site-settings-v2"],
  { revalidate: 120, tags: [STOREFRONT_SITE_SETTINGS_CACHE_TAG] }
);

export async function getStorefrontSiteSettingsServer(): Promise<SiteSettings> {
  try {
    return await getCachedStorefrontSiteSettings();
  } catch {
    try {
      return await fetchStorefrontSiteSettings();
    } catch {
      return {};
    }
  }
}
