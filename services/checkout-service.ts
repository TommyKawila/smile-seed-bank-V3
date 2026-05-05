import type { Locale } from "@/context/LanguageContext";
import {
  readSavedPromotionsFromLocal,
  type SavedPromotionPayload,
} from "@/lib/saved-promotion-local";

export type ApiSavedCoupon = {
  campaign_id: string;
  name: string;
  promo_code: string;
  discount_type: string;
  discount_value: string;
  /** ISO8601 from `promotion_campaigns.end_at` when logged in */
  end_at?: string | null;
  /** From campaign; omitted for guest/local merge entries */
  is_active?: boolean;
};

export type CheckoutOrderPayload = {
  customer: {
    full_name: string;
    phone: string;
    address: string;
    email: string | null;
  };
  order_note: string | null;
  items: Array<{
    variantId: number;
    quantity: number;
    price: number;
    isFreeGift: boolean;
    productName: string;
  }>;
  summary: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
  payment_method: "TRANSFER";
  customer_id: string | null;
  promo_code_id: number | null;
  locale: Locale;
};

export type CheckoutOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; code?: string; message: string };

/** Hide inactive or past-end campaigns in checkout “saved coupons” UI. Local merge rows without dates stay visible. */
export function filterSavedCouponsForCheckoutDisplay(
  coupons: ApiSavedCoupon[],
  now: Date = new Date()
): ApiSavedCoupon[] {
  const t = now.getTime();
  return coupons.filter((c) => {
    if (c.is_active === false) return false;
    const raw = c.end_at;
    if (raw == null || String(raw).trim() === "") return true;
    const endMs = new Date(raw).getTime();
    if (!Number.isFinite(endMs)) return true;
    return t < endMs;
  });
}

function memberCouponKey(c: ApiSavedCoupon): string {
  return `${c.campaign_id}:${c.promo_code.trim().toUpperCase()}`;
}

/**
 * Profile “Available” vs “Expired”: same rules as {@link filterSavedCouponsForCheckoutDisplay} for the available set.
 */
export function partitionMemberSavedCoupons(
  coupons: ApiSavedCoupon[],
  now: Date = new Date()
): { available: ApiSavedCoupon[]; expired: ApiSavedCoupon[] } {
  const available = filterSavedCouponsForCheckoutDisplay(coupons, now);
  const ok = new Set(available.map(memberCouponKey));
  const expired = coupons.filter((c) => !ok.has(memberCouponKey(c)));
  return { available, expired };
}

export function mergeSavedCoupons(
  server: ApiSavedCoupon[],
  local: SavedPromotionPayload[]
): ApiSavedCoupon[] {
  const seen = new Set<string>();
  const out: ApiSavedCoupon[] = [];
  for (const item of [...server, ...local.map((l) => ({
    campaign_id: l.campaignId,
    name: l.name,
    promo_code: l.promo_code,
    discount_type: l.discount_type,
    discount_value: l.discount_value,
  }))]) {
    const key = item.promo_code.trim().toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function fetchSavedCouponsForCheckout(isLoggedIn: boolean): Promise<ApiSavedCoupon[]> {
  const local = readSavedPromotionsFromLocal();
  if (!isLoggedIn) {
    return filterSavedCouponsForCheckoutDisplay(mergeSavedCoupons([], local));
  }

  const res = await fetch("/api/storefront/saved-promotions");
  const data = res.ok ? ((await res.json()) as { items?: ApiSavedCoupon[] }) : { items: [] };
  const merged = mergeSavedCoupons(Array.isArray(data.items) ? data.items : [], local);
  return filterSavedCouponsForCheckoutDisplay(merged);
}

export async function fetchProfileOrdersCount(): Promise<number> {
  const res = await fetch("/api/storefront/profile/orders");
  const data = res.ok ? ((await res.json()) as { orders?: unknown[] }) : { orders: [] };
  return data.orders?.length ?? 0;
}

export async function createStorefrontOrder(payload: CheckoutOrderPayload): Promise<CheckoutOrderResult> {
  const res = await fetch("/api/storefront/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as {
    orderNumber?: string;
    code?: string;
    error?: string;
  };

  if (!res.ok) {
    return { ok: false, code: body.code, message: body.error ?? "Could not create order" };
  }
  return { ok: true, orderNumber: String(body.orderNumber ?? "") };
}
