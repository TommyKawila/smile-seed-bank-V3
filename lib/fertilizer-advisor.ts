export type FertilizerMedium = "soil" | "coco" | "hydro" | "rockwool";

export type FertilizerType = "organic" | "synthetic";

export const FERTILIZER_MEDIA: {
  id: FertilizerMedium;
  labelTh: string;
  labelEn: string;
}[] = [
  { id: "soil", labelTh: "ดิน", labelEn: "Soil" },
  { id: "coco", labelTh: "โคโคล้วน", labelEn: "Coco coir" },
  { id: "hydro", labelTh: "RDWC", labelEn: "RDWC" },
  { id: "rockwool", labelTh: "Rockwool", labelEn: "Rockwool" },
];

/** Organic feeding is soil-only; inert media need soluble synthetic nutes. */
export function isOrganicAllowedForMedium(medium: string): boolean {
  return medium === "soil";
}

export function resolveFertilizerType(
  medium: string,
  requested: FertilizerType
): FertilizerType {
  return isOrganicAllowedForMedium(medium) ? requested : "synthetic";
}

export type FertilizerNpkFocus = {
  n: string;
  p: string;
  k: string;
};

export type FertilizerProductRec = {
  name: string;
  role: string;
  keyword: string;
};

export type FertilizerAnalysis = {
  summary: string;
  npkFocus: FertilizerNpkFocus;
  products: FertilizerProductRec[];
  cautions: string[];
  feedingTips: string[];
  recommendedBrand?: string;
  brandTagline?: string;
};

export type FertilizerBuyLink = FertilizerProductRec & { shopUrl: string };

export type FertilizerGrowStage = "seedling" | "veg" | "flower";

type BrandProductDef = {
  name: string;
  roleTh: string;
  roleEn: string;
  keyword: string;
  stages: FertilizerGrowStage[];
};

export type FertilizerBrandKit = {
  brand: string;
  taglineTh: string;
  taglineEn: string;
  products: BrandProductDef[];
};

const ATHENA_KIT: FertilizerBrandKit = {
  brand: "Athena",
  taglineTh: "ปุ๋ยเพียวสำหรับ Coco / Rockwool — สัดส่วนชัด ให้ง่าย",
  taglineEn: "Pure coco & rockwool line — clear ratios, simple feeding",
  products: [
    {
      name: "Athena Pro Line Grow A + B",
      roleTh: "Base grow ช่วงต้นกล้า–veg",
      roleEn: "Grow base for seedling & veg",
      keyword: "Athena Pro Line Grow",
      stages: ["seedling", "veg"],
    },
    {
      name: "Athena Pro Line Bloom A + B",
      roleTh: "Base bloom ช่วงออกดอก",
      roleEn: "Bloom base for flower",
      keyword: "Athena Pro Line Bloom",
      stages: ["flower"],
    },
    {
      name: "Athena Balance (CalMag)",
      roleTh: "เสริม Ca/Mg — สำคัญใน coco & rockwool",
      roleEn: "CalMag boost — essential in coco & rockwool",
      keyword: "Athena Balance CalMag",
      stages: ["seedling", "veg", "flower"],
    },
  ],
};

const FLORAFLEX_KIT: FertilizerBrandKit = {
  brand: "FloraFlex",
  taglineTh: "ชุดปุ๋ยสำหรับ RDWC — ปรับ EC ตามสูตรแบรนด์",
  taglineEn: "RDWC nutrient line — follow brand EC targets",
  products: [
    {
      name: "FloraFlex Nutrients Starter Kit",
      roleTh: "ชุดหลัก A/B สำหรับระบบ recirculating",
      roleEn: "Core A/B kit for recirculating DWC",
      keyword: "FloraFlex Nutrients",
      stages: ["seedling", "veg", "flower"],
    },
    {
      name: "FloraFlex B1 + B2",
      roleTh: "เสริม bloom / PK ช่วงออกดอก",
      roleEn: "Bloom / PK boost for flower",
      keyword: "FloraFlex B1 B2",
      stages: ["flower"],
    },
    {
      name: "FloraFlex Full Tilt",
      roleTh: "บูสต์ PK ปลาย flower",
      roleEn: "Late-flower PK push",
      keyword: "FloraFlex Full Tilt",
      stages: ["flower"],
    },
  ],
};

