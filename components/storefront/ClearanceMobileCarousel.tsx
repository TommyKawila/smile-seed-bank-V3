"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { emblaStorefrontOptions } from "@/lib/embla-storefront-options";
import { ClearanceCard } from "@/components/storefront/ClearanceCard";

const CLEARANCE_SLIDE_CLASS = "min-w-0 shrink-0 grow-0 basis-[85%] sm:basis-[280px]";

export function ClearanceMobileCarousel({
  products,
  t,
}: {
  products: ProductWithBreederAndVariants[];
  t: (th: string, en: string) => string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    emblaStorefrontOptions({
      align: "start",
      dragFree: true,
      containScroll: "trimSnaps",
      watchResize: false,
    })
  );
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

  return (
    <>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 pr-1">
          {products.map((p) => (
            <div key={p.id} className={CLEARANCE_SLIDE_CLASS}>
              <ClearanceCard product={p} />
            </div>
          ))}
        </div>
      </div>
      {(canPrev || canNext) && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            aria-label={t("สไลด์ก่อนหน้า", "Previous Slide")}
            disabled={!canPrev}
            onClick={() => emblaApi?.scrollPrev()}
            className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={t("สไลด์ถัดไป", "Next Slide")}
            disabled={!canNext}
            onClick={() => emblaApi?.scrollNext()}
            className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
