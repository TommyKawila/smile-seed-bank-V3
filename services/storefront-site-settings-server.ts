import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  STOREFRONT_SITE_SETTING_KEYS,
  STOREFRONT_SITE_SETTINGS_CACHE_TAG,
} from "@/lib/storefront-site-setting-keys";
import type { SiteSettings } from "@/services/site-settings-service";

async function fetchStorefrontSiteSettings(): Promise<SiteSettings> {
  const rows = await prisma.site_settings.findMany({
    where: { key: { in: [...STOREFRONT_SITE_SETTING_KEYS] } },
    select: { key: true, value: true },
  });
  const settings: SiteSettings = {};
  for (const row of rows) {
    (settings as Record<string, string | undefined>)[row.key] = row.value ?? "";
  }
  return settings;
}

/**
 * SSR storefront settings (incl. logo) — avoids Leaf→Image CLS after client fetch.
 * Prisma + unstable_cache (no cookies) so Data Cache is valid — cuts layout TTFB.
 */
export async function getStorefrontSiteSettingsServer(): Promise<SiteSettings> {
  try {
    return await unstable_cache(
      fetchStorefrontSiteSettings,
      ["storefront-site-settings-v1"],
      { revalidate: 120, tags: [STOREFRONT_SITE_SETTINGS_CACHE_TAG] }
    )();
  } catch {
    try {
      return await fetchStorefrontSiteSettings();
    } catch {
      return {};
    }
  }
}
