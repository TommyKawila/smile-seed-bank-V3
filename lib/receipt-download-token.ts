import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  return process.env.RECEIPT_DOWNLOAD_SECRET?.trim() || "ssb-receipt-token-v1-set-RECEIPT_DOWNLOAD_SECRET";
}

/** Short signed token for LINE / email links (no Supabase cookie). TTL default 90d. */
export function createReceiptDownloadQuery(orderNumber: string): { t: string; e: string } {
  const s = secret();
  if (!s) return { t: "", e: "" };
  const expSec = Math.floor(Date.now() / 1000) + 90 * 24 * 3600;
  const e = String(expSec);
  const t = createHmac("sha256", s).update(`${orderNumber}:${e}`).digest("hex");
  return { t, e };
}

export function verifyReceiptDownloadQuery(orderNumber: string, t: string, e: string): boolean {
  const s = secret();
  if (!s || !t || !e) return false;
  const expSec = parseInt(e, 10);
  if (!Number.isFinite(expSec) || expSec * 1000 < Date.now()) return false;
  const expected = createHmac("sha256", s).update(`${orderNumber}:${e}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(t, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}
