"use client";

import { useLanguage } from "@/context/LanguageContext";

export function BlogHeroSlogan() {
  const { t, locale } = useLanguage();
  const text = t(
    "ผสานศาสตร์ชีวภาพ สู่สายเขียวออแกนิค เพื่อรอยยิ้มที่ปลอดภัย",
    "Bio-Ag Wisdom for Safe & Organic Smiles"
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
