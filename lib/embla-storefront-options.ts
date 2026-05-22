import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";

/** Defer reInit out of ResizeObserver callback (Embla #1321 — avoids forced reflow). */
export function emblaDeferredWatchResize(emblaApi: EmblaCarouselType): false {
  requestAnimationFrame(() => {
    emblaApi.reInit();
  });
  return false;
}

export const EMBLA_STOREFRONT_PERF_OPTIONS: EmblaOptionsType = {
  watchSlides: false,
  watchResize: emblaDeferredWatchResize,
};

export function emblaStorefrontOptions(overrides?: EmblaOptionsType): EmblaOptionsType {
  return { ...EMBLA_STOREFRONT_PERF_OPTIONS, ...overrides };
}
