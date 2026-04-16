/** Shared carrier display labels + public tracking URLs (Thailand). */

export const CARRIER_LABELS: Record<string, string> = {
  THAILAND_POST: "ไปรษณีย์ไทย (Thailand Post)",
  KERRY_EXPRESS: "Kerry Express",
  FLASH_EXPRESS: "Flash Express",
  "J&T_EXPRESS": "J&T Express",
};

export function carrierLabelFromCode(provider: string | null | undefined): string {
  const p = provider?.trim();
  if (!p) return "—";
  return CARRIER_LABELS[p] ?? p.replace(/_/g, " ");
}

export function carrierTrackingUrl(trackingNumber: string, provider: string): string {
  const t = encodeURIComponent(trackingNumber);
  switch (provider) {
    case "THAILAND_POST":
      return `https://track.thailandpost.co.th/?trackNumber=${t}`;
    case "FLASH_EXPRESS":
      return `https://www.flashexpress.co.th/tracking/?se=${t}`;
    case "J&T_EXPRESS":
      return `https://www.jtexpress.co.th/trajectoryQuery?waybillNo=${t}`;
    default:
      return `https://th.kerryexpress.com/en/track/?track=${t}`;
  }
}
