"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import { plainTextFromHtml, truncateMetaDescription } from "@/lib/magazine-seo";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const mono = "font-[family-name:var(--font-journal-product-mono)]";
const AUTOPLAY_MS = 5500;

function productNote(product: ProductWithBreeder, isEn: boolean): string {
  const raw = isEn
    ? (product.description_en ?? product.description_th ?? "")
    : (product.description_th ?? product.description_en ?? "");
  const plain = plainTextFromHtml(String(raw));
  return truncateMetaDescription(plain, 220);
}

type TFn = (th: string, en: string) => string;

function VaultHeroSlide({
  product,
  isEn,
  t,
  priorityImage,
}: {
  product: ProductWithBreeder;
  isEn: boolean;
  t: TFn;
  priorityImage: boolean;
}) {
  const img = getListingThumbnailUrl(product);
  const note = productNote(product, isEn);
  const thc = product.thc_percent;
  const cbd = product.cbd_percent;
  const yieldInfo = product.yield_info?.trim();

  return (
    <div className="min-w-0 px-0">
      <div className="grid gap-8 md:grid-cols-2 md:items-stretch md:gap-10 lg:gap-12">
        <Link
          href={productDetailHref(product)}
          className="group relative block min-h-[220px] overflow-hidden rounded-sm border border-zinc-100 bg-zinc-50 shadow-sm md:min-h-[320px]"
        >
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priorityImage}
            />
          ) : (
            <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
          )}
        </Link>

        <div className="flex min-w-0 flex-col justify-center font-sans">
          <p className={cn(mono, "text-[10px] font-medium uppercase tracking-[0.28em] text-zinc-500")}>
            {t("สายพันธุ์เด่น", "FEATURED_STRAIN")}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl md:text-[2.35rem]">
            <Link href={productDetailHref(product)} className="hover:text-primary">
              {product.name}
            </Link>
          </h2>

          {product.breeders && (
            <p className={cn(mono, "mt-2 text-[11px] font-normal tabular-nums text-zinc-500")}>
              {product.breeders.name}
            </p>
          )}

          <dl
            className={cn(
              mono,
              "mt-5 grid max-w-md grid-cols-3 gap-3 border-y border-zinc-100 py-4 text-[11px] uppercase tracking-wide text-zinc-600"
            )}
          >
            <div>
              <dt className="text-[9px] tracking-[0.2em] text-zinc-400">THC</dt>
              <dd className="mt-1 tabular-nums">{thc != null ? `${thc}%` : "—"}</dd>
            </div>
            <div>
              <dt className="text-[9px] tracking-[0.2em] text-zinc-400">CBD</dt>
              <dd className="mt-1 tabular-nums">{cbd != null && cbd !== "" ? String(cbd) : "—"}</dd>
            </div>
            <div>
              <dt className="text-[9px] tracking-[0.2em] text-zinc-400">
                {t("ผลผลิต", "YIELD")}
              </dt>
              <dd className="mt-1 line-clamp-2 text-[10px] font-normal normal-case leading-snug tracking-normal text-zinc-700">
                {yieldInfo || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className={cn(mono, "text-[9px] font-medium uppercase tracking-[0.22em] text-zinc-400")}>
              {t("บันทึกจากผู้ผลิต", "BREEDER'S_NOTE")}
            </p>
            <p className="mt-2 max-w-xl text-sm font-normal leading-relaxed text-zinc-600">
              {note || t("รายละเอียดกำลังจัดเตรียม", "Archive entry in preparation.")}
            </p>
          </div>

          <Link
            href={productDetailHref(product)}
            className={cn(
              mono,
              "mt-6 inline-flex w-fit items-center text-xs font-medium tabular-nums text-primary underline-offset-4 hover:underline"
            )}
          >
            {t("เปิดรายงานสายพันธุ์", "Open strain dossier")} →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ShopGeneticVaultHero({
  products,
  isEn,
  t,
}: {
  products: ProductWithBreeder[];
  isEn: boolean;
  t: TFn;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: products.length > 1,
    align: "start",
    duration: 22,
  });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("reInit", onSelect);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || products.length <= 1) return;
    if (paused) return;
    const id = window.setInterval(() => {
      emblaApi.scrollNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [emblaApi, paused, products.length]);

  const n = products.length;

  return (
    <div
      className={cn(
        "border-b border-zinc-100 bg-white px-4 py-10 sm:px-6 sm:py-12",
        JOURNAL_PRODUCT_FONT_VARS
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t("สายพันธุ์เด่น", "Featured strains")}
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {products.map((product, i) => (
              <div className="min-w-0 flex-[0_0_100%] px-0" key={product.id}>
                <VaultHeroSlide
                  product={product}
                  isEn={isEn}
                  t={t}
                  priorityImage={i === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              aria-label={t("สไลด์ก่อนหน้า", "Previous slide")}
              className="absolute left-0 top-[min(40%,12rem)] z-10 flex h-10 w-10 -translate-x-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white/95 text-zinc-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary md:-translate-x-1"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label={t("สไลด์ถัดไป", "Next slide")}
              className="absolute right-0 top-[min(40%,12rem)] z-10 flex h-10 w-10 translate-x-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white/95 text-zinc-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary md:translate-x-1"
              onClick={scrollNext}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </>
        )}

        {n > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {products.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={t(`ไปสไลด์ ${i + 1}`, `Go to slide ${i + 1}`)}
                aria-current={i === selected ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === selected ? "w-6 bg-primary" : "w-2 bg-zinc-300 hover:bg-zinc-400"
                )}
                onClick={() => emblaApi?.scrollTo(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
