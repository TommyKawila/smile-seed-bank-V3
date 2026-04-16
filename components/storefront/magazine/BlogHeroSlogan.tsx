"use client";

import { useLanguage } from "@/context/LanguageContext";

export function BlogHeroSlogan() {
  const { t, locale } = useLanguage();
  const text = t(
    "เข้าสู่คลังความรู้สายเขียวจาก Smile Seed Bank: แหล่งรวมประสบการณ์จริงเกือบ 10 ปี เทคนิคการปลูก และเจาะลึกพันธุกรรมจากบรีดเดอร์ระดับโลกเพื่อนักปลูกคุณภาพ.",
    "Enter the green knowledge vault: nearly ten years of field-tested grow science and breeder-grade genetics for serious cultivators."
  );
  return (
    <p
      className={`mx-auto max-w-2xl text-center font-sans text-sm font-light leading-relaxed text-emerald-950/70 ${
        locale === "en" ? "tracking-[0.22em]" : "tracking-wide"
      }`}
    >
      {text}
    </p>
  );
}
