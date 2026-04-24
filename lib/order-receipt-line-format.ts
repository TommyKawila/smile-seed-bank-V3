import { labelForFloweringTypeRaw } from "@/lib/seed-type-filter";
import { parsePackFromUnitLabel } from "@/lib/sku-utils";

export type OrderDisplayLocale = "th" | "en";

export function effectiveOrderItemUnitLabel(
  unitLabel: string | null | undefined,
  variantUnitLabel: string | null | undefined
): string {
  return unitLabel?.trim() || variantUnitLabel?.trim() || "";
}

export function formatFloweringForLocale(
  raw: string | null | undefined,
  locale: OrderDisplayLocale
): string {
  const r = (raw ?? "").trim();
  if (!r) return "—";
  return labelForFloweringTypeRaw(r, locale === "th" ? (th) => th : (_th, en) => en);
}

/** Pack line for receipts / order summary: e.g. "5 เมล็ด" (th) or "5 seeds" (en). */
export function formatSeedsCountLabel(
  unitLabel: string | null | undefined,
  variantUnitLabel: string | null | undefined,
  locale: OrderDisplayLocale
): string {
  const eff = effectiveOrderItemUnitLabel(unitLabel, variantUnitLabel);
  if (!eff) return "—";
  const n = parsePackFromUnitLabel(eff);
  if (locale === "th") return `${n} เมล็ด`;
  return n === 1 ? "1 seed" : `${n} seeds`;
}
