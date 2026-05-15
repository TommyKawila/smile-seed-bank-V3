"use client";

/**
 * Below-fold home sections (code-split from `HomePageClient` for smaller initial JS).
 */

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, type Variants } from "framer-motion";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import QuickCategoryNav from "@/components/storefront/QuickCategoryNav";
import type { ProductWithBreeder, ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { HomeNewsletterSection } from "@/components/storefront/HomeNewsletterSection";
import { ProductCard } from "@/components/storefront/ProductCard";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { MagazinePostPublic } from "@/lib/blog-service";
import {
  resolveSectionHeading,
  type SectionTitle,
} from "@/lib/homepage-section-title";
import type { HomePageSectionPayload } from "@/lib/homepage-sections";
import { HOME_NEW_ARRIVALS_LIMIT } from "@/lib/constants";

const FeaturedProductHero = dynamic(
  () =>
    import("@/components/storefront/FeaturedProductHero").then((m) => ({
      default: m.FeaturedProductHero,
    })),
  { ssr: false }
);

const BreederShowcase = dynamic(() => import("@/components/storefront/BreederShowcase"), {
  ssr: false,
});

const ClearanceSection = dynamic(
  () =>
    import("@/components/storefront/ClearanceSection").then((m) => ({
      default: m.ClearanceSection,
    })),
  { ssr: false }
);

const BreederRibbon = dynamic(
  () =>
    import("@/components/storefront/BreederRibbon").then((m) => ({
      default: m.BreederRibbon,
    })),
  { ssr: false }
);

const HomeInsightSection = dynamic(
  () =>
    import("@/components/storefront/HomeInsightSection").then((m) => ({
      default: m.HomeInsightSection,
    })),
  { ssr: false }
);

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export type HomePageBelowFoldProps = {
  sections: HomePageSectionPayload[];
  newArrivals: ProductWithBreederAndVariants[];
  newArrivalsLoading: boolean;
  featuredProducts: ProductWithBreeder[];
  featuredLoading: boolean;
  insights: MagazinePostPublic[];
  insightsLoading: boolean;
  clearanceProducts: ProductWithBreederAndVariants[];
  clearanceLoading: boolean;
};

export function HomePageBelowFold({
  sections,
  newArrivals,
  newArrivalsLoading,
  featuredProducts,
  featuredLoading,
  insights,
  insightsLoading,
  clearanceProducts,
  clearanceLoading,
}: HomePageBelowFoldProps) {
  const { t, locale } = useLanguage();

  const features = [
    {
      label: t("คัดสรรคุณภาพ", "Quality Seeds"),
      sub: t("ผ่านการตรวจสอบทุกล็อต", "Every batch tested & verified"),
    },
    {
      label: t("จัดส่งรวดเร็ว", "Fast Shipping"),
      sub: t("แพ็กเกจมิดชิด ปลอดภัย", "Discreet & secure packaging"),
    },
    {
      label: t("สายพันธุ์หายาก", "Rare Strains"),
      sub: t("นำเข้าจาก Breeder ชั้นนำ", "Imported from top breeders"),
    },
  ];

  const sectionTitle = (s: HomePageSectionPayload): SectionTitle => ({
    th: s.label_th,
    en: s.label_en,
  });

  const hasNewArrivals = newArrivals.length > 0;

  const renderSection = (section: HomePageSectionPayload): ReactNode => {
    const st = sectionTitle(section);
    const sk = section.key;
    switch (section.key) {
      case "hero":
      case "promotion_banner":
        return null;
      case "new_strains": {
        const arrivalsHeading = resolveSectionHeading(
          locale,
          st,
          "สายพันธุ์มาใหม่",
          "New Arrivals"
        );
        return (
          <section
            key={sk}
            className={`mx-auto min-h-[400px] max-w-7xl px-4 py-14 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}
          >
            <motion.div
              initial={false}
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
            >
              <motion.div
                variants={cardVariant}
                className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
              >
                <div className="max-w-2xl space-y-2">
                  <p className="font-[family-name:var(--font-journal-product-mono)] text-[11px] font-medium uppercase tracking-widest text-emerald-800">
                    NEW ARRIVALS
                  </p>
                  <h2 className="font-sans text-2xl font-medium leading-tight tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
                    {arrivalsHeading}
                  </h2>
                  <p className="text-sm font-light leading-relaxed text-zinc-600">
                    {t(
                      "สายพันธุ์ใหม่ล่าสุดในคลัง — อัปเดตตามการคัดเลือกอย่างต่อเนื่อง",
                      "Latest genetic entries in the Smile Seed Bank archive—refreshed as new strains land."
                    )}
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="min-h-11 shrink-0 self-start px-3 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 sm:self-end"
                >
                  <Link href="/shop?category=Seeds">
                    {t("ไปที่คลังเมล็ดพันธุ์", "Seed vault")}{" "}
                    <ChevronRight className="ml-0.5 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>

              {newArrivalsLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                    >
                      <div className="aspect-square animate-pulse bg-zinc-100" />
                      <div className="space-y-2 px-2.5 pb-2.5 pt-2">
                        <div className="mx-auto h-6 w-28 animate-pulse rounded-full bg-zinc-100" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
                        <div className="h-4 animate-pulse rounded bg-zinc-100" />
                        <div className="flex justify-between pt-2">
                          <div className="h-5 w-16 animate-pulse rounded bg-zinc-100" />
                          <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-100" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasNewArrivals ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {newArrivals.slice(0, HOME_NEW_ARRIVALS_LIMIT).map((product) => (
                    <div key={product.id} className="flex h-full min-h-0 min-w-0 flex-col">
                      <ProductCard product={product} variant="showcase" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                  {t("ยังไม่มีสินค้าใหม่ในช่วงนี้", "No new arrivals yet.")}
                </p>
              )}
            </motion.div>
          </section>
        );
      }
      case "categories":
        return (
          <div key={sk} className="bg-white pb-6 sm:pb-8">
            <QuickCategoryNav sectionTitle={st} />
          </div>
        );
      case "breeder_showcase":
        return (
          <div key={sk} className="bg-white pb-6 sm:pb-10">
            <BreederShowcase sectionTitle={st} />
          </div>
        );
      case "clearance":
        return (
          <ClearanceSection
            key={sk}
            products={clearanceProducts}
            isLoading={clearanceLoading}
            sectionTitle={st}
          />
        );
      case "blog":
        return (
          <HomeInsightSection
            key={sk}
            posts={insights}
            loading={insightsLoading}
            sectionTitle={st}
          />
        );
      case "featured":
        return (
          <FeaturedProductHero
            key={sk}
            products={featuredProducts}
            isLoading={featuredLoading}
            sectionTitle={st}
          />
        );
      case "breeders": {
        const breederMain = resolveSectionHeading(
          locale,
          st,
          "เลือกเมล็ดพันธุ์จากบรีดเดอร์ชั้นนำ",
          "Choose seeds from leading breeders"
        );
        return (
          <section key={sk} className="border-b border-zinc-100 bg-white py-12 sm:py-16">
            <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <span className="mb-2 inline-flex items-center rounded-full border border-zinc-100 bg-zinc-50/50 px-3 py-1 font-[family-name:var(--font-journal-product-mono)] text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                    {t("แบรนด์ชั้นนำ", "World-Class Breeders")}
                  </span>
                  <h2 className="font-sans text-2xl font-medium leading-tight tracking-tight text-zinc-900 sm:text-3xl">
                    {breederMain}
                  </h2>
                </div>
                <Link
                  href="/breeders"
                  className="hidden min-h-[44px] items-center gap-1 px-2 text-sm font-semibold text-emerald-800 hover:underline sm:flex"
                >
                  {t("ดูทั้งหมด", "View All")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <BreederRibbon />
              <div className="mt-6 flex justify-center sm:hidden">
                <Link href="/breeders" className="inline-flex min-h-11 min-w-[44px] items-center justify-center">
                  <Button variant="outline" size="sm" className="min-h-11 gap-1.5 border-emerald-200 text-emerald-900 hover:bg-emerald-50">
                    {t("ดู Breeder ทั้งหมด", "View All Breeders")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        );
      }
      case "trust": {
        return (
          <section key={sk} className="border-t border-b border-zinc-100 bg-zinc-50/30 py-12 sm:py-16">
            <div className={`mx-auto max-w-5xl px-4 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}>
              <div className="grid grid-cols-1 divide-y divide-zinc-100 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {features.map((f) => (
                  <div key={f.label} className="px-6 py-7 sm:py-9">
                    <p className="font-sans text-base font-medium text-zinc-800">{f.label}</p>
                    <p className="mt-1.5 font-[family-name:var(--font-journal-product-mono)] text-xs font-normal leading-relaxed text-zinc-600">
                      {f.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }
      case "newsletter": {
        return <HomeNewsletterSection key={sk} />;
      }
      default:
        return null;
    }
  };

  return (
    <>
      {sections.map((section) => (
        <Fragment key={section.key}>{renderSection(section)}</Fragment>
      ))}
    </>
  );
}
