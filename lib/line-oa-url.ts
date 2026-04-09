/** When `NEXT_PUBLIC_LINE_OA_URL` is unset — official OA (lin.ee). */
export const LINE_OA_FALLBACK_URL = "https://lin.ee/OcxDMjO";

export function getLineOaBaseUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LINE_OA_URL?.trim()) || "";
  return raw || LINE_OA_FALLBACK_URL;
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

  const body = `แจ้งเลขออเดอร์ #${n}`;
  if (/line\.me\/R\/oaMessage\//i.test(base)) {
    return base.includes("?") ? `${base}&text=${encodeURIComponent(body)}` : `${base}?text=${encodeURIComponent(body)}`;
  }
  return base;
}
