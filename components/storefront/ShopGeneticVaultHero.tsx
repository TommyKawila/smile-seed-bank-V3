"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import { plainTextFromHtml, truncateMetaDescription } from "@/lib/magazine-seo";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";

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

  const statValClass =
    "mt-1 font-sans text-sm font-semibold tabular-nums leading-snug text-emerald-700 sm:text-base md:text-lg";

  return (
    <div className="min-w-0 px-0">
      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:items-stretch md:gap-10 lg:gap-12">
        <Link
          href={productDetailHref(product)}
          className="group relative order-1 block min-h-[200px] overflow-hidden rounded-sm border border-zinc-100 bg-zinc-50 shadow-sm sm:min-h-[240px] md:min-h-[320px]"
        >
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priorityImage}
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR_DATA_URL}
              unoptimized={shouldOffloadImageOptimization(img)}
            />
          ) : (
            <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
          )}
        </Link>

        <div className="order-2 flex min-w-0 flex-col justify-center font-sans">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 sm:text-[11px]">
            {t("สายพันธุ์เด่น", "FEATURED_STRAIN")}
          </p>
          <h2 className="mt-2 font-sans text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:mt-3 sm:text-3xl md:text-[2.35rem]">
            <Link href={productDetailHref(product)} className="hover:text-primary">
              {product.name}
            </Link>
          </h2>

          {product.breeders && (
            <p className="mt-2 font-sans text-[11px] font-normal tabular-nums text-zinc-500 sm:text-xs">
              {product.breeders.name}
            </p>
          )}

          <dl className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 border-y border-zinc-100 sm:mt-5">
            <div className="min-w-0 py-3 pr-2 sm:py-4 sm:pr-3">
              <dt className="font-sans text-[8px] font-medium uppercase tracking-[0.18em] text-zinc-500 sm:text-[9px] sm:tracking-[0.2em]">
                THC
              </dt>
              <dd className={statValClass}>{thc != null ? `${thc}%` : "—"}</dd>
            </div>
            <div className="min-w-0 px-2 py-3 sm:px-3 sm:py-4">
              <dt className="font-sans text-[8px] font-medium uppercase tracking-[0.18em] text-zinc-500 sm:text-[9px] sm:tracking-[0.2em]">
                CBD
              </dt>
              <dd className={statValClass}>
                {cbd != null && cbd !== "" ? String(cbd) : "—"}
              </dd>
            </div>
            <div className="min-w-0 py-3 pl-2 sm:py-4 sm:pl-3">
              <dt className="font-sans text-[8px] font-medium uppercase tracking-[0.18em] text-zinc-500 sm:text-[9px] sm:tracking-[0.2em]">
                {t("ผลผลิต", "YIELD")}
              </dt>
              <dd
                className={cn(
                  statValClass,
                  "line-clamp-2 normal-case tracking-normal"
                )}
              >
                {yieldInfo || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 sm:mt-6">
            <p className="font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-400 sm:text-[10px]">
              {t("บันทึกจากผู้ผลิต", "BREEDER'S_NOTE")}
            </p>
            <p className="mt-2 max-w-xl font-sans text-sm font-normal leading-relaxed text-zinc-600">
              {note || t("รายละเอียดกำลังจัดเตรียม", "Archive entry in preparation.")}
            </p>
          </div>

          <Link
            href={productDetailHref(product)}
            className="mt-5 inline-flex w-fit items-center font-sans text-xs font-semibold tabular-nums text-primary underline-offset-4 hover:underline sm:mt-6"
          >
            {t("เปิดรายงานสายพันธุ์", "Open strain dossier")} →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function FeaturedStrainHeroCarousel({
  products,
  isEn,
  t,
  className,
}: {
  products: ProductWithBreeder[];
  isEn: boolean;
  t: TFn;
  className?: string;
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
      className={cn("relative font-sans", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t("สายพันธุ์เด่น", "Featured strains")}
    >
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
            className="absolute left-0 top-[min(38%,11rem)] z-10 flex h-10 w-10 -translate-x-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white/95 text-zinc-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary md:-translate-x-1"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label={t("สไลด์ถัดไป", "Next slide")}
            className="absolute right-0 top-[min(38%,11rem)] z-10 flex h-10 w-10 translate-x-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white/95 text-zinc-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary md:translate-x-1"
            onClick={scrollNext}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </>
      )}

      {n > 1 && (
        <div className="mt-5 flex justify-center gap-2 sm:mt-6">
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
  return (
    <div className="border-b border-zinc-100 bg-white px-4 py-10 font-sans sm:px-6 sm:py-12">
      <div className="relative mx-auto max-w-7xl">
        <FeaturedStrainHeroCarousel products={products} isEn={isEn} t={t} />
      </div>
    </div>
  );
}
