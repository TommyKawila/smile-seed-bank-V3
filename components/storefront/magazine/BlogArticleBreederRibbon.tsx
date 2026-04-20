"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BreederRibbon } from "@/components/storefront/BreederRibbon";

export function BlogArticleBreederRibbon({ headingId }: { headingId?: string }) {
  const { t } = useLanguage();
  return (
    <>
      <h2
        id={headingId}
        className="mb-10 text-left font-sans text-2xl font-medium tracking-tight text-zinc-900 sm:mb-12 sm:text-3xl md:text-[2rem]"
      >
        {t(
          "เลือกชมสายพันธุ์จาก Breeder ชั้นนำที่เราคัดสรร",
          "Explore Curated Genetics from Top Breeders"
        )}
      </h2>
      <BreederRibbon />
    </>
  );
}
