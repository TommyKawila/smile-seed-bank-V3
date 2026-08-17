import type { SgCategorySlug } from "@/lib/seeds-genetics-catalog";

export type SgSupremeInfoBlock = {
  titleEn: string;
  titleTh: string;
  bodyEn: string[];
  bodyTh: string[];
};

export const SG_SUPREME_OVERVIEW: SgSupremeInfoBlock = {
  titleEn: "Supreme cannabis seeds – top-class genetics for maximum performance",
  titleTh: "Supreme — สายพันธุ์ระดับพรีเมียมจาก Seeds Genetics",
  bodyEn: [
    "Supreme cannabis seeds represent the highest quality cannabis genetics and are specially selected for growers who accept nothing less than the best results. These premium seeds combine vigorous growth, stable traits, and impressive yields with rich aromas and high THC levels.",
    "Whether you grow indoors, outdoors, or in a greenhouse, Supreme varieties deliver reliable performance and strong plants that cope well with changing conditions. Thanks to careful breeding and consistent genetics, you can count on uniform growth, compact flowering times, and heavy, resin-rich buds.",
  ],
  bodyTh: [
    "สาย Supreme คัดจากพันธุกรรมชั้นบนของ Seeds Genetics — โตแรง สม่ำเสมอ ให้ผลผลิตและกลิ่นหอมเข้มข้น",
    "เหมาะทั้งในร่ม กลางแจ้ง และเรือนกระจก — ออกดอกสม่ำเสมอ ช่วงออกดอกกระชับ ช่อหนาเรซิ่น",
  ],
};

export const SG_SUPREME_CATEGORY_INFO: Partial<Record<SgCategorySlug, SgSupremeInfoBlock>> = {
  "supreme-feminized": {
    titleEn: "Supreme feminized cannabis seeds – maximum yield with top genetics",
    titleTh: "Supreme feminized — ให้ผลผลิตสูงด้วยพันธุกรรมชั้นบน",
    bodyEn: [
      "Supreme feminized cannabis seeds are developed for growers who aim for maximum yield and top quality. Thanks to carefully selected and stable genetics, the plants grow extremely uniformly and vigorously, allowing you to make optimal use of every square meter of your grow space.",
      "This ensures efficient cultivation, predictable results, and a consistent, productive harvest with high-quality buds.",
    ],
    bodyTh: [
      "พัฒนาเพื่อผู้ปลูกที่ต้องการผลผลิตสูงสุด — ต้นโตสม่ำเสมอ ใช้พื้นที่เพาะปลูกได้เต็มที่",
      "เก็บเกี่ยวคาดการณ์ได้ ช่อคุณภาพสูงสม่ำเสมอทุกรอบ",
    ],
  },
  "supreme-autoflower": {
    titleEn: "Supreme autoflower cannabis seeds – premium quality with a fast harvest",
    titleTh: "Supreme autoflower — พรีเมียม เก็บเกี่ยวเร็ว ไม่ต้องจัดแสงซับซ้อน",
    bodyEn: [
      "Supreme autoflower cannabis seeds combine the best of both worlds: top-class genetics and the convenience of automatic flowering. These carefully selected premium varieties are developed for growers who want maximum performance without complicated light schedules.",
    ],
    bodyTh: [
      "ผสานพันธุกรรมชั้นบนกับออกดอกอัตโนมัติ — เหมาะกับผู้ปลูกที่ต้องการประสิทธิภาพสูงโดยไม่ต้องจัดตารางแสงยุ่งยาก",
    ],
  },
};

export function sgHasSupremeCategories(slugs: string[]): boolean {
  return slugs.some((s) => s === "supreme-feminized" || s === "supreme-autoflower");
}
