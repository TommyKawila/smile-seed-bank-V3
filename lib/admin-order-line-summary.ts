import { parsePackFromUnitLabel } from "@/lib/sku-utils";
import { adminOrderLineItemSeedTypeLabel } from "@/lib/seed-type-filter";
import type { AdminOrderLineItem } from "@/types/admin-order";

export function adminOrderLineSeedsPart(li: {
  unit_label: string | null;
  variant_unit_label: string | null;
  quantity: number;
}): string {
  const eff = li.unit_label?.trim() || li.variant_unit_label?.trim() || "";
  if (!eff) return `${li.quantity} เมล็ด`;
  const per = parsePackFromUnitLabel(eff);
  if (per <= 0) return `${li.quantity} เมล็ด`;
  return `${per * li.quantity} เมล็ด`;
}

/** `{ProductName} ({Qty} เมล็ด) — {Breeder} ({SeedType})` for list + mobile summaries */
export function formatAdminOrderLineSummary(li: AdminOrderLineItem): string {
  const seeds = adminOrderLineSeedsPart(li);
  const bre = (() => {
    const s = (li.breeder_name ?? "").trim();
    return s && s !== "—" ? s : "—";
  })();
  const typ = adminOrderLineItemSeedTypeLabel(li);
  return `${li.product_name} (${seeds}) — ${bre} (${typ})`;
}

/** TH packing line: `{Name} แพคเกจ {Variant} / ค่าย {Brand} ({Type}) ราคา {n}.- X {qty} ชิ้น` */
export function formatPriceBahtShort(amount: number): string {
  const n = Math.round(Number(amount));
  return `${n.toLocaleString("th-TH")}.-`;
}

function normalizePackingDisplayText(s: string): string {
  return s
    .replace(/\bPhotoperiod\s+FF\b/gi, "Photo FF")
    .replace(/\bAutoflower\b/gi, "Auto")
    .replace(/\bSeeds\b/gi, "เมล็ด")
    .replace(/\bSeed\b/gi, "เมล็ด")
    .trim();
}

function shortenTypeLabelForPacking(raw: string): string {
  const t = raw.trim();
  if (!t || t === "—") return t || "—";
  if (/^autoflower$/i.test(t)) return "Auto";
  if (/^photoperiod\s+ff$/i.test(t)) return "Photo FF";
  return t;
}

export function formatItemForPacking(li: AdminOrderLineItem): string {
  const product = (li.product_name ?? "").trim() || "—";
  const packRaw = li.unit_label?.trim() || li.variant_unit_label?.trim() || "—";
  const variant = normalizePackingDisplayText(packRaw);
  let brand = (li.breeder_name ?? "").trim();
  if (!brand || brand === "—") brand = "—";
  const typeRaw = adminOrderLineItemSeedTypeLabel(li);
  const type = shortenTypeLabelForPacking(normalizePackingDisplayText(typeRaw));
  const price = formatPriceBahtShort(li.unit_price);
  const qty = li.quantity;
  return `${product} แพคเกจ ${variant} / ค่าย ${brand} (${type}) ราคา ${price} X ${qty} ชิ้น`;
}

/** Clipboard / packing: summary + ` x {qty} pack(s)` */
export function formatAdminOrderPackingCopyLine(li: AdminOrderLineItem): string {
  return `${formatAdminOrderLineSummary(li)} x ${li.quantity} pack(s)`;
}
