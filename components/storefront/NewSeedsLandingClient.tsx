"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { saveCatalogReturnPath } from "@/lib/catalog-return-path";
import { fetchWithTimeout } from "@/lib/timeout";
import { NewSeedsBreederBoxCard } from "@/components/storefront/NewSeedsBreederBoxCard";
import { NewSeedsProductCard } from "@/components/storefront/NewSeedsProductCard";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { StorefrontNewSeedsBreederBox } from "@/lib/new-seeds";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { touchCatalogReturnFromWindow } from "@/lib/catalog-return-path";

export function NewSeedsLandingClient({
  boxes,
  breederSlug,
  breederName,
  breederLogoUrl = null,
  products,
}: {
  boxes: StorefrontNewSeedsBreederBox[];
  breederSlug: string | null;
  breederName: string | null;
  breederLogoUrl?: string | null;
  products: ProductWithBreederAndVariants[];
}) {
  const { t } = useLanguage();
  const drillDown = Boolean(breederSlug);
  const title = drillDown
    ? breederName ?? t("ค่ายนี้", "This breeder")
    : t("เมล็ดพันธุ์มาใหม่", "New Seeds");
  const [liveBoxes, setLiveBoxes] = useState(boxes);
  const [loadingBoxes, setLoadingBoxes] = useState(!drillDown && boxes.length === 0);

  useEffect(() => {
    setLiveBoxes(boxes);
    if (boxes.length > 0) setLoadingBoxes(false);
  }, [boxes]);

  useEffect(() => {
    if (drillDown || boxes.length > 0) return;
    let cancelled = false;
    setLoadingBoxes(true);
    void (async () => {
      try {
        const res = await fetchWithTimeout(
          "/api/storefront/new-seeds-breeders",
          { cache: "no-store" },
          8000
        );
        if (!res.ok || res.status === 408) return;
        const json = (await res.json()) as { boxes?: StorefrontNewSeedsBreederBox[] };
        if (!cancelled && Array.isArray(json.boxes) && json.boxes.length > 0) {
          setLiveBoxes(json.boxes);
        }
      } finally {
        if (!cancelled) setLoadingBoxes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drillDown, boxes.length]);

  useEffect(() => {
    if (!breederSlug) {
      saveCatalogReturnPath("/new");
      return;
    }
    saveCatalogReturnPath(`/new?breeder=${encodeURIComponent(breederSlug)}`);
  }, [breederSlug]);

  return (
    <div className={`min-h-[60vh] bg-background text-foreground ${JOURNAL_PRODUCT_FONT_VARS}`}>
      <div className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.18),_transparent_55%)] motion-safe:animate-pulse motion-safe:duration-[3s]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          {drillDown ? (
            <Link
              href="/new"
              className="mb-3 inline-flex min-h-12 items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 sm:mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("กลับไปกล่องค่าย", "Back to breeders")}
            </Link>
          ) : null}
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-violet-400/90">
                {t("มาใหม่", "NEW DROPS")}
              </p>
              <h1 className="mt-2 max-w-2xl bg-gradient-to-r from-white via-violet-100 to-cyan-300 bg-clip-text font-sans text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-xl text-sm font-light text-muted-foreground">
                {drillDown
                  ? t(
                      "สายพันธุ์ใหม่ที่คัดเข้าคลังจากค่ายนี้",
                      "Latest curated drops from this breeder"
                    )
                  : t(
                      "เลือกค่ายที่เพิ่งได้สายพันธุ์ใหม่ — แต่ละกล่องคือ drop ล่าสุด",
                      "Pick a breeder with fresh drops — each box is the latest arrival"
                    )}
              </p>
            </div>
            {drillDown ? (
              <div
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-violet-500/30 bg-white shadow-md ring-1 ring-violet-500/20 sm:h-20 sm:w-20"
                aria-hidden={!breederName}
              >
                <BreederLogoImage
                  src={breederLogoUrl}
                  breederName={breederName ?? title}
                  width={80}
                  height={80}
                  className="h-16 w-16 rounded-xl sm:h-20 sm:w-20"
                  imgClassName="object-contain p-1.5"
                  sizes="80px"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {drillDown ? (
          products.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {t("ไม่พบสินค้าใหม่ของค่ายนี้", "No new seeds for this breeder")}
            </p>
          ) : (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              onClickCapture={(e) => {
                const el = (e.target as HTMLElement).closest("a");
                if (el) touchCatalogReturnFromWindow();
              }}
            >
              {products.map((p) => (
                <NewSeedsProductCard key={p.id} product={p} />
              ))}
            </div>
          )
        ) : loadingBoxes ? (
          <div className="grid auto-rows-[minmax(10rem,auto)] grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cnSkeleton(i)}
              />
            ))}
          </div>
        ) : liveBoxes.length === 0 ? (
          <div className="space-y-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {t("ยังไม่มีสินค้ามาใหม่ในกล่อง", "No new seeds in the box yet")}
            </p>
            <Link
              href="/seeds"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-5 text-sm text-cyan-400 hover:bg-muted"
            >
              {t("ไปหน้ารวมเมล็ดพันธุ์", "Browse all seeds")}
            </Link>
          </div>
        ) : (
          <div className="grid auto-rows-[minmax(10rem,auto)] grid-cols-2 gap-3 md:grid-cols-4">
            {liveBoxes.map((box, index) => (
              <NewSeedsBreederBoxCard
                key={box.breederId}
                box={box}
                featured={index === 0}
                style={{ animationDelay: `${Math.min(index, 8) * 80}ms` }}
              />
            ))}
          </div>
        )}

        {!drillDown && liveBoxes.length > 0 ? (
          <div className="mt-12 flex justify-center">
            <Link
              href="/seeds?view=all"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/10 px-6 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
            >
              {t("ดูคลังทั้งหมด", "Browse full vault")}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function cnSkeleton(index: number): string {
  const base =
    "animate-pulse rounded-2xl bg-violet-950/40 aspect-[4/3]";
  if (index === 0) return `${base} md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[22rem]`;
  return base;
}
