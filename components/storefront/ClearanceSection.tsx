"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import {
  computeStartingPrice,
  computeTotalStock,
  getClearancePercentOff,
  getEffectiveListingPrice,
  productDetailHref,
} from "@/lib/product-utils";
import { formatPrice } from "@/lib/utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { resolveSectionHeading, type SectionTitle } from "@/lib/homepage-section-title";

function ClearanceCard({ product }: { product: ProductWithBreederAndVariants }) {
  const { t } = useLanguage();
  const href = productDetailHref(product);
  const img = getListingThumbnailUrl(product);
  const pct = getClearancePercentOff(product);
  const regular = computeStartingPrice(product.product_variants);
  const sale = getEffectiveListingPrice(product);
  const totalStock = computeTotalStock(product.product_variants ?? []);

  return (
    <article
      className={`flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-lg ${JOURNAL_PRODUCT_FONT_VARS}`}
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-zinc-900">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 85vw, 280px"
            className="object-cover transition duration-500 hover:scale-[1.03]"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(img)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-900">
            <Leaf className="h-10 w-10 text-zinc-600" />
          </div>
        )}
        {pct != null && pct > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-bold tabular-nums text-white shadow-md">
            −{pct}%
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={href} className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-zinc-100 hover:text-emerald-400">
          {product.name}
        </Link>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-zinc-800 pt-2">
          {regular > sale && (
            <span className="text-xs tabular-nums text-zinc-500 line-through">{formatPrice(regular)}</span>
          )}
          <span className="text-base font-bold tabular-nums text-emerald-400">{formatPrice(sale)}</span>
        </div>
        {totalStock > 0 && totalStock < 10 && (
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-400/90">
            {t("สต็อกจำกัด", "Limited stock")}
          </p>
        )}
      </div>
    </article>
  );
}

export function ClearanceSection({
  products,
  isLoading,
  sectionTitle,
}: {
  products: ProductWithBreederAndVariants[];
  isLoading: boolean;
  sectionTitle?: SectionTitle;
}) {
  const { t, locale } = useLanguage();
  const heading = resolveSectionHeading(
    locale,
    sectionTitle,
    "คลังล้างสต็อก",
    "Clearance Vault"
  );
  const sub = resolveSectionHeading(
    locale,
    sectionTitle,
    "ดีลพิเศษจำนวนจำกัด — ราคาเซลจริง",
    "Limited flash deals — real clearance pricing."
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className={`border-b border-zinc-800 bg-zinc-950 py-12 text-zinc-100 sm:py-16 ${JOURNAL_PRODUCT_FONT_VARS}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-500/90">
              {t("ล้างสต็อก", "CLEARANCE")}
            </p>
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-white sm:text-3xl">{heading}</h2>
            <p className="text-sm font-light text-zinc-400">{sub}</p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 self-start border-emerald-500/40 bg-zinc-900 text-emerald-300 hover:bg-zinc-800 hover:text-emerald-200 sm:self-end"
          >
            <Link href="/shop">
              {t("ดูสินค้าทั้งหมด", "Browse shop")}
              <ChevronRight className="ml-0.5 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-zinc-900" />
            ))}
          </div>
        ) : (
          <>
            <div className="md:hidden">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-3 pr-1">
                  {products.map((p) => (
                    <div key={p.id} className="min-w-0 shrink-0 basis-[85%] sm:basis-[70%]">
                      <ClearanceCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
              {(canPrev || canNext) && (
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    aria-label={t("ก่อนหน้า", "Previous")}
                    disabled={!canPrev}
                    onClick={() => emblaApi?.scrollPrev()}
                    className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label={t("ถัดไป", "Next")}
                    disabled={!canNext}
                    onClick={() => emblaApi?.scrollNext()}
                    className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
            <div className="hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ClearanceCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
