import { getGeneticPercents } from "@/lib/genetic-percents";

export type CardStrainProduct = {
  strain_dominance?: string | null;
  indica_percent?: number | null;
  sativa_percent?: number | null;
};

/** Indica / Sativa / Hybrid for catalog card spec row. */
export function cardStrainTypeLabel(p: CardStrainProduct): string | null {
  const sd = (p.strain_dominance ?? "").trim();
  if (sd) {
    const lower = sd.toLowerCase();
    if (lower.includes("hybrid") || lower.includes("50/50")) return "Hybrid";
    if (lower.includes("mostly sativa") || /^sativa/i.test(sd)) return "Sativa";
    if (lower.includes("mostly indica") || /^indica/i.test(sd)) return "Indica";
  }
  const g = getGeneticPercents(p);
  if (g) {
    if (g.sativa >= 58) return "Sativa";
    if (g.indica >= 58) return "Indica";
    return "Hybrid";
  }
  return null;
}

export const NEW_ARRIVAL_MS = 35 * 24 * 60 * 60 * 1000;

export function isNewArrivalProduct(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < NEW_ARRIVAL_MS;
}

/** Quiet scarcity copy for the displayed pack variant stock. */
export function getAvailabilityNote(
  stock: number | null | undefined,
  locale: string
): string | null {
  const count = Number(stock ?? 0);
  if (!Number.isFinite(count) || count <= 0 || count > 5) return null;
  if (count === 1) {
    return locale === "th" ? "เหลือ 1 แพ็ก" : "1 pack left";
  }
  return locale === "th" ? "จำนวนจำกัด" : "Limited release";
}
