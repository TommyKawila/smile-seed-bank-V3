export const SAVED_PROMO_LS_KEY = "ssb_saved_promotion_payloads";

export type SavedPromotionPayload = {
  campaignId: string;
  promo_code: string;
  name: string;
  discount_type: string;
  discount_value: string;
};

export function readSavedPromotionsFromLocal(): SavedPromotionPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_PROMO_LS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as SavedPromotionPayload[]) : [];
  } catch {
    return [];
  }
}

export function mergeGuestSavedPromotion(p: SavedPromotionPayload): void {
  if (typeof window === "undefined") return;
  try {
    const prev = readSavedPromotionsFromLocal();
    if (prev.some((x) => x.campaignId === p.campaignId || x.promo_code === p.promo_code)) return;
    prev.push(p);
    localStorage.setItem(SAVED_PROMO_LS_KEY, JSON.stringify(prev));
  } catch {
    /* ignore */
  }
}
