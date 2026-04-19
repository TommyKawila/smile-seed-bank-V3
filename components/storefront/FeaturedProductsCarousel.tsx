"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { resolveSectionHeading, type SectionTitle } from "@/lib/homepage-section-title";

function stripHtmlLoose(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function strainExcerpt(
  product: ProductWithBreeder,
  locale: "th" | "en",
  maxLen: number
): string {
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

function statsRefLine(product: ProductWithBreeder): string {
  const parts: string[] = [];
  if (product.thc_percent != null) parts.push(`THC ${product.thc_percent}%`);
  const cbd = product.cbd_percent?.trim();
  if (cbd) parts.push(`CBD ${cbd}`);
  const sp = (product as { sativa_percent?: number | null }).sativa_percent;
  const ip = (product as { indica_percent?: number | null }).indica_percent;
  if (sp != null && ip != null) parts.push(`S/I ${sp}/${ip}`);
  else {
    const gr = product.genetic_ratio?.trim();
    if (gr) parts.push(gr);
    else if (product.strain_dominance?.trim())
      parts.push(product.strain_dominance.trim());
  }
  return parts.join(" · ");
}

function FeatureGeneticsCard({
  product,
  variant,
}: {
  product: ProductWithBreeder;
  variant: "hero" | "compact";
}) {
  const { t, locale } = useLanguage();
  const img = getListingThumbnailUrl(product);
  const stats = statsRefLine(product);
  const excerpt =
    strainExcerpt(product, locale, variant === "hero" ? 160 : 110) ||
    t(
      "สายพันธุ์คัดสรรจากแบรนด์พันธมิตร — โปรไฟล์ครบถ้วนหน้าสินค้า",
      "Curated genetics — full profile on the strain page."
    );

  const isHero = variant === "hero";

  return (
    <Link
      href={productDetailHref(product)}
      className={cn(
        "group flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-zinc-50 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
      )}
    >
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden bg-zinc-100",
          isHero ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[4/3]"
        )}
      >
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes={
              isHero
                ? "(max-width: 1024px) 100vw, 58vw"
                : "(max-width: 1024px) 100vw, 20vw"
            }
            className="object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
            priority={isHero}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Leaf className="h-10 w-10 text-zinc-300" />
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isHero ? "p-6 sm:p-8" : "p-5 sm:p-6"
        )}
      >
        {product.breeders && (
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {product.breeders.name}
          </p>
        )}
        <h3
          className={cn(
            "font-[family-name:var(--font-journal-product-serif)] font-medium leading-snug tracking-tight text-zinc-900",
            isHero ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
          )}
        >
          {product.name}
        </h3>

        {stats ? (
          <p
            className={cn(
              "mt-2.5 font-[family-name:var(--font-journal-product-mono)] text-[11px] leading-relaxed text-zinc-600 sm:text-xs",
              "tabular-nums"
            )}
          >
            {stats}
          </p>
        ) : null}

        <p
          className={cn(
            "mt-3 flex-1 text-sm font-light leading-relaxed text-zinc-600",
            isHero ? "line-clamp-5" : "line-clamp-3 min-h-[4.125rem]"
          )}
        >
          {excerpt}
        </p>

        <span
          className={cn(
            "mt-5 inline-flex w-fit items-center justify-center rounded-sm border border-emerald-800 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-emerald-800 transition-colors group-hover:bg-emerald-50"
          )}
        >
          {t("สำรวจสายพันธุ์", "Explore strain")}
        </span>
      </div>
    </Link>
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
        <div
          className={`mx-auto max-w-7xl px-4 sm:px-6 ${JOURNAL_PRODUCT_FONT_VARS}`}
        >
          <div className="mb-10 space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
            <h2 className="font-[family-name:var(--font-journal-product-serif)] text-2xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-3xl md:text-[1.75rem]">
              {mainHeading}
            </h2>
            <div className="h-4 max-w-lg animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div className="lg:min-h-[28rem] lg:flex-[1.65]">
              <div className="aspect-[16/10] animate-pulse rounded-sm bg-zinc-100" />
              <div className="mt-4 space-y-2 p-1">
                <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-100" />
                <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid lg:max-w-md lg:grid-rows-2 lg:gap-4">
              <div className="flex min-h-[240px] flex-col overflow-hidden rounded-sm border border-zinc-50">
                <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
                <div className="flex-1 space-y-2 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                </div>
              </div>
              <div className="flex min-h-[240px] flex-col overflow-hidden rounded-sm border border-zinc-50">
                <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
                <div className="flex-1 space-y-2 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  const [hero, ...rest] = products;
  const side = rest.slice(0, 2);
  const more = rest.slice(2);

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
          <h2 className="font-[family-name:var(--font-journal-product-serif)] text-2xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-3xl md:text-[1.75rem]">
            {mainHeading}
          </h2>
          <p className="text-sm font-light leading-relaxed text-zinc-600">
            {t(
              "คัดเลือกอย่างมีหลักการ — เน้นความชัดเจนของโปรไฟล์และความโปร่งใสทางวิทยาศาสตร์",
              "Editorial picks with clear lab-style labeling—depth lives on each strain profile."
            )}
          </p>
        </motion.header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
          <motion.div
            className="flex min-h-0 min-w-0 flex-1 flex-col lg:max-w-none lg:flex-[1.65]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.45 }}
          >
            <FeatureGeneticsCard product={hero} variant="hero" />
          </motion.div>

          {side.length > 0 && (
            <div className="flex min-h-0 w-full min-w-0 flex-col gap-4 lg:flex-1 lg:max-w-md lg:self-stretch">
              {side.map((p, i) => (
                <motion.div
                  key={p.id}
                  className="flex min-h-0 flex-1 basis-0 flex-col"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.4, delay: 0.06 * (i + 1) }}
                >
                  <FeatureGeneticsCard product={p} variant="compact" />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {more.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: 0.04 * i }}
              >
                <FeatureGeneticsCard product={p} variant="compact" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
