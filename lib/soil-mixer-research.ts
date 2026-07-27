/** Canonical blog slug — linked from Soil Mixer UI + knowledge module. */
export const SUPER_SOIL_ARTICLE_SLUG = "super-soil-recipe-smile-seed-bank";

export type SoilResearchSource = {
  id: string;
  name: string;
  url: string;
  note: string;
};

/** Trusted references used to derive Smile Seed Bank super-soil ratios. */
export const SUPER_SOIL_RESEARCH_SOURCES: SoilResearchSource[] = [
  {
    id: "nc-state-compost",
    name: "NC State Extension — Composting",
    url: "https://content.ces.ncsu.edu/composting",
    note: "Organic matter + microbial foundation for potting mixes.",
  },
  {
    id: "umn-phosphorus",
    name: "University of Minnesota Extension — Phosphorus fertilizers",
    url: "https://extension.umn.edu/manage-soil-nutrients/understanding-phosphorus-fertilizers",
    note: "Bone meal as slow-release P for roots and flowers.",
  },
  {
    id: "alchimia-supersoil",
    name: "Alchimia Grow Shop — Organic supersoil",
    url: "https://www.alchimiaweb.com/blogen/how-to-make-organic-supersoil/",
    note: "Worm castings 10–30%, guano/blood/bone roles, cook time.",
  },
  {
    id: "hydrobuilder-recipe",
    name: "Hydrobuilder Learning Center — Super soil recipe",
    url: "https://learn.hydrobuilder.com/super-soil-recipe/",
    note: "Peat/compost/aeration base + amendment stack for living soil.",
  },
];

export type SoilIngredientBrief = {
  id: string;
  roleTh: string;
  roleEn: string;
  nutrientsTh: string;
  nutrientsEn: string;
  inSuperTh: string;
  inSuperEn: string;
  cautionTh: string;
  cautionEn: string;
  typicalRatioNote: string;
};

