import "server-only";

import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { getSiteSettingsRecordMap } from "@/services/setting-service";

export const WHOLESALE_HERO_IMAGE_KEY = "wholesale_hero_image_url";

export const WHOLESALE_HERO_IMAGE_FALLBACK = "/images/wholesale/hero-lab.webp";

export async function getWholesaleHeroImageUrl(): Promise<string> {
  try {
    const map = await getSiteSettingsRecordMap();
    const custom = map[WHOLESALE_HERO_IMAGE_KEY]?.trim();
    if (custom) return resolvePublicAssetUrl(custom) ?? custom;
  } catch {
    /* fallback */
  }
  return WHOLESALE_HERO_IMAGE_FALLBACK;
}
