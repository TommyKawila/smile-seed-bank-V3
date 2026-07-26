export type PotVolumeUnit = "L" | "gal";

/** basic = lean Super mix · advance = full amendments (guano, bone, biochar, etc.) */
export type SuperSoilRecipeMode = "basic" | "advance";

/** US liquid gallon — common on pot labels in home grow shops. */
export const LITERS_PER_US_GALLON = 3.785411784;

export type SoilPotTarget = {
  potLiters: number;
  potCount: number;
  totalFillLiters: number;
  superSoilLiters: number;
  baseSoilLiters: number;
  superSoilPerPotLiters: number;
  baseSoilPerPotLiters: number;
};

export function potSizeToLiters(size: number, unit: PotVolumeUnit): number {
  return unit === "gal" ? size * LITERS_PER_US_GALLON : size;
}

export function litersToGallons(liters: number): number {
  return liters / LITERS_PER_US_GALLON;
}

export function computeSoilPotTarget(potLiters: number, potCount: number): SoilPotTarget {
  const totalFillLiters = potLiters * potCount;
  const superSoilLiters = totalFillLiters / 3;
  const baseSoilLiters = totalFillLiters * (2 / 3);
  return {
    potLiters,
    potCount,
    totalFillLiters,
    superSoilLiters,
    baseSoilLiters,
    superSoilPerPotLiters: superSoilLiters / potCount,
    baseSoilPerPotLiters: baseSoilLiters / potCount,
  };
}

export function formatLiters(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatVolumeDual(liters: number, isEn: boolean): string {
  const gal = litersToGallons(liters);
  const galLabel = isEn ? "gal" : "แกลลอน";
  return `${formatLiters(liters)} L (~${formatLiters(gal)} ${galLabel})`;
}

export function formatPotSizeLabel(size: number, unit: PotVolumeUnit, isEn: boolean): string {
  if (unit === "gal") {
    const galLabel = isEn ? "gal" : "แกลลอน";
    const liters = potSizeToLiters(size, "gal");
    return `${formatLiters(size)} ${galLabel} (~${formatLiters(liters)} L)`;
  }
  const gal = litersToGallons(size);
  const galLabel = isEn ? "gal" : "แกลลอน";
  return `${formatLiters(size)} L (~${formatLiters(gal)} ${galLabel})`;
}

/** Parse free-text volume e.g. "5 gal", "20L", "20 ลิตร" → liters. */
export function parseVolumeInput(raw: string): { liters: number; label: string } | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  const galMatch = s.match(/^([\d.]+)\s*(gal|gallon|gallons|g|แกล|แกลลอน|แกล\.?)$/);
  if (galMatch) {
    const n = Number(galMatch[1]);
    if (!Number.isFinite(n) || n <= 0) return null;
    const liters = potSizeToLiters(n, "gal");
    return { liters, label: `${formatLiters(n)} gal (~${formatLiters(liters)} L)` };
  }

  const lMatch = s.match(/^([\d.]+)\s*(l|liter|liters|litre|litres|ลิตร)?$/);
  if (lMatch) {
    const n = Number(lMatch[1]);
    if (!Number.isFinite(n) || n <= 0) return null;
    return { liters: n, label: `${formatLiters(n)} L (~${formatLiters(litersToGallons(n))} gal)` };
  }

  return null;
}

export function normalizeVolumeAmount(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const parsed = parseVolumeInput(trimmed);
  return parsed?.label ?? trimmed;
}

export type SoilMixBuyItem = {
  name: string;
  amount: string;
  keyword: string;
};

/** ok = enough on hand · short = have some, need more · missing = none on hand */
export type SoilMixStockStatus = "ok" | "short" | "missing";

export type SoilMixRecipeLine = {
  name: string;
  /** Amount this recipe needs (e.g. "30 L") */
  need: string;
  /** Amount allocated from on-hand for this line (e.g. "20 L" / "0") */
  have: string;
  status: SoilMixStockStatus;
  /** Extra to buy for this line; empty when ok */
  buyMore: string;
};

export type SoilMixAnalysis = {
  summary: string;
  /** Target fill volumes (server-filled from pot target). */
  volumes: {
    potCount: number;
    baseSoilLiters: number;
    superSoilLiters: number;
    totalFillLiters: number;
  };
  baseMixPlan: SoilMixRecipeLine[];
  superMixPlan: SoilMixRecipeLine[];
  gaps: string[];
  buyList: SoilMixBuyItem[];
  howToUse: {
    superPerPot: string;
    basePerPot: string;
    why: string;
    steps: string[];
  };
};

export type SoilMixBuyLink = SoilMixBuyItem & { shopUrl: string };

/** Pull first number from strings like "20 L", "ต้องซื้อเพิ่ม 10 L". */
export function extractLitersFromText(raw: string): number {
  const m = String(raw).match(/([\d.]+)/);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function recipeLineBuyLiters(line: SoilMixRecipeLine): number {
  if (line.status === "ok") return 0;
  const fromBuy = extractLitersFromText(line.buyMore);
  if (fromBuy > 0) return fromBuy;
  const need = extractLitersFromText(line.need);
  const have = extractLitersFromText(line.have);
  return Math.max(0, need - have);
}

/**
 * Sum buyMore across Base + Super recipe cards so gaps / Shopee links match the UI.
 */
export function aggregateShortagesFromRecipes(
  baseMixPlan: SoilMixRecipeLine[],
  superMixPlan: SoilMixRecipeLine[],
  locale: "th" | "en" = "th"
): { buyList: SoilMixBuyItem[]; gaps: string[] } {
  const map = new Map<string, { name: string; liters: number }>();

  for (const line of [...baseMixPlan, ...superMixPlan]) {
    const liters = recipeLineBuyLiters(line);
    if (liters <= 0) continue;
    const key = line.name.toLowerCase().trim();
    const prev = map.get(key);
    if (prev) prev.liters += liters;
    else map.set(key, { name: line.name, liters });
  }

  const buyList: SoilMixBuyItem[] = [...map.values()]
    .sort((a, b) => b.liters - a.liters)
    .slice(0, 12)
    .map((row) => ({
      name: row.name,
      amount: `${formatLiters(row.liters)} L`,
      keyword: row.name,
    }));

  const gaps = buyList.map((item) =>
    locale === "en" ? `Need ${item.name} ${item.amount}` : `ขาด${item.name} ${item.amount}`
  );

  return { buyList, gaps };
}
