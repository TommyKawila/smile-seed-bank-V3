/** Comma-separated multi-select query params for breeder-context shop filters */

export function parseListParam(param: string | null | undefined): string[] {
  if (!param?.trim()) return [];
  return param
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const GENETICS_SLUG_TO_DB: Record<string, string> = {
  hybrid: "Hybrid 50/50",
  "sativa-dom": "Mostly Sativa",
  "indica-dom": "Mostly Indica",
};

export function productMatchesGeneticsFilter(
  strainDominance: string | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const dom = (strainDominance ?? "").trim();
  for (const slug of selectedSlugs) {
    const want = GENETICS_SLUG_TO_DB[slug];
    if (want && dom === want) return true;
  }
  return false;
}

export function productMatchesDifficultyFilter(
  growingDifficulty: string | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const raw = (growingDifficulty ?? "").trim().toLowerCase();
  for (const s of selectedSlugs) {
    if (s === "easy" && raw === "easy") return true;
    if (s === "moderate" && raw === "moderate") return true;
    if (s === "hard" && (raw === "difficult" || raw === "hard")) return true;
  }
  return false;
}

export function productMatchesThcFilter(
  thcPercent: number | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  if (thcPercent == null || Number.isNaN(Number(thcPercent))) return false;
  const n = Number(thcPercent);
  for (const s of selectedSlugs) {
    if (s === "high" && n > 20) return true;
    if (s === "mid" && n >= 15 && n <= 20) return true;
    if (s === "low" && n < 15) return true;
  }
  return false;
}

function parseCbdNumeric(cbd: string | null | undefined): number | null {
  if (cbd == null || cbd === "") return null;
  const m = String(cbd).match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** CBD buckets: High >5%, Mid 2–5%, Low <2% (numeric parse from free-form cbd_percent). */
export function productMatchesCbdFilter(
  cbdPercent: string | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const n = parseCbdNumeric(cbdPercent);
  if (n == null) return false;
  for (const s of selectedSlugs) {
    if (s === "high" && n > 5) return true;
    if (s === "mid" && n >= 2 && n <= 5) return true;
    if (s === "low" && n < 2) return true;
  }
  return false;
}

export function productMatchesSexFilter(
  seedType: string | null | undefined,
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return true;
  const u = (seedType ?? "").toUpperCase();
  for (const s of selectedSlugs) {
    if (s === "feminized" && u === "FEMINIZED") return true;
    if (s === "regular" && u === "REGULAR") return true;
  }
  return false;
}

export function productMatchesShopAttributeFilters(
  p: {
    strain_dominance?: string | null;
    growing_difficulty?: string | null;
    thc_percent?: number | null;
    cbd_percent?: string | null;
    seed_type?: string | null;
  },
  genetics: string[],
  difficulty: string[],
  thc: string[],
  cbd: string[],
  sex: string[]
): boolean {
  return (
    productMatchesGeneticsFilter(p.strain_dominance, genetics) &&
    productMatchesDifficultyFilter(p.growing_difficulty, difficulty) &&
    productMatchesThcFilter(p.thc_percent, thc) &&
    productMatchesCbdFilter(p.cbd_percent, cbd) &&
    productMatchesSexFilter(p.seed_type, sex)
  );
}

/** @deprecated Use productMatchesShopAttributeFilters */
export function productMatchesBreederAttributeFilters(
  p: {
    strain_dominance?: string | null;
    growing_difficulty?: string | null;
    thc_percent?: number | null;
  },
  genetics: string[],
  difficulty: string[],
  thc: string[]
): boolean {
  return productMatchesShopAttributeFilters(
    { ...p, cbd_percent: null, seed_type: null },
    genetics,
    difficulty,
    thc,
    [],
    []
  );
}
