export type GrowerToolSlug =
  | "soil-mixer"
  | "vpd-calculator"
  | "fertilizer"
  | "plant-doctor";

export type GrowerToolIconName = "flask" | "droplets" | "leaf" | "stethoscope";

export type GrowerToolDef = {
  slug: GrowerToolSlug;
  iconName: GrowerToolIconName;
  labelTh: string;
  labelEn: string;
  blurbTh: string;
  blurbEn: string;
};

export const GROWER_TOOLS: GrowerToolDef[] = [
  {
    slug: "soil-mixer",
    iconName: "flask",
    labelTh: "ผสมดิน",
    labelEn: "Soil Mixer",
    blurbTh: "วิเคราะห์วัสดุที่มี — สูตรดินซุปเปอร์ซอยสำหรับ Home grow",
    blurbEn: "Analyze what you have — Super soil mix for home grows",
  },
  {
    slug: "vpd-calculator",
    iconName: "droplets",
    labelTh: "คำนวณ VPD",
    labelEn: "VPD Calculator",
    blurbTh: "วัดอุณหภูมิ·ความชื้น — แนะนำปรับ AC / Humidifier",
    blurbEn: "Temp & RH — AC / humidifier guidance",
  },
  {
    slug: "fertilizer",
    iconName: "leaf",
    labelTh: "ปุ๋ย",
    labelEn: "Fertilizer",
    blurbTh: "เลือกช่วงปลูก · ออแกนิคหรือสังเคราะห์ — AI แนะนำแนวปุ๋ย",
    blurbEn: "Stage & organic vs synthetic — AI feeding guidance",
  },
  {
    slug: "plant-doctor",
    iconName: "stethoscope",
    labelTh: "วิเคราะห์อาการ",
    labelEn: "Plant Doctor",
    blurbTh: "ถ่ายรูปหรืออัปโหลด — วิเคราะห์อาการเบื้องต้น",
    blurbEn: "Snap or upload — preliminary symptom check",
  },
];

export function getGrowerTool(slug: string): GrowerToolDef | null {
  return GROWER_TOOLS.find((t) => t.slug === slug) ?? null;
}

export function growerToolHref(slug: GrowerToolSlug): string {
  return `/tools/${slug}`;
}

export const GROWER_TOOLS_DISCLAIMER = {
  th: "คำแนะนำเบื้องต้นจาก AI — ไม่ใช่ใบรับรองทางวิทยาศาสตร์ ควรตรวจสอบกับผู้เชี่ยวชาญก่อนตัดสินใจ",
  en: "AI guidance only — not scientific certification. Consult an expert before major decisions.",
};

export const SOIL_MATERIAL_OPTIONS = [
  { id: "coco", labelTh: "ขุยมะพร้าวป่น", labelEn: "Coco coir" },
  { id: "peat", labelTh: "พีทมอส", labelEn: "Peat moss" },
  { id: "compost", labelTh: "ปุ๋ยหมัก / Compost", labelEn: "Compost" },
  { id: "worm", labelTh: "มูลไส้เดือน", labelEn: "Worm castings" },
  { id: "perlite", labelTh: "perlite", labelEn: "Perlite" },
  { id: "vermiculite", labelTh: "vermiculite", labelEn: "Vermiculite" },
  { id: "biochar", labelTh: "biochar", labelEn: "Biochar" },
  { id: "bone", labelTh: "bone meal", labelEn: "Bone meal" },
  { id: "blood", labelTh: "blood meal", labelEn: "Blood meal" },
  { id: "kelp", labelTh: "kelp meal", labelEn: "Kelp meal" },
  { id: "lime", labelTh: "dolomite lime", labelEn: "Dolomite lime" },
  { id: "gypsum", labelTh: "gypsum", labelEn: "Gypsum" },
  { id: "guano", labelTh: "ขี้ค้างคาว", labelEn: "Bat guano" },
  { id: "topsoil", labelTh: "ดินปลูกสำเร็จ", labelEn: "Bagged topsoil" },
] as const;

export type GrowStage = "seedling" | "veg" | "flower";

export const GROW_STAGES: { id: GrowStage; labelTh: string; labelEn: string }[] = [
  { id: "seedling", labelTh: "ต้นกล้า", labelEn: "Seedling" },
  { id: "veg", labelTh: "Vegetative", labelEn: "Vegetative" },
  { id: "flower", labelTh: "Flower", labelEn: "Flower" },
];
