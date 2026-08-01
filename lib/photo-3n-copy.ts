export type Photo3nLocale = "th" | "en";

export type Photo3nBullet = {
  title: string;
  body: string;
};

export type Photo3nAdvantageCopy = {
  heading: string;
  bullets: Photo3nBullet[];
};

const COPY: Record<Photo3nLocale, Photo3nAdvantageCopy> = {
  en: {
    heading: "3N Seed Advantage (Triploids)",
    bullets: [
      {
        title: "Total Sterility",
        body: "Produces 99%+ seedless (sinsemilla) flowers even if exposed to outside pollen.",
      },
      {
        title: "Energy Redirection",
        body: "Channels metabolic energy into increased floral biomass and heavy resin production instead of seed creation.",
      },
      {
        title: "Enhanced Potency",
        body: "Yields higher concentrations of active cannabinoids (THC) and aromatic terpenes.",
      },
      {
        title: "Outdoor Protection",
        body: "Ideal for outdoor grows where pollen contamination risk is high — plants stay seedless under outside pollen pressure.",
      },
    ],
  },
  th: {
    heading: "ข้อดีเมล็ด 3N (Triploid)",
    bullets: [
      {
        title: "เป็นหมันเกือบสมบูรณ์",
        body: "ให้ดอกแบบไม่มีเมล็ด (sinsemilla) มากกว่า 99% แม้โดนละอองเรณูจากภายนอก",
      },
      {
        title: "เปลี่ยนทิศพลังงาน",
        body: "ส่งพลังงานไปเพิ่มมวลดอกและเรซินหนาแน่น แทนการสร้างเมล็ด",
      },
      {
        title: "ความแรงที่สูงขึ้น",
        body: "ให้สารแคนนาบินอยด์ออกฤทธิ์ (THC) และเทอร์พีนที่มีกลิ่นหอมในความเข้มข้นสูงขึ้น",
      },
      {
        title: "ปกป้องการปลูกกลางแจ้ง",
        body: "เหมาะปลูกกลางแจ้งที่มีความเสี่ยงละอองเรณูจากภายนอก — ต้นยังคงไร้เมล็ดแม้เจอละอองเรณู",
      },
    ],
  },
};

export function getPhoto3nAdvantageCopy(locale: string): Photo3nAdvantageCopy {
  return locale === "en" ? COPY.en : COPY.th;
}
