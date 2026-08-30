"use client";

import Image from "next/image";
import Link from "next/link";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Tag from "lucide-react/dist/esm/icons/tag";
import { useLanguage } from "@/context/LanguageContext";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { cn, getLocalizedPath } from "@/lib/utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";

type IntentCardProps = {
  href: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  accentClass: string;
  borderClass: string;
  glowClass: string;
  Icon: typeof Sparkles;
  previewProduct?: ProductWithBreederAndVariants | null;
};

function IntentCard({
  href,
  eyebrow,
  title,
  subtitle,
  cta,
  accentClass,
  borderClass,
  glowClass,
  Icon,
  previewProduct,
}: IntentCardProps) {
  const thumb = previewProduct ? getListingThumbnailUrl(previewProduct) : null;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-12 min-w-[17rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-zinc-950/60 p-4 transition-transform duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.99] sm:min-w-0 sm:flex-1 sm:p-5",
        borderClass
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-70 transition-opacity group-hover:opacity-100",
          glowClass
        )}
        aria-hidden
      />
      <div className="relative z-10 flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80 sm:h-20 sm:w-20">
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              fill
              sizes="80px"
              quality={55}
              loading="lazy"
              className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
              unoptimized={shouldOffloadImageOptimization(thumb)}
            />
          ) : (
            <CatalogImagePlaceholder seed={href} className="absolute inset-0" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.2em]", accentClass)}>
            <Icon className="mr-1 inline h-3 w-3" aria-hidden />
            {eyebrow}
          </p>
          <p className="mt-1 font-sans text-lg font-semibold leading-tight text-zinc-100 sm:text-xl">
            {title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{subtitle}</p>
          <span
            className={cn(
              "mt-3 inline-flex min-h-12 items-center gap-1 text-sm font-semibold transition-transform motion-safe:group-hover:translate-x-0.5",
              accentClass
            )}
          >
            {cta}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

export type HomeShopIntentBannerProps = {
  newArrivals: ProductWithBreederAndVariants[];
  clearanceProducts: ProductWithBreederAndVariants[];
};

export function HomeShopIntentBanner({
  newArrivals,
  clearanceProducts,
}: HomeShopIntentBannerProps) {
  const { t, locale } = useLanguage();
  const hasNew = newArrivals.length > 0;
  const hasClearance = clearanceProducts.length > 0;
  if (!hasNew && !hasClearance) return null;

  return (
    <section className="border-b border-border/60 bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex flex-col gap-1 sm:mb-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">
            {t("ดีลพิเศษ", "Hot picks")}
          </p>
          <h2 className="font-sans text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
            {t("เมล็ดมาใหม่ & ลดราคา", "New arrivals & clearance")}
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {hasNew ? (
            <IntentCard
              href={getLocalizedPath("/new", locale)}
              eyebrow={t("มาใหม่", "NEW")}
              title={t("เมล็ดพันธุ์มาใหม่", "Fresh drops")}
              subtitle={t(
                "สายพันธุ์ล่าสุดที่เพิ่งเข้าคลัง — อัปเดตทุกสัปดาห์",
                "Latest strains just landed in the vault."
              )}
              cta={t("ดูเมล็ดมาใหม่", "Shop new seeds")}
              accentClass="text-violet-300"
              borderClass="border-violet-500/25 hover:border-violet-400/40"
              glowClass="bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,0.22),_transparent_60%)]"
              Icon={Sparkles}
              previewProduct={newArrivals[0] ?? null}
            />
          ) : null}
          {hasClearance ? (
            <IntentCard
              href={getLocalizedPath("/clearance", locale)}
              eyebrow={t("ลดราคา", "SALE")}
              title={t("คลังล้างสต็อก", "Clearance vault")}
              subtitle={t(
                "ดีลจำนวนจำกัด — ราคาเซลจริงจากสต็อกคงเหลือ",
                "Limited flash deals from remaining stock."
              )}
              cta={t("ดูเมล็ดลดราคา", "Shop clearance")}
              accentClass="text-orange-300"
              borderClass="border-orange-500/30 hover:border-orange-400/45"
              glowClass="bg-[radial-gradient(ellipse_at_top_left,_rgba(249,115,22,0.2),_transparent_60%)]"
              Icon={Tag}
              previewProduct={clearanceProducts[0] ?? null}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
