/** When `NEXT_PUBLIC_LINE_OA_URL` is unset or invalid — official OA (lin.ee). */
export const LINE_OA_FALLBACK_URL = "https://lin.ee/OcxDMjO";

/** Fallback OA Basic ID if DB `line_id` is empty (oaMessage / add-friend). */
export const DEFAULT_LINE_OA_MESSAGE_ID = "@smileseedbank";

/** True for LINE marketing home URLs (must not be used as OA entry). */
export function isGenericLineMarketingUrl(url: string): boolean {
  const u = url.trim();
  if (!u) return true;
  try {
    const { hostname, pathname } = new URL(u);
    const host = hostname.replace(/^www\./, "");
    if (host !== "line.me") return false;
    const normalized = (pathname || "/").replace(/\/$/, "") || "/";
    if (normalized === "/") return true;
    return /^\/(en|th|ja|id|zh|ko|tw|vi)(\/|$)/i.test(pathname);
  } catch {
    return true;
  }
}

/** Add-friend / profile entry (LINE docs: `https://line.me/R/ti/p/{Percent-encoded LINE ID}`). */
export function lineMeAddFriendUrl(lineId?: string | null): string {
  const id = normalizeShopLineId(lineId);
  return `https://line.me/R/ti/p/${encodeURIComponent(id)}`;
}

export function getLineOaBaseUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LINE_OA_URL?.trim()) || "";
  if (!raw || isGenericLineMarketingUrl(raw)) return LINE_OA_FALLBACK_URL;
  return raw;
}

/**
 * Normalize `payment_settings.line_id`: trim, ensure one `@` prefix for `line.me/R/oaMessage/...`.
 */
export function normalizeShopLineId(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return DEFAULT_LINE_OA_MESSAGE_ID;
  return t.startsWith("@") ? t : `@${t}`;
}

/**
 * Deep link (LINE docs): `https://line.me/R/oaMessage/{Percent-encoded LINE ID}/?{text_message}`
 * Both LINE ID and message are percent-encoded; message prefills the chat input.
 */
export function buildLineOaPrefillUrl(lineId: string | null | undefined, message: string): string {
  const id = normalizeShopLineId(lineId);
  return `https://line.me/R/oaMessage/${encodeURIComponent(id)}/?${encodeURIComponent(message)}`;
}

/**
 * Prefer opening the OA from env / fallback. For `line.me/R/oaMessage/...`, appends prefilled text.
 * `lin.ee` short links and non-oaMessage URLs are returned as-is (no reliable text param).
 */
export function lineOaUrlWithOrderHint(orderNumber: string): string {
  const base = getLineOaBaseUrl().replace(/\/$/, "");
  const n = orderNumber.trim();
  if (!n || n === "—") return base;
  if (/lin\.ee\//i.test(base)) return base;

  const body = `Order #${n}`;
  if (/line\.me\/R\/oaMessage\//i.test(base)) {
    const pathOnly = base.split("?")[0];
    return `${pathOnly.replace(/\/?$/, "")}/?${encodeURIComponent(body)}`;
  }
  return base;
}

export function lineOaPrefillUrlForOrderSuccess(
  orderNumber: string,
  lineId?: string | null
): string {
  const id = orderNumber.replace(/^#/, "").trim();
  const text = `Order #${id}`;
  return buildLineOaPrefillUrl(lineId, text);
}

export function lineOaPrefillUrlForParcelInquiry(
  orderNumber: string,
  trackingNumber: string | null | undefined,
  lineId?: string | null
): string {
  const id = orderNumber.replace(/^#/, "").trim();
  const tn = trackingNumber?.trim();
  const text = tn
    ? `สวัสดีครับ/ค่ะ สอบถามสถานะพัสดุออเดอร์ #${id} (เลขพัสดุ: ${tn})`
    : `สวัสดีครับ/ค่ะ สอบถามสถานะพัสดุออเดอร์ #${id}`;
  return buildLineOaPrefillUrl(lineId, text);
}

export function lineOaPrefillUrlForCancelledOrder(
  orderNumber: string,
  lineId?: string | null
): string {
  const id = orderNumber.replace(/^#/, "").trim();
  const text = `สวัสดีครับ/ค่ะ สอบถามเกี่ยวกับออเดอร์ #${id} ที่ถูกยกเลิก`;
  return buildLineOaPrefillUrl(lineId, text);
}
