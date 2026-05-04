"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DynamicHero } from "./DynamicHero";
import type { DynamicBanner } from "@/services/banner-service";
import type { AppLocale } from "@/lib/utils";
import { isBannerVisibleNow } from "@/lib/banner-schedule";

/** Countdown overlay when a slide `end_date` falls within this window (FOMO). */
const PROMO_END_FOMO_MS = 24 * 60 * 60 * 1000;
const SCHEDULE_REFRESH_BUFFER_MS = 1000;

function earliestFutureEndMs(slides: DynamicBanner[]): number | null {
  const now = Date.now();
  let min: number | null = null;
  for (const b of slides) {
    const raw = b.end_date?.trim();
    if (!raw) continue;
    const e = Date.parse(raw);
    if (Number.isNaN(e) || e <= now) continue;
    min = min === null ? e : Math.min(min, e);
  }
  return min;
}

/**
 * Home carousel from `dynamic_banners` — separate draggable block from static `Hero`.
 * Filters by schedule using client clock (`getActiveBanners` already filters on server).
 */
export function PromotionBannerSection({
  banners,
  locale,
}: {
  banners: DynamicBanner[];
  locale: AppLocale;
}) {
  const router = useRouter();
  const scheduled = useMemo(
    () => banners.filter((b) => isBannerVisibleNow(b)),
    [banners]
  );

  const nextExpiryWallMs = useMemo(
    () => earliestFutureEndMs(scheduled),
    [scheduled]
  );

  useEffect(() => {
    if (nextExpiryWallMs === null) return;

    const delay =
      Math.max(0, nextExpiryWallMs - Date.now()) + SCHEDULE_REFRESH_BUFFER_MS;
    const id = window.setTimeout(() => {
      router.refresh();
    }, delay);
    return () => window.clearTimeout(id);
  }, [nextExpiryWallMs, router]);

  if (scheduled.length === 0) return null;
  return (
    <DynamicHero
      banners={scheduled}
      locale={locale}
      urgencyEndWithinMs={PROMO_END_FOMO_MS}
    />
  );
}
