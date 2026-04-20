"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { resolveSectionHeading, type SectionTitle } from "@/lib/homepage-section-title";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";

function stripHtmlLoose(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Plain text for excerpt; prefers tagline then locale description (HTML stripped). */
function productExcerptPlain(product: ProductWithBreeder, locale: "th" | "en", maxLen: number): string {
  const primary = locale === "th" ? product.description_th : product.description_en;
  const fallback = locale === "th" ? product.description_en : product.description_th;
  const tag = product.featured_tagline?.trim();
  if (tag) {
    const plain = stripHtmlLoose(tag);
    if (plain.length <= maxLen) return plain;
    return plain.length > maxLen ? `${plain.slice(0, maxLen - 1)}…` : plain;
  }
  const raw = (primary?.trim() ? primary : fallback) ?? "";
  if (!raw.trim()) return "";
  const plain = stripHtmlLoose(raw);
  if (!plain) return "";
  return plain.length > maxLen ? `${plain.slice(0, maxLen - 1)}…` : plain;
}

function FeaturedProductInsightCard({
  product,
  priority,
}: {
  product: ProductWithBreeder;
  priority?: boolean;
}) {
  const { t, locale } = useLanguage();
  const href = productDetailHref(product);
  const img = getListingThumbnailUrl(product);
  const excerpt =
    productExcerptPlain(product, locale, 220) ||
    t(
      "สายพันธุ์คัดสรรจากแบรนด์พันธมิตร — ดูรายละเอียดเต็มหน้าสินค้า",
      "Curated genetics — open the strain page for the full profile."
    );

  return (
    <article
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-[#f3f4f6] bg-white shadow-sm transition hover:shadow-lg"
      )}
    >
      <Link href={href} className="relative block aspect-video overflow-hidden bg-zinc-100">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 20vw"
            className="object-cover transition duration-500 hover:scale-[1.02]"
            priority={priority}
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={!img.includes("supabase.co")}
          />
        ) : (
          <div className="flex h-full min-h-[8rem] items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
            <Leaf className="h-10 w-10 text-zinc-300" />
          </div>
        )}
      </Link>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        {product.breeders?.name ? (
          <span className="mb-2 inline-flex w-fit max-w-full items-center rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 line-clamp-1">
            {product.breeders.name}
          </span>
        ) : null}
        <h3 className="font-sans line-clamp-1 text-lg font-bold leading-snug text-zinc-900">
          <Link href={href} className="hover:text-emerald-900">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 min-h-0 flex-1 text-sm text-zinc-600">{excerpt}</p>
        <Button
          asChild
          className="mt-4 h-10 w-full shrink-0 rounded-sm bg-emerald-800 font-semibold text-white shadow-none hover:bg-emerald-900"
        >
          <Link href={href}>{t("ดูรายละเอียด", "View details")}</Link>
        </Button>
      </div>
    </article>
  );
}

export function FeaturedProductsCarousel({
  products,
  isLoading,
  sectionTitle,
}: {
  products: ProductWithBreeder[];
  isLoading?: boolean;
  sectionTitle?: SectionTitle;
}) {
  const { t, locale } = useLanguage();
  const mainHeading = resolveSectionHeading(
    locale,
    sectionTitle,
    "สายพันธุ์แนะนำ",
    "Recommended strains"
  );

  if (isLoading) {
    return (
      <section className="border-b border-zinc-100 bg-white py-12 sm:py-16">
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}>
          <div className="mb-10 space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
            <h2 className="font-sans text-2xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-3xl md:text-[1.75rem]">
              {mainHeading}
            </h2>
            <div className="h-4 max-w-lg animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-sm border border-[#f3f4f6] bg-white shadow-sm"
              >
                <div className="aspect-video animate-pulse bg-zinc-100" />
                <div className="space-y-3 p-5">
                  <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-100" />
                  <div className="h-5 w-4/5 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                  <div className="mt-2 h-10 w-full animate-pulse rounded bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="border-b border-zinc-100 bg-white py-12 sm:py-16">
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}>
        <motion.header
          className="mb-10 max-w-3xl space-y-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-xs font-medium tracking-wide text-emerald-800">
            {t("สายพันธุ์คัดพิเศษ", "Curated selections")}
          </p>
          <h2 className="font-sans text-2xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-3xl md:text-[1.75rem]">
            {mainHeading}
          </h2>
          <p className="text-sm font-light leading-relaxed text-zinc-600">
            {t(
              "คัดเลือกอย่างมีหลักการ — เน้นความชัดเจนของโปรไฟล์และความโปร่งใสทางวิทยาศาสตร์",
              "Editorial picks with clear lab-style labeling—depth lives on each strain profile."
            )}
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              className="min-w-0"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.4, delay: Math.min(0.05 * i, 0.35) }}
            >
              <FeaturedProductInsightCard product={p} priority={i === 0} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
