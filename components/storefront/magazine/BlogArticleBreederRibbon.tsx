"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BreederRibbon } from "@/components/storefront/BreederRibbon";

export function BlogArticleBreederRibbon({ headingId }: { headingId?: string }) {
  const { t } = useLanguage();
  return (
    <>
      <h2
        id={headingId}
        className="mb-8 text-center font-[family-name:var(--font-magazine-serif)] text-2xl font-semibold tracking-tight text-zinc-900 sm:mb-10 sm:text-3xl"
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