const BIOBIZZ_KIT: FertilizerBrandKit = {
  brand: "Biobizz",
  taglineTh: "เสริมดินทั่วไป (ไม่ใช่ super soil) — ออแกนิคให้ทีละน้อย",
  taglineEn: "Regular soil supplement (not super soil) — light organic feeding",
  products: [
    {
      name: "Biobizz Bio Grow",
      roleTh: "ไนโตรเจนช่วงต้นกล้า–veg",
      roleEn: "N-forward feed for seedling & veg",
      keyword: "Biobizz Bio Grow",
      stages: ["seedling", "veg"],
    },
    {
      name: "Biobizz Root Juice",
      roleTh: "กระตุ้นรากช่วง veg",
      roleEn: "Root stimulant in veg",
      keyword: "Biobizz Root Juice",
      stages: ["veg"],
    },
    {
      name: "Biobizz Bio Bloom",
      roleTh: "โฟส/โพแทสช่วงออกดอก",
      roleEn: "P/K shift for flower",
      keyword: "Biobizz Bio Bloom",
      stages: ["flower"],
    },
    {
      name: "Biobizz Top Max",
      roleTh: "บูสต์ flower / น้ำหนักช่อ",
      roleEn: "Late flower weight boost",
      keyword: "Biobizz Top Max",
      stages: ["flower"],
    },
  ],
};

const BRAND_BY_MEDIUM: Record<FertilizerMedium, FertilizerBrandKit> = {
  soil: BIOBIZZ_KIT,
  coco: ATHENA_KIT,
  rockwool: ATHENA_KIT,
  hydro: FLORAFLEX_KIT,
};

export function getCuratedBrandKit(medium: FertilizerMedium): FertilizerBrandKit {
  return BRAND_BY_MEDIUM[medium];
}

export function getBrandProductsForStage(
  kit: FertilizerBrandKit,
  stage: FertilizerGrowStage,
  locale: "th" | "en" = "th"
): FertilizerProductRec[] {
  return kit.products
    .filter((p) => p.stages.includes(stage))
    .map(({ name, roleTh, roleEn, keyword }) => ({
      name,
      role: locale === "en" ? roleEn : roleTh,
      keyword,
    }));
}

export function isCuratedBrandMedium(medium: string): medium is FertilizerMedium {
  return medium in BRAND_BY_MEDIUM;
}

function asStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, max);
}

function asNpkFocus(raw: unknown): FertilizerNpkFocus | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const n = typeof row.n === "string" ? row.n.trim() : "";
  const p = typeof row.p === "string" ? row.p.trim() : "";
  const k = typeof row.k === "string" ? row.k.trim() : "";
  if (!n && !p && !k) return null;
  return { n: n || "—", p: p || "—", k: k || "—" };
}

function parseProducts(raw: unknown): FertilizerProductRec[] {
  if (!Array.isArray(raw)) return [];
  const out: FertilizerProductRec[] = [];
  for (const item of raw.slice(0, 8)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const role = typeof row.role === "string" ? row.role.trim() : "";
    const keyword =
      typeof row.keyword === "string" && row.keyword.trim()
        ? row.keyword.trim()
        : name;
    if (!name) continue;
    out.push({ name, role: role || name, keyword });
  }
  return out;
}

export function parseFertilizerAnalysis(raw: string): FertilizerAnalysis | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const summary = typeof data.summary === "string" ? data.summary.trim() : "";
    const npkFocus = asNpkFocus(data.npkFocus);
    if (!summary || !npkFocus) return null;

    return {
      summary,
      npkFocus,
      products: parseProducts(data.products),
      cautions: asStringArray(data.cautions, 6),
      feedingTips: asStringArray(data.feedingTips, 6),
    };
  } catch {
    return null;
  }
}
