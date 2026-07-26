/**
 * Thai display terms for Soil Mixer — canonical labels for UI + AI prompts.
 * Aliases map informal/English names → preferred Thai copy.
 */
export const SOIL_MIXER_TERMS = {
  superSoil: {
    th: "ดินซุปเปอร์ซอย",
    en: "Super soil",
  },
  baseSoil: {
    th: "ดินพื้นฐาน",
    en: "Base soil",
  },
  /** Informal / alt → canonical Thai (for normalization). */
  aliases: {
    ดินซุป: "ดินซุปเปอร์ซอย",
    "super soil": "ดินซุปเปอร์ซอย",
    supersoil: "ดินซุปเปอร์ซอย",
    แบทกวาโน: "ขี้ค้างคาว",
    "bat guano": "ขี้ค้างคาว",
    guano: "ขี้ค้างคาว",
    โคโคพีท: "ขุยมะพร้าวป่น",
    "coco coir": "ขุยมะพร้าวป่น",
    coir: "ขุยมะพร้าวป่น",
  } as Record<string, string>,
} as const;

export function soilTermSuperSoil(isEn: boolean): string {
  return isEn ? SOIL_MIXER_TERMS.superSoil.en : SOIL_MIXER_TERMS.superSoil.th;
}

export function soilTermBaseSoil(isEn: boolean): string {
  return isEn ? SOIL_MIXER_TERMS.baseSoil.en : SOIL_MIXER_TERMS.baseSoil.th;
}

/** Prompt block for Thai locale — enforce vocabulary in AI JSON strings. */
export function soilMixerThaiVocabularyPrompt(): string {
  return `Thai vocabulary (use exactly in all Thai strings):
- Super soil → "ดินซุปเปอร์ซอย" (never only "ดินซุป")
- Base soil → "ดินพื้นฐาน"
- Coco coir / โคโคพีท → "ขุยมะพร้าวป่น"
- Bat guano / แบทกวาโน → "ขี้ค้างคาว"`;
}

/** Replace known aliases in Thai AI text for display consistency. */
export function normalizeSoilMixerThaiText(text: string): string {
  let out = text;
  const replacements: [RegExp, string][] = [
    [/ดินซุป(?!เปอร์)/g, SOIL_MIXER_TERMS.superSoil.th],
    [/แบทกวาโน/gi, "ขี้ค้างคาว"],
    [/bat guano/gi, "ขี้ค้างคาว"],
    [/โคโคพีท/g, "ขุยมะพร้าวป่น"],
    [/coco coir/gi, "ขุยมะพร้าวป่น"],
  ];
  for (const [re, rep] of replacements) {
    out = out.replace(re, rep);
  }
  return out;
}

export type SoilPrepGuide = {
  title: string;
  steps: string[];
};

/** Curated prep guides before planting — volumes injected from pot target. */
export function getSoilPrepGuides(opts: {
  isEn: boolean;
  superLitersLabel: string;
  baseLitersLabel: string;
  superPerPotLabel: string;
  basePerPotLabel: string;
}): { superPrep: SoilPrepGuide; basePrep: SoilPrepGuide; potFill: SoilPrepGuide } {
  const superName = soilTermSuperSoil(opts.isEn);
  const baseName = soilTermBaseSoil(opts.isEn);

  if (opts.isEn) {
    return {
      superPrep: {
        title: `Mix & prep ${superName} (~${opts.superLitersLabel} L)`,
        steps: [
          `Lay a tarp or use a clean tub — target batch ~${opts.superLitersLabel} L.`,
          "Mix dry media first (coco / peat / perlite), then fold in amendments (castings, guano, meals, lime, biochar).",
          "Moisten lightly until it clumps but does not drip — do not soak.",
          "Cook / rest 10–14 days in a warm shaded spot; turn once mid-week if damp.",
          "Ready when earthy smell is mild — not sour or ammonia-sharp.",
        ],
      },
      basePrep: {
        title: `Mix & prep ${baseName} (~${opts.baseLitersLabel} L)`,
        steps: [
          `Target batch ~${opts.baseLitersLabel} L — lighter mix for the top layer.`,
          "Blend coco / peat / perlite (and light compost if used) until even color.",
          "Keep lean — no hot amendments (guano, bone/blood meal) in this layer.",
          "Moisten lightly before potting so it settles without waterlogging.",
        ],
      },
      potFill: {
        title: "Fill pots before planting",
        steps: [
          `Bottom 1/3: ${superName} (~${opts.superPerPotLabel} L per pot).`,
          "Lightly water the Super layer so it contacts the pot wall.",
          `Top 2/3: ${baseName} (~${opts.basePerPotLabel} L per pot) as a buffer.`,
          "Transplant / sow into the Base layer only — roots grow down into Super later.",
          "Do not fill the whole pot with Super soil — risk of burn.",
        ],
      },
    };
  }

  return {
    superPrep: {
      title: `วิธีผสมและเตรียม${superName} (~${opts.superLitersLabel} L)`,
      steps: [
        `เตรียมภาชนะหรือผ้าใบ — เป้าผสมประมาณ ${opts.superLitersLabel} L`,
        "คลุกวัสดุหลักให้เข้ากันก่อน (ขุยมะพร้าวป่น / พีท / เพอร์ไลท์) แล้วค่อยใส่สารเสริม (มูลไส้เดือน · ขี้ค้างคาว · bone/blood/kelp · ปูน · biochar)",
        "พรมน้ำให้ชื้นพอจับตัวได้ ไม่แฉะน้ำหยด",
        "พักดิน (cook) 10–14 วัน ในที่ร่มอุ่น — พลิกกลางสัปดาห์ถ้าชื้นมาก",
        "พร้อมใช้เมื่อกลิ่นดินหอมอ่อน ไม่ฉุนแอมโมเนียหรือเปรี้ยวจัด",
      ],
    },
    basePrep: {
      title: `วิธีผสมและเตรียม${baseName} (~${opts.baseLitersLabel} L)`,
      steps: [
        `เป้าผสมประมาณ ${opts.baseLitersLabel} L — ดินชั้นบนที่เบากว่า`,
        "คลุกขุยมะพร้าวป่น / พีท / เพอร์ไลท์ (และปุ๋ยหมักเบาๆ ถ้ามี) ให้สีสม่ำเสมอ",
        "อย่าใส่สารร้อน (ขี้ค้างคาว · bone/blood meal) ในชั้นนี้",
        "พรมน้ำให้ชื้นเล็กน้อยก่อนใส่กระถาง เพื่อให้ดินยุบตัวดี ไม่แฉะ",
      ],
    },
    potFill: {
      title: "ใส่กระถางก่อนลงมือปลูก",
      steps: [
        `ก้นกระถาง 1/3: ${superName} (~${opts.superPerPotLabel} L/กระถาง)`,
        "รดน้ำชุ่มเบาๆ ที่ชั้นซุปเปอร์ซอย ให้ดินชิดผนังกระถาง",
        `ส่วนบน 2/3: ${baseName} (~${opts.basePerPotLabel} L/กระถาง) เป็นชั้นกันเบิร์น`,
        "ปลูก/ลงกล้าเฉพาะในชั้นดินพื้นฐาน — รากจะค่อยยื่นลงชั้นซุปเปอร์ซอยทีหลัง",
        "ห้ามใส่ดินซุปเปอร์ซอยเต็มกระถาง — เสี่ยงเบิร์นราก",
      ],
    },
  };
}