export const SOIL_INGREDIENT_BRIEFS: SoilIngredientBrief[] = [
  {
    id: "coco",
    roleTh: "โครงสร้าง + ความชื้น — รากออกซิเจน",
    roleEn: "Structure + moisture retention with root oxygen",
    nutrientsTh: "ไม่มี NPK โดยตรง — โครงสร้าง",
    nutrientsEn: "No direct NPK — structural media",
    inSuperTh: "สื่อหลัก Super/Base — ~30–45% ตามโหมด",
    inSuperEn: "Primary media in Super/Base — ~30–45% by mode",
    cautionTh: "ต้องล้างเกลือถ้าเป็นขุยใหม่",
    cautionEn: "Rinse low-quality coir to reduce salt",
    typicalRatioNote: "Often 1/3 of peat:compost:aeration base (Hydrobuilder, Grower Today).",
  },
  {
    id: "peat",
    roleTh: "เก็บน้ำ + โครงสร้าง",
    roleEn: "Water retention + structure",
    nutrientsTh: "กรดอ่อน — ช่วย cation exchange",
    nutrientsEn: "Slightly acidic — cation exchange",
    inSuperTh: "ทดแทนหรือผสมกับขุยมะพร้าวป่น",
    inSuperEn: "Alternate or blend with coco coir",
    cautionTh: "อย่าให้แฉะติด — ต้องมี perlite",
    cautionEn: "Avoid waterlogging — pair with perlite",
    typicalRatioNote: "Common 1/3 peat in supersoil base mixes.",
  },
  {
    id: "compost",
    roleTh: "อินทรีย์วัตถุ + จุลินทรีย์",
    roleEn: "Organic matter + microbial food",
    nutrientsTh: "N-P-K สมดุล + humic acids",
    nutrientsEn: "Balanced N-P-K + humic acids",
    inSuperTh: "Base สูงสุด ~25% · Super ~22–25%",
    inSuperEn: "Base up to ~25% · Super ~22–25%",
    cautionTh: "ต้องหมักสุก — ไม่ใช่ของดิบ",
    cautionEn: "Use finished compost only",
    typicalRatioNote: "NC State Extension; 25% of substrate in our Base recipe.",
  },
  {
    id: "worm",
    roleTh: "มูลไส้เดือน — inoculant อ่อนโยน",
    roleEn: "Worm castings — gentle inoculant",
    nutrientsTh: "N + microbes + humic/fulvic",
    nutrientsEn: "N + microbes + humic/fulvic",
    inSuperTh: "Base ~15% · Super 18–20% (มากกว่า Base)",
    inSuperEn: "Base ~15% · Super 18–20% (more than Base)",
    cautionTh: "ใส่เกินในชั้นรากต้น = เสี่ยงไหม้",
    cautionEn: "Too much in root zone risks burn",
    typicalRatioNote: "Alchimia: 10–30% of mix; cornerstone of living soil.",
  },
  {
    id: "perlite",
    roleTh: "ระบายน้ำ + อากาศ",
    roleEn: "Drainage + aeration",
    nutrientsTh: "ไม่มี — โครงสร้าง",
    nutrientsEn: "None — structural",
    inSuperTh: "Base/Super ~10–15%",
    inSuperEn: "Base/Super ~10–15%",
    cautionTh: "ขาด perlite = ดินอัดแน่น",
    cautionEn: "Skipping perlite causes compaction",
    typicalRatioNote: "Industry guidance 20–25% aeration in hot mixes; we use 10–15% with coco/peat.",
  },
  {
    id: "biochar",
    roleTh: "กักเก็บน้ำ + ที่อยู่จุลินทรีย์",
    roleEn: "Water holding + microbe habitat",
    nutrientsTh: "ไม่ใช่ปุ๋ย — โครงสร้างคาร์บอน",
    nutrientsEn: "Not fertilizer — carbon structure",
    inSuperTh: "Super only 5–6%",
    inSuperEn: "Super only 5–6%",
    cautionTh: "ใช้ปริมาณน้อย — ไม่ใส่ Base",
    cautionEn: "Small dose — Super layer only",
    typicalRatioNote: "Optional in advance living-soil stacks.",
  },
  {
    id: "guano",
    roleTh: "มูลค้างคาว — P + micros",
    roleEn: "Bat guano — P + micronutrients",
    nutrientsTh: "P สูง (เลือก high-P bloom type)",
    nutrientsEn: "High P (choose bloom-grade guano)",
    inSuperTh: "Super basic 2% · advance 4%",
    inSuperEn: "Super basic 2% · advance 4%",
    cautionTh: "ร้อน — ห้ามใส่ Base",
    cautionEn: "Hot — never in Base layer",
    typicalRatioNote: "Alchimia; Hydrobuilder ~5 lb / 100 gal batch reference.",
  },
  {
    id: "kelp",
    roleTh: "Kelp Meal — K + growth regulators",
    roleEn: "Kelp meal — K + trace minerals",
    nutrientsTh: "โพแทสเซียม + cytokinins",
    nutrientsEn: "Potassium + cytokinins",
    inSuperTh: "Super 1–2%",
    inSuperEn: "Super 1–2%",
    cautionTh: "เสริม ไม่ใช่ปุ๋ยหลัก",
    cautionEn: "Supplement, not primary feed",
    typicalRatioNote: "Common kelp meal in supersoil cook recipes.",
  },
  {
    id: "bone",
    roleTh: "กระดูกป่น — P ช้า",
    roleEn: "Bone meal — slow P",
    nutrientsTh: "P + Ca",
    nutrientsEn: "P + Ca",
    inSuperTh: "Super advance 3% only",
    inSuperEn: "Super advance 3% only",
    cautionTh: "ต้อง cook ก่อนปลูก",
    cautionEn: "Must cook before planting",
    typicalRatioNote: "UMN Extension; Hydrobuilder 2.5–5 lb / batch.",
  },
  {
    id: "blood",
    roleTh: "ผงเลือดป่น — N เร็ว",
    roleEn: "Blood meal — fast N",
    nutrientsTh: "N ~12-0-0",
    nutrientsEn: "N ~12-0-0",
    inSuperTh: "Super advance 2% only",
    inSuperEn: "Super advance 2% only",
    cautionTh: "ร้อนมาก — ห้ามชั้นราก",
    cautionEn: "Very hot — keep out of root zone",
    typicalRatioNote: "Hydrobuilder / living-soil veg booster.",
  },
  {
    id: "lime",
    roleTh: "โดโลไมต์ — ปรับ pH + Ca/Mg",
    roleEn: "Dolomite — pH buffer + Ca/Mg",
    nutrientsTh: "Ca + Mg",
    nutrientsEn: "Ca + Mg",
    inSuperTh: "Super 1–1.5%",
    inSuperEn: "Super 1–1.5%",
    cautionTh: "อย่าใส่เกิน — ดินด่าง",
    cautionEn: "Over-lime raises pH too high",
    typicalRatioNote: "Grower Today / supersoil recipes use dolomite cups per batch.",
  },
  {
    id: "gypsum",
    roleTh: "ยิปซัม — Ca + S",
    roleEn: "Gypsum — Ca + S",
    nutrientsTh: "Ca + S (ไม่เปลี่ยน pH มาก)",
    nutrientsEn: "Ca + S (minimal pH shift)",
    inSuperTh: "Super 1–1.5%",
    inSuperEn: "Super 1–1.5%",
    cautionTh: "เสริม ไม่แทน lime",
    cautionEn: "Supplement — does not replace lime",
    typicalRatioNote: "Paired with dolomite in organic supersoil stacks.",
  },
];

export const SUPER_SOIL_PRINCIPLES = {
  potFillTh:
    "Super soil ร้อน — ใส่ก้น 1/3 แล้วทับ Base 2/3 ปลูกเฉพาะชั้น Base รากค่อยลงหา Super",
  potFillEn:
    "Super is nutrient-dense — bottom 1/3 Super, top 2/3 Base; plant in Base only so roots grow down gradually.",
  basicVsAdvanceTh:
    "Basic = Super โล่ง (guano/kelp/lime เบา) · Advance = เพิ่ม bone/blood/guano สำหรับสวนเต็มรอบ",
  basicVsAdvanceEn:
    "Basic = lean Super (light guano/kelp/lime) · Advance = full amendments including bone/blood for full-cycle beds.",
  cookTh: "พักดิน (cook) 10–14 วัน ชื้นพอจับตัว — ลด nutrient burn",
  cookEn: "Cook 10–14 days, lightly moist — reduces nutrient burn before planting.",
} as const;

export function getIngredientBrief(id: string): SoilIngredientBrief | undefined {
  return SOIL_INGREDIENT_BRIEFS.find((b) => b.id === id);
}
