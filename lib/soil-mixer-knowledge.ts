import {
  getIngredientBrief,
  SOIL_INGREDIENT_BRIEFS,
  SUPER_SOIL_ARTICLE_SLUG,
  SUPER_SOIL_PRINCIPLES,
  SUPER_SOIL_RESEARCH_SOURCES,
} from "@/lib/soil-mixer-research";

export { SUPER_SOIL_ARTICLE_SLUG };

export type SoilMixerFaq = {
  id: string;
  qTh: string;
  qEn: string;
  aTh: string;
  aEn: string;
};

export const SOIL_MIXER_FAQ: SoilMixerFaq[] = [
  {
    id: "why-1-3",
    qTh: "ทำไม Super แค่ 1/3 กระถาง?",
    qEn: "Why only 1/3 Super in the pot?",
    aTh: SUPER_SOIL_PRINCIPLES.potFillTh,
    aEn: SUPER_SOIL_PRINCIPLES.potFillEn,
  },
  {
    id: "basic-advance",
    qTh: "Basic กับ Advance ต่างกันยังไง?",
    qEn: "What's the difference between basic and advance?",
    aTh: SUPER_SOIL_PRINCIPLES.basicVsAdvanceTh,
    aEn: SUPER_SOIL_PRINCIPLES.basicVsAdvanceEn,
  },
  {
    id: "cook",
    qTh: "ต้อง cook ดินกี่วัน?",
    qEn: "How long should I cook the mix?",
    aTh: SUPER_SOIL_PRINCIPLES.cookTh,
    aEn: SUPER_SOIL_PRINCIPLES.cookEn,
  },
  {
    id: "burn",
    qTh: "อาการปุ๋ยไหม้เกิดจากอะไร?",
    qEn: "What causes nutrient burn?",
    aTh: "ใส่ Super เต็มกระถาง หรือปลูกรากลงชั้นร้อน (blood/guano มาก) — ใบไหม้ขอบ",
    aEn: "Filling the whole pot with Super or planting roots directly in hot amendments (blood/guano) — leaf edge burn.",
  },
  {
    id: "worm",
    qTh: "มูลไส้เดือนใส่ทำไม?",
    qEn: "Why worm castings?",
    aTh: getIngredientBrief("worm")?.roleTh ?? "",
    aEn: getIngredientBrief("worm")?.roleEn ?? "",
  },
  {
    id: "perlite",
    qTh: "ขาด perlite จะเป็นไง?",
    qEn: "What if I skip perlite?",
    aTh: getIngredientBrief("perlite")?.cautionTh ?? "",
    aEn: getIngredientBrief("perlite")?.cautionEn ?? "",
  },
  {
    id: "no-bagged-base",
    qTh: "ทำไมไม่แนะนำซื้อ Base soil สำเร็จรูป?",
    qEn: "Why no pre-made Base soil bags?",
    aTh: "เราผสม Base จากวัตถุดิบ — ควบคุมสัดส่วนและไม่จ่าย premium สำหรับดินสำเร็จรูป",
    aEn: "We mix Base from raw ingredients — controlled ratios without paying premium for bagged blends.",
  },
  {
    id: "guano-base",
    qTh: "ใส่มูลค้างคาวในชั้น Base ได้ไหม?",
    qEn: "Can I put guano in the Base layer?",
    aTh: "ไม่แนะนำ — guano ร้อน ควรอยู่ Super ชั้นล่างเท่านั้น",
    aEn: "Not recommended — guano is hot; keep it in the Super bottom layer only.",
  },
];

/** Compact context block for grounded AI Q&A (no live web search). */
export function buildSoilMixerKnowledgeContext(locale: "th" | "en"): string {
  const isEn = locale === "en";
  const principles = isEn
    ? [
        SUPER_SOIL_PRINCIPLES.potFillEn,
        SUPER_SOIL_PRINCIPLES.basicVsAdvanceEn,
        SUPER_SOIL_PRINCIPLES.cookEn,
      ]
    : [
        SUPER_SOIL_PRINCIPLES.potFillTh,
        SUPER_SOIL_PRINCIPLES.basicVsAdvanceTh,
        SUPER_SOIL_PRINCIPLES.cookTh,
      ];

  const ingredients = SOIL_INGREDIENT_BRIEFS.map((b) => {
    if (isEn) {
      return `${b.id}: ${b.roleEn} | ${b.nutrientsEn} | Super: ${b.inSuperEn} | Caution: ${b.cautionEn}`;
    }
    return `${b.id}: ${b.roleTh} | ${b.nutrientsTh} | Super: ${b.inSuperTh} | ระวัง: ${b.cautionTh}`;
  }).join("\n");

  const sources = SUPER_SOIL_RESEARCH_SOURCES.map((s) => `- ${s.name}: ${s.url}`).join("\n");

  return [
    `Article: /blog/${SUPER_SOIL_ARTICLE_SLUG}`,
    "Principles:",
    ...principles.map((p) => `- ${p}`),
    "Ingredients:",
    ingredients,
    "References:",
    sources,
  ].join("\n");
}

export function articleHref(): string {
  return `/blog/${SUPER_SOIL_ARTICLE_SLUG}`;
}
