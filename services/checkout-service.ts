import type { Locale } from "@/context/LanguageContext";
import {
  readSavedPromotionsFromLocal,
  type SavedPromotionPayload,
} from "@/lib/saved-promotion-local";
import type { CheckoutPendingRestorePayload } from "@/lib/services/order-service";

export type { CheckoutPendingRestorePayload as CheckoutPendingRestoreDto };

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

/** First wins per promo code (case-insensitive). */
function mergeDedupeByPromoCodePreferredOrder(rows: ApiSavedCoupon[]): ApiSavedCoupon[] {
  const seen = new Set<string>();
  const out: ApiSavedCoupon[] = [];
  for (const item of rows) {
    const key = item.promo_code.trim().toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** `GET /api/storefront/coupons/collected` → rows ready for checkout tap list. */
function collectedCouponsReadyForCheckout(list: unknown, now: Date): ApiSavedCoupon[] {
  if (!Array.isArray(list)) return [];
  const t = now.getTime();
  const out: ApiSavedCoupon[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const c = row as {
      used?: boolean;
      is_active?: boolean;
      expiry_date?: string | null;
      id?: unknown;
      code?: unknown;
      discount_type?: unknown;
      discount_value?: unknown;
    };
    if (c.used === true) continue;
    if (c.is_active === false) continue;
    const rawExp = c.expiry_date;
    if (rawExp != null && String(rawExp).trim() !== "") {
      const expMs = new Date(String(rawExp)).getTime();
      if (Number.isFinite(expMs) && t >= expMs) continue;
    }
    const id = typeof c.id === "number" ? c.id : Number(c.id);
    const code = typeof c.code === "string" ? c.code.trim() : "";
    if (!code || !Number.isFinite(id)) continue;
    out.push({
      campaign_id: `claimed_${String(id)}`,
      name: "",
      promo_code: code,
      discount_type: typeof c.discount_type === "string" ? c.discount_type : "PERCENTAGE",
      discount_value:
        typeof c.discount_value === "number"
          ? String(c.discount_value)
          : String(c.discount_value ?? ""),
      end_at: rawExp != null ? String(rawExp) : null,
      is_active: true,
    });
  }
  return out;
}

export async function fetchSavedCouponsForCheckout(isLoggedIn: boolean): Promise<ApiSavedCoupon[]> {
  const now = new Date();
  const local = readSavedPromotionsFromLocal();
  if (!isLoggedIn) {
    return filterSavedCouponsForCheckoutDisplay(mergeSavedCoupons([], local), now);
  }

  const [memberRes, collectedRes] = await Promise.all([
    fetch("/api/storefront/profile/member-saved-campaigns", { cache: "no-store" }),
    fetch("/api/storefront/coupons/collected", { cache: "no-store" }),
  ]);

  let memberItems: ApiSavedCoupon[] = [];
  if (memberRes.ok) {
    const mj = (await memberRes.json()) as { items?: ApiSavedCoupon[] };
    memberItems = Array.isArray(mj.items) ? mj.items : [];
  } else {
    const sp = await fetch("/api/storefront/saved-promotions", { cache: "no-store", credentials: "same-origin" });
    const sj = sp.ok ? ((await sp.json()) as { items?: ApiSavedCoupon[] }) : { items: [] };
    memberItems = Array.isArray(sj.items) ? sj.items : [];
  }

  const { available: campaignAvailable } = partitionMemberSavedCoupons(memberItems, now);
  const memberCodeKeysUpper = new Set(
    memberItems.map((c) => c.promo_code.trim().toUpperCase()),
  );

  let collectedCouponsPayload: unknown;
  if (collectedRes.ok) {
    const cj = (await collectedRes.json()) as { coupons?: unknown };
    collectedCouponsPayload = cj.coupons;
  } else {
    collectedCouponsPayload = [];
  }
  const fromClaimed = collectedCouponsReadyForCheckout(collectedCouponsPayload, now);

  const localOnly = local.filter(
    (l) => !memberCodeKeysUpper.has(l.promo_code.trim().toUpperCase()),
  );
  const localAsApi: ApiSavedCoupon[] = localOnly.map((l) => ({
    campaign_id: l.campaignId,
    name: l.name,
    promo_code: l.promo_code,
    discount_type: l.discount_type,
    discount_value: l.discount_value,
  }));

  const merged = mergeDedupeByPromoCodePreferredOrder([
    ...campaignAvailable,
    ...fromClaimed,
    ...localAsApi,
  ]);
  return filterSavedCouponsForCheckoutDisplay(merged, now);
}

export async function fetchProfileOrdersCount(): Promise<number> {
  const res = await fetch("/api/storefront/profile/orders");
  const data = res.ok ? ((await res.json()) as { orders?: unknown[] }) : { orders: [] };
  return data.orders?.length ?? 0;
}

export async function fetchCheckoutPendingRestore(
  orderNumber: string,
): Promise<
  | { ok: true; data: CheckoutPendingRestorePayload }
  | { ok: false; code: string }
> {
  const trimmed = orderNumber.trim();
  const res = await fetch(
    `/api/storefront/orders/checkout-pending?orderNumber=${encodeURIComponent(trimmed)}`,
    { cache: "no-store", credentials: "same-origin" },
  );
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    code?: string;
    data?: CheckoutPendingRestorePayload;
  };
  if (!res.ok || !body.ok || !body.data) {
    return { ok: false, code: body.code ?? `HTTP_${res.status}` };
  }
  return { ok: true, data: body.data };
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
