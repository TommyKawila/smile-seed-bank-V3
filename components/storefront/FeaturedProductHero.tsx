"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { FeaturedStrainHeroCarousel } from "@/components/storefront/ShopGeneticVaultHero";
import { resolveSectionHeading, type SectionTitle } from "@/lib/homepage-section-title";
import type { ProductWithBreeder } from "@/lib/supabase/types";

export function FeaturedProductHero({
  products,
  isLoading,
  sectionTitle,
}: {
  products: ProductWithBreeder[];
  isLoading?: boolean;
  sectionTitle?: SectionTitle;
}) {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";
  const mainHeading = resolveSectionHeading(
    locale,
    sectionTitle,
    "สายพันธุ์เด่น",
    "Featured strain"
  );

  if (isLoading) {
    return (
      <section className="border-b border-zinc-100 bg-zinc-50/50 py-10 font-sans sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 space-y-3 sm:mb-10">
            <div className="h-3 w-28 animate-pulse rounded bg-zinc-200/80" />
            <div className="h-8 max-w-md animate-pulse rounded bg-zinc-200/80 sm:h-9" />
            <div className="h-4 max-w-lg animate-pulse rounded bg-zinc-200/80" />
          </div>
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:gap-10">
            <div className="min-h-[200px] animate-pulse rounded-sm border border-zinc-100 bg-zinc-100 sm:min-h-[280px]" />
            <div className="flex flex-col justify-center space-y-4 py-2">
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-200/80" />
              <div className="h-10 w-4/5 animate-pulse rounded bg-zinc-200/80" />
              <div className="grid grid-cols-3 gap-2 border-y border-zinc-100 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-2 w-8 animate-pulse rounded bg-zinc-200/80" />
                    <div className="h-6 animate-pulse rounded bg-zinc-200/80" />
                  </div>
                ))}
              </div>
              <div className="h-16 animate-pulse rounded bg-zinc-200/80" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="border-b border-zinc-100 bg-zinc-50/50 py-10 font-sans sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.header
          className="mb-8 max-w-3xl space-y-2 sm:mb-10 sm:space-y-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
        >
          <p className="font-sans text-xs font-semibold tracking-wide text-emerald-800">
            {t("สายพันธุ์คัดพิเศษ", "Curated selections")}
          </p>
          <h2 className="font-sans text-2xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-3xl md:text-[1.85rem]">
            {mainHeading}
          </h2>
          <p className="font-sans text-sm leading-relaxed text-zinc-600">
            {t(
              "คัดเลือกอย่างมีหลักการ — เน้นความชัดเจนของโปรไฟล์และความโปร่งใสทางวิทยาศาสตร์",
              "Editorial picks with clear lab-style labeling—depth lives on each strain profile."
            )}
          </p>
        </motion.header>

        <FeaturedStrainHeroCarousel products={products} isEn={isEn} t={t} />
      </div>
    </section>
  );
}
