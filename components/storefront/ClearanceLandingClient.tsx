"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { saveCatalogReturnPath } from "@/lib/catalog-return-path";
import { fetchWithTimeout } from "@/lib/timeout";
import { ClearanceBreederBoxCard } from "@/components/storefront/ClearanceBreederBoxCard";
import { ClearanceCard } from "@/components/storefront/ClearanceCard";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { StorefrontClearanceBreederBox } from "@/lib/clearance";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";

export function ClearanceLandingClient({
  boxes,
  breederSlug,
  breederName,
  breederLogoUrl = null,
  products,
}: {
  boxes: StorefrontClearanceBreederBox[];
  breederSlug: string | null;
  breederName: string | null;
  breederLogoUrl?: string | null;
  products: ProductWithBreederAndVariants[];
}) {
  const { t } = useLanguage();
  const drillDown = Boolean(breederSlug);
  const title = drillDown
    ? breederName ?? t("ค่ายนี้", "This breeder")
    : t("Clearance", "Clearance");
  const [liveBoxes, setLiveBoxes] = useState(boxes);
  const [loadingBoxes, setLoadingBoxes] = useState(!drillDown && boxes.length === 0);

  useEffect(() => {
    setLiveBoxes(boxes);
    if (boxes.length > 0) setLoadingBoxes(false);
  }, [boxes]);

  /** Recover when SSR timed out / prefetch cached empty first paint. */
  useEffect(() => {
    if (drillDown || boxes.length > 0) return;
    let cancelled = false;
    setLoadingBoxes(true);
    void (async () => {
      try {
        const res = await fetchWithTimeout(
          "/api/storefront/clearance-breeders",
          { cache: "no-store" },
          8000
        );
        if (!res.ok || res.status === 408) return;
        const json = (await res.json()) as { boxes?: StorefrontClearanceBreederBox[] };
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
    const path = breederSlug
      ? `/clearance?breeder=${encodeURIComponent(breederSlug)}`
      : "/clearance";
    saveCatalogReturnPath(path);
  }, [breederSlug]);

  return (
    <div className={`min-h-0 bg-zinc-950 text-zinc-100 sm:min-h-[60vh] ${JOURNAL_PRODUCT_FONT_VARS}`}>
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-14">
          {drillDown ? (
            <Link
              href="/clearance"
              className="mb-3 inline-flex min-h-12 items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 sm:mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("กลับไปกล่องค่าย", "Back to breeders")}
            </Link>
          ) : null}
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-500/90">
                {t("ล้างสต็อก", "CLEARANCE")}
              </p>
              <h1 className="mt-1.5 max-w-2xl font-sans text-2xl font-semibold tracking-tight text-white sm:mt-2 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-1.5 max-w-xl text-xs font-light text-muted-foreground sm:mt-2 sm:text-sm">
                {drillDown
                  ? t(
                      "สินค้า Clearance ของค่ายนี้ · ราคาลดตามแต่ละรายการ",
                      "Clearance strains from this breeder · discount varies by product"
                    )
                  : t(
                      "เลือกค่ายที่ร่วมโปร · ส่วนลดตามแต่ละสินค้า",
                      "Pick a participating breeder · discount varies by product"
                    )}
              </p>
            </div>
            {drillDown ? (
              <div
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-zinc-700 bg-white shadow-md ring-1 ring-zinc-800 sm:h-20 sm:w-20"
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

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-12">
        {drillDown ? (
          products.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {t("ไม่พบสินค้า Clearance ของค่ายนี้", "No clearance products for this breeder")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ClearanceCard key={p.id} product={p} />
              ))}
            </div>
          )
        ) : loadingBoxes ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-900 sm:aspect-[16/10] sm:rounded-2xl"
              />
            ))}
          </div>
        ) : liveBoxes.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t("ยังไม่มีสินค้า Clearance", "No clearance products yet")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveBoxes.map((box) => (
              <ClearanceBreederBoxCard key={box.breederId} box={box} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
