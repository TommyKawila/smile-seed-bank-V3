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

export function parseCbdNumeric(cbd: string | null | undefined): number | null {
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

/** Quick nav / URL `yield=high` — matches free-text yield_info (EN/TH hints). */
export function productMatchesYieldQuickParam(
  yieldInfo: string | null | undefined,
  param: string | null | undefined
): boolean {
  const want = param?.trim().toLowerCase();
  if (!want) return true;
  if (want !== "high") return true;
  const s = (yieldInfo ?? "").toLowerCase();
  return /high|xl|xxl|heavy|massive|monster|abundant|bumper|ผล|สูง|มาก|เยอะ|ใหญ่|yield/.test(s);
}

export function productMatchesShopAttributeFilters(
  p: {
    strain_dominance?: string | null;
    growing_difficulty?: string | null;
    thc_percent?: number | null;
    cbd_percent?: string | null;
    seed_type?: string | null;
    yield_info?: string | null;
  },
  genetics: string[],
  difficulty: string[],
  thc: string[],
  cbd: string[],
  sex: string[],
  yieldQuick?: string | null
): boolean {
  return (
    productMatchesGeneticsFilter(p.strain_dominance, genetics) &&
    productMatchesDifficultyFilter(p.growing_difficulty, difficulty) &&
    productMatchesThcFilter(p.thc_percent, thc) &&
    productMatchesCbdFilter(p.cbd_percent, cbd) &&
    productMatchesSexFilter(p.seed_type, sex) &&
    productMatchesYieldQuickParam(p.yield_info, yieldQuick)
  );
}

export type ShopFilterCountProduct = {
  strain_dominance?: string | null;
  growing_difficulty?: string | null;
  thc_percent?: number | null;
  cbd_percent?: string | null;
  seed_type?: string | null;
};

export type ShopFilterOptionCounts = {
  genetics: Record<string, number>;
  thc: Record<string, number>;
  cbd: Record<string, number>;
  difficulty: Record<string, number>;
  sex: Record<string, number>;
};

export function defaultFilterOptionCounts(): ShopFilterOptionCounts {
  return {
    genetics: { hybrid: 0, "sativa-dom": 0, "indica-dom": 0 },
    thc: { high: 0, mid: 0, low: 0 },
    cbd: { high: 0, mid: 0, low: 0 },
    difficulty: { easy: 0, moderate: 0, hard: 0 },
    sex: { feminized: 0, regular: 0 },
  };
}

function classifyGeneticsSlug(strainDominance: string | null | undefined): string | null {
  const dom = (strainDominance ?? "").trim();
  if (dom === "Hybrid 50/50") return "hybrid";
  if (dom === "Mostly Sativa") return "sativa-dom";
  if (dom === "Mostly Indica") return "indica-dom";
  return null;
}

function classifyThcSlug(thcPercent: number | null | undefined): string | null {
  if (thcPercent == null || Number.isNaN(Number(thcPercent))) return null;
  const n = Number(thcPercent);
  if (n > 20) return "high";
  if (n >= 15 && n <= 20) return "mid";
  if (n < 15) return "low";
  return null;
}

function classifyCbdSlug(cbdPercent: string | null | undefined): string | null {
  const n = parseCbdNumeric(cbdPercent);
  if (n == null) return null;
  if (n > 5) return "high";
  if (n >= 2 && n <= 5) return "mid";
  if (n < 2) return "low";
  return null;
}

function classifyDifficultySlug(growingDifficulty: string | null | undefined): string | null {
  const raw = (growingDifficulty ?? "").trim().toLowerCase();
  if (raw === "easy") return "easy";
  if (raw === "moderate") return "moderate";
  if (raw === "difficult" || raw === "hard") return "hard";
  return null;
}

function classifySexSlug(seedType: string | null | undefined): string | null {
  const u = (seedType ?? "").toUpperCase();
  if (u === "FEMINIZED") return "feminized";
  if (u === "REGULAR") return "regular";
  return null;
}

/** Counts products per filter bucket (same thresholds as productMatches*). Scope = breeder/search/ft only (exclude sidebar URL filters). */
export function calculateFilterCounts(products: ShopFilterCountProduct[]): ShopFilterOptionCounts {
  const c = defaultFilterOptionCounts();
  for (const p of products) {
    const g = classifyGeneticsSlug(p.strain_dominance);
    if (g && g in c.genetics) c.genetics[g] += 1;

    const th = classifyThcSlug(p.thc_percent);
    if (th && th in c.thc) c.thc[th] += 1;

    const cb = classifyCbdSlug(p.cbd_percent ?? null);
    if (cb && cb in c.cbd) c.cbd[cb] += 1;

    const d = classifyDifficultySlug(p.growing_difficulty);
    if (d && d in c.difficulty) c.difficulty[d] += 1;

    const s = classifySexSlug(p.seed_type ?? null);
    if (s && s in c.sex) c.sex[s] += 1;
  }
  return c;
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
    { ...p, cbd_percent: null, seed_type: null, yield_info: null },
    genetics,
    difficulty,
    thc,
    [],
    [],
    null
  );
}
