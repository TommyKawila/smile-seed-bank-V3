import { resolveSoilShopeeKeyword } from "@/lib/soil-mixer";

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
  ingredientId?: string;
};

export type FertilizerAnalysis = {
  summary: string;
  npkFocus: FertilizerNpkFocus;
  products: FertilizerProductRec[];
  cautions: string[];
  feedingTips: string[];
  prepSteps?: string[];
  recommendedBrand?: string;
  brandTagline?: string;
  organicNatural?: boolean;
};

export type FertilizerBuyLink = FertilizerProductRec & { shopUrl: string };

export type FertilizerGrowStage = "seedling" | "veg" | "flower";

type BrandProductDef = {
  name: string;
  roleTh: string;
  roleEn: string;
  keyword: string;
  ingredientId?: string;
  stages: FertilizerGrowStage[];
};

export type FertilizerBrandKit = {
  brand: string;
  brandEn?: string;
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

const ORGANIC_SOIL_KIT: FertilizerBrandKit = {
  brand: "สารอาหารธรรมชาติ",
  brandEn: "Natural amendments",
  taglineTh: "เสริมดินทั่วไปด้วยวัสดุออร์แกนิค — หลักเดียวกับการผสมดินปลูก (ไม่ใช่ Super soil ร้อน)",
  taglineEn: "Regular soil boosts with organic amendments — same idea as soil mixing (not hot super soil)",
  products: [
    {
      name: "มูลไส้เดือน",
      roleTh: "ไนโตรเจน + จุลินทรีย์ — top-dress หรือผสมดิน",
      roleEn: "N + microbes — top-dress or mix in",
      keyword: "มูลไส้เดือน",
      ingredientId: "worm",
      stages: ["seedling", "veg", "flower"],
    },
    {
      name: "Compost Tea",
      roleTh: "Compost Tea / ผสมดิน — ให้ทีละน้อย",
      roleEn: "Compost tea / mix-in — light doses",
      keyword: "Compost Tea",
      ingredientId: "compost",
      stages: ["seedling", "veg", "flower"],
    },
    {
      name: "Kelp Meal",
      roleTh: "เคลป์ชา / รดใบ — โพแทสเซียม + ไมโคร",
      roleEn: "Kelp tea / foliar — K + micros",
      keyword: "kelp meal",
      ingredientId: "kelp",
      stages: ["seedling", "veg", "flower"],
    },
    {
      name: "มูลค้างคาว",
      roleTh: "ไนโตรเจนอ่อน — โรยบางๆ ช่วง veg",
      roleEn: "Soft N — light dusting in veg",
      keyword: "มูลค้างคาว",
      ingredientId: "guano",
      stages: ["veg"],
    },
    {
      name: "กระดูกป่น",
      roleTh: "ฟอสฟอรัส — ช่วงออกดอก",
      roleEn: "Phosphorus — flower stage",
      keyword: "กระดูกป่น + Bone meal",
      ingredientId: "bone",
      stages: ["flower"],
    },
    {
      name: "ผงเลือดป่น",
      roleTh: "ไนโตรเจนเร็ว — veg เท่านั้น ใช้น้อยมาก",
      roleEn: "Fast N — veg only, tiny amounts",
      keyword: "ผงเลือดป่น + blood meal",
      ingredientId: "blood",
      stages: ["veg"],
    },
  ],
};

const ORGANIC_SOIL_PREP: Record<FertilizerGrowStage, { th: string[]; en: string[] }> = {
  seedling: {
    th: [
      "ผสมมูลไส้เดือน 10–15% ลงดินก่อนปลูก หรือโรยบางๆ รอบโคน — อย่าใส่หนัก",
      "Compost Tea อ่อน: 1 ส่วนปุ๋ยหมัก : 10 ส่วนน้ำ แช่ 24–48 ชม. กรองก่อนรด",
      "รดรอบโคน 1 ครั้ง/1–2 สัปดาห์ หลีกเลี่ยงใบอ่อน — ดินชื้นพอ ไม่แฉะ",
    ],
    en: [
      "Mix 10–15% worm castings before planting or light top-dress — never heavy",
      "Mild compost tea: 1 part compost : 10 parts water, brew 24–48 h, strain before use",
      "Water at the root zone every 1–2 weeks — keep moist, not soggy; skip tender leaves",
    ],
  },
  veg: {
    th: [
      "Top-dress มูลไส้เดือน ~1–2 ช้อนโต๊ะ/กระถาง 12 L ทุก 2–3 สัปดาห์ คลุกเบาๆ แล้วรดน้ำ",
      "Compost Tea + kelp แทนน้ำเปล่า 1–2 ครั้ง/สัปดาห์ — เริ่มต้นจาง ค่อยๆ เพิ่ม",
      "มูลค้างคาว/ผงเลือดป่น โรยปลายช้อนชา/กระถาง ครั้งเดียวต้น veg — ห้ามซ้ำถี่",
    ],
    en: [
      "Top-dress worm castings ~1–2 tbsp per 12 L pot every 2–3 weeks; scratch in lightly and water",
      "Compost + kelp tea instead of plain water 1–2×/week — start dilute, increase slowly",
      "Bat guano or blood meal: tip of a teaspoon per pot once early veg — do not repeat often",
    ],
  },
  flower: {
    th: [
      "เปลี่ยนโฟกัส P/K — กระดูกป่น + มูลค้างคาวโรยบางๆ สัปดาห์ละครั้ง คลุกชั้นบนดิน",
      "ลดไนโตรเจนหนัก — หยุดผงเลือดป่น และลดมูลค้างคาว N สูง",
      "Kelp tea รด 1 ครั้ง/สัปดาห์ ช่วง flower — รดรอบโคน ไม่ใส่ใบหนา",
    ],
    en: [
      "Shift to P/K — light bone meal + guano top-dress weekly; scratch into top layer only",
      "Ease off heavy N — stop blood meal and high-N guano",
      "Kelp tea once weekly in flower — root zone only, avoid heavy foliar drench",
    ],
  },
};

const BIOBIZZ_KIT: FertilizerBrandKit = {
  brand: "Biobizz",
  taglineTh: "เสริมดินทั่วไป (ไม่ใช่ Super soil) — ออแกนิคให้ทีละน้อย",
  taglineEn: "Regular soil supplement (not Super soil) — light organic feeding",
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

export function isOrganicSoilFeeding(medium: FertilizerMedium, type: FertilizerType): boolean {
  return medium === "soil" && type === "organic";
}

export function resolveFertilizerKit(
  medium: FertilizerMedium,
  type: FertilizerType
): FertilizerBrandKit {
  if (isOrganicSoilFeeding(medium, type)) return ORGANIC_SOIL_KIT;
  return BRAND_BY_MEDIUM[medium];
}

export function getOrganicSoilPrepSteps(
  stage: FertilizerGrowStage,
  locale: "th" | "en"
): string[] {
  const row = ORGANIC_SOIL_PREP[stage];
  return locale === "en" ? row.en : row.th;
}

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
    .map(({ name, roleTh, roleEn, keyword, ingredientId }) => ({
      name,
      role: locale === "en" ? roleEn : roleTh,
      keyword: resolveSoilShopeeKeyword(ingredientId, keyword),
      ingredientId,
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
