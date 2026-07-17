"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { emblaStorefrontOptions } from "@/lib/embla-storefront-options";
import { VaultHeroSlide, type VaultHeroTFn } from "@/components/storefront/VaultHeroSlide";

const AUTOPLAY_MS = 5500;

export function FeaturedStrainHeroCarouselEmbla({
  products,
  isEn,
  t,
  className,
}: {
  products: ProductWithBreeder[];
  isEn: boolean;
  t: VaultHeroTFn;
  className?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    emblaStorefrontOptions({
      loop: products.length > 1,
      align: "start",
      duration: 22,
    })
  );
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
            <div className="min-w-0 shrink-0 grow-0 basis-full px-0" key={product.id}>
              <VaultHeroSlide product={product} isEn={isEn} t={t} priorityImage={i === 0} />
            </div>
          ))}
        </div>
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label={t("สไลด์ก่อนหน้า", "Previous Slide")}
            className="absolute left-0 top-[min(38%,11rem)] z-10 flex h-10 w-10 -translate-x-0 items-center justify-center rounded-full border border-border bg-white/95 text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary md:-translate-x-1"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label={t("สไลด์ถัดไป", "Next Slide")}
            className="absolute right-0 top-[min(38%,11rem)] z-10 flex h-10 w-10 translate-x-0 items-center justify-center rounded-full border border-border bg-white/95 text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary md:translate-x-1"
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
