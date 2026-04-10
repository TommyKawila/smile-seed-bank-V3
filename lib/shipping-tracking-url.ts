/**
 * Public carrier tracking pages (Thailand). Returns null if carrier unknown — caller may omit button.
 */
export function getTrackingUrl(
  carrier: string | null | undefined,
  trackingNumber: string | null | undefined
): string | null {
  const tn = trackingNumber?.trim();
  if (!tn) return null;
  const c = (carrier ?? "").trim().toUpperCase().replace(/\s+/g, "_");

  switch (c) {
    case "FLASH_EXPRESS":
    case "FLASH":
      return `https://www.flashexpress.co.th/fle/tracking?se=${encodeURIComponent(tn)}`;
    case "KERRY_EXPRESS":
    case "KERRY":
      return `https://th.kerryexpress.com/th/track/?track=${encodeURIComponent(tn)}`;
    case "J&T_EXPRESS":
    case "JT_EXPRESS":
    case "JNT":
    case "JNT_EXPRESS":
      return `https://www.jtexpress.co.th/index/query/gzquery.html?waybillNo=${encodeURIComponent(tn)}`;
    case "THAILAND_POST":
    case "THAI_POST":
      return `https://track.thailandpost.co.th/?trackNumber=${encodeURIComponent(tn)}`;
    default:
      return null;
  }
}
