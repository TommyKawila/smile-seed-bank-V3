/** Storefront carousel schedule check (runs in browser with local clock alignment to server payloads). */

export type BannerScheduleSlice = {
  start_date?: string | null;
  end_date?: string | null;
};

export function isBannerVisibleNow(b: BannerScheduleSlice, now: Date = new Date()): boolean {
  const t = now.getTime();
  if (b.start_date) {
    const s = Date.parse(b.start_date);
    if (!Number.isNaN(s) && t < s) return false;
  }
  if (b.end_date) {
    const e = Date.parse(b.end_date);
    if (!Number.isNaN(e) && t > e) return false;
  }
  return true;
}

/** Currently visible banner that ends within `withinMs` (e.g. 48h admin highlight). */
export function isBannerExpiringWithin(
  b: BannerScheduleSlice & { is_active?: boolean },
  withinMs: number,
  now: Date = new Date()
): boolean {
  if (b.is_active === false) return false;
  if (!b.end_date?.trim()) return false;
  if (!isBannerVisibleNow(b, now)) return false;
  const end = Date.parse(b.end_date);
  if (Number.isNaN(end)) return false;
  const left = end - now.getTime();
  return left > 0 && left <= withinMs;
}
