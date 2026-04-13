"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { useLanguage } from "@/context/LanguageContext";

function strainLine(product: ProductWithBreeder): string {
  const sp = (product as { sativa_percent?: number | null }).sativa_percent;
  const ip = (product as { indica_percent?: number | null }).indica_percent;
  if (sp != null && ip != null) return `Sativa ${sp}% / Indica ${ip}%`;
  const gr = product.genetic_ratio?.trim();
  if (gr) return gr;
  return product.strain_dominance?.trim() ?? "";
}

function stripHtmlLoose(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function descriptionTeaser(product: ProductWithBreeder, locale: "th" | "en"): string {
  const primary = locale === "th" ? product.description_th : product.description_en;
  const fallback = locale === "th" ? product.description_en : product.description_th;
  const raw = (primary?.trim() ? primary : fallback) ?? "";
  if (!raw.trim()) return "";
  const plain = stripHtmlLoose(raw);
  if (!plain) return "";
  return plain.length > 180 ? `${plain.slice(0, 177)}…` : plain;
}

function featuredCardHighlight(
  product: ProductWithBreeder,
  locale: "th" | "en"
): string {
  const tag = product.featured_tagline?.trim();
  if (tag) return tag;
  return descriptionTeaser(product, locale);
}

export function FeaturedProductsCarousel({
  products,
  isLoading,
}: {
  products: ProductWithBreeder[];
  isLoading?: boolean;
}) {
  const { t, locale } = useLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: products.length > 1,
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const syncCarouselUi = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    syncCarouselUi();
    emblaApi.on("reInit", syncCarouselUi);
    emblaApi.on("select", syncCarouselUi);
    return () => {
      emblaApi.off("reInit", syncCarouselUi);
      emblaApi.off("select", syncCarouselUi);
    };
  }, [emblaApi, syncCarouselUi]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, products]);

  if (isLoading) {
    return (
      <section className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50/90 to-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 h-8 w-48 animate-pulse rounded-lg bg-zinc-100" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="min-w-0 shrink-0 flex-[0_0_88%] sm:flex-[0_0_46%] lg:flex-[0_0_31%]"
              >
                <div className="aspect-[4/5] animate-pulse rounded-2xl bg-zinc-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="border-b border-zinc-100 bg-gradient-to-b from-zinc-50/90 to-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("คัดพิเศษ", "Featured")}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              {t("สินค้าแนะนำ", "Featured picks")}
            </h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-zinc-200 shadow-sm"
              disabled={!canPrev}
              onClick={() => emblaApi?.scrollPrev()}
              aria-label={t("ก่อนหน้า", "Previous")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-zinc-200 shadow-sm"
              disabled={!canNext}
              onClick={() => emblaApi?.scrollNext()}
              aria-label={t("ถัดไป", "Next")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden [-webkit-tap-highlight-color:transparent]" ref={emblaRef}>
          <div className="flex touch-pan-y items-center py-5">
            {products.map((product, slideIndex) => {
              const img = getListingThumbnailUrl(product);
              const line = strainLine(product);
              const customTagline = product.featured_tagline?.trim();
              const highlight = featuredCardHighlight(product, locale);
              const isActive = slideIndex === selectedIndex;
              const taglineClass =
                "line-clamp-3 text-left text-xs font-medium leading-snug text-emerald-50/95 drop-shadow-md sm:text-sm";
              return (
                <div
                  key={product.id}
                  className="relative min-w-0 shrink-0 pl-3 first:pl-0 sm:pl-4 flex-[0_0_88%] sm:flex-[0_0_46%] lg:flex-[0_0_31%]"
                >
                  {isActive ? (
                    <div
                      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[85%] w-[95%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-emerald-500/10 blur-3xl"
                      aria-hidden
                    />
                  ) : null}
                  <motion.div
                    className="group relative z-0 flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)]"
                    animate={{
                      scale: isActive ? 1.05 : 0.95,
                      opacity: isActive ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ transformOrigin: "center center" }}
                  >
                    <Link
                      href={productDetailHref(product)}
                      className="relative block aspect-[4/5] overflow-hidden bg-zinc-50"
                    >
                      {img ? (
                        <motion.div
                          className="absolute inset-0"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                        >
                          <Image
                            src={img}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 88vw, (max-width: 1024px) 46vw, 32vw"
                            className="object-cover"
                          />
                        </motion.div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Leaf className="h-12 w-12 text-zinc-200" />
                        </div>
                      )}
                      {highlight ? (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-14">
                          {customTagline ? (
                            <motion.p
                              className={taglineClass}
                              style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.5)" }}
                              initial={{ opacity: 0, y: 15 }}
                              animate={
                                isActive
                                  ? {
                                      opacity: 1,
                                      y: 0,
                                      transition: {
                                        delay: 0.3,
                                        duration: 0.5,
                                        ease: "easeOut",
                                      },
                                    }
                                  : { opacity: 0, y: 15, transition: { duration: 0.2 } }
                              }
                            >
                              {highlight}
                            </motion.p>
                          ) : (
                            <p
                              className={taglineClass}
                              style={{ textShadow: "0 1px 2px rgb(0 0 0 / 0.5)" }}
                            >
                              {highlight}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </Link>
                    <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-zinc-900">
                        {product.name}
                      </h3>
                      {line ? (
                        <p className="line-clamp-2 text-xs text-zinc-500">{line}</p>
                      ) : null}
                      <div className="mt-auto pt-2">
                        <Button
                          asChild
                          className="w-full bg-primary font-semibold text-white shadow-sm transition-transform duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
                        >
                          <Link href={productDetailHref(product)}>
                            {t("ดูสินค้า", "View product")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
