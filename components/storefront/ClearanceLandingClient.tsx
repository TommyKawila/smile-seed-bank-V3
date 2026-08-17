"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { saveCatalogReturnPath } from "@/lib/catalog-return-path";
import { fetchWithTimeout } from "@/lib/timeout";
import { ClearanceBreederBoxCard } from "@/components/storefront/ClearanceBreederBoxCard";
import {
  LandingDrillDownCatalog,
  clearancePackVariants,
} from "@/components/storefront/LandingDrillDownCatalog";
import { ClearanceCard } from "@/components/storefront/ClearanceCard";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { StorefrontClearanceBreederBox } from "@/lib/clearance";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import {
  CLEARANCE_ACCENT,
  clearanceTierPercentClass,
} from "@/lib/storefront-category-accents";
import { cn } from "@/lib/utils";

function groupBoxesByPercent(
  boxes: StorefrontClearanceBreederBox[]
): { percent: number; boxes: StorefrontClearanceBreederBox[] }[] {
  const map = new Map<number, StorefrontClearanceBreederBox[]>();
  for (const box of boxes) {
    const list = map.get(box.discountPercent) ?? [];
    list.push(box);
    map.set(box.discountPercent, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([percent, group]) => ({ percent, boxes: group }));
}

function clearanceSkeletonClass(index: number, featured: boolean): string {
  const base = CLEARANCE_ACCENT.skeleton;
  if (featured) return `${base} md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[22rem]`;
  if (index === 0) return base;
  return base;
}

export function ClearanceLandingClient({
  boxes,
  breederSlug,
  breederName,
  breederLogoUrl = null,
  products,
  discountPercent = null,
}: {
  boxes: StorefrontClearanceBreederBox[];
  breederSlug: string | null;
  breederName: string | null;
  breederLogoUrl?: string | null;
  products: ProductWithBreederAndVariants[];
  discountPercent?: number | null;
}) {
  const { t } = useLanguage();
  const drillDown = Boolean(breederSlug);
  const title = drillDown
    ? breederName ?? t("ค่ายนี้", "This breeder")
    : t("Clearance", "Clearance");
  const [liveBoxes, setLiveBoxes] = useState(boxes);
  const [loadingBoxes, setLoadingBoxes] = useState(!drillDown && boxes.length === 0);

  const sections = useMemo(
    () => groupBoxesByPercent(liveBoxes),
    [liveBoxes]
  );

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
    if (drillDown) return;
    saveCatalogReturnPath("/clearance");
  }, [drillDown]);

  return (
    <div className={`min-h-[60vh] bg-background text-foreground ${JOURNAL_PRODUCT_FONT_VARS}`}>
      <div className="relative overflow-hidden border-b border-border">
        <div aria-hidden className={CLEARANCE_ACCENT.heroRadial} />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          {drillDown ? (
            <Link
              href="/clearance"
              className={cn(
                "mb-3 inline-flex min-h-12 items-center gap-2 text-sm sm:mb-4",
                CLEARANCE_ACCENT.backLink
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("กลับไปกล่องค่าย", "Back to breeders")}
            </Link>
          ) : null}
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <p className={CLEARANCE_ACCENT.eyebrow}>
                {t("ล้างสต็อก", "CLEARANCE")}
              </p>
              {drillDown ? (
                <h1 className={CLEARANCE_ACCENT.titlePlain}>
                  {title}
                  {discountPercent != null ? (
                    <span className={CLEARANCE_ACCENT.drillBadge}>
                      −{discountPercent}%
                    </span>
                  ) : null}
                </h1>
              ) : (
                <h1 className={CLEARANCE_ACCENT.titleGradient}>{title}</h1>
              )}
              <p className="mt-2 max-w-xl text-sm font-light text-muted-foreground">
                {drillDown
                  ? discountPercent != null
                    ? t(
                        `สินค้า Clearance ลด ${discountPercent}% ของค่ายนี้`,
                        `${discountPercent}% off clearance strains from this breeder`
                      )
                    : t(
                        "สินค้า Clearance ของค่ายนี้ · ราคาลดตามแต่ละรายการ",
                        "Clearance strains from this breeder · discount varies by product"
                      )
                  : t(
                      "เลือกตามระดับส่วนลด — แยกชัด −50% / −20% และระดับอื่น",
                      "Browse by discount tier — clear −50% / −20% and other groups"
                    )}
              </p>
            </div>
            {drillDown ? (
              <div
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-md sm:h-20 sm:w-20",
                  CLEARANCE_ACCENT.logoRing
                )}
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
              {t("ไม่พบสินค้า Clearance ของค่ายนี้", "No clearance products for this breeder")}
            </p>
          ) : (
            <Suspense
              fallback={
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="aspect-[3/4] animate-pulse rounded-2xl bg-zinc-900"
                    />
                  ))}
                </div>
              }
            >
              <LandingDrillDownCatalog
                products={products}
                keepParams={["breeder", "pct"]}
                packVariants={clearancePackVariants}
                renderCard={(p) => <ClearanceCard key={p.id} product={p} />}
              />
            </Suspense>
          )
        ) : loadingBoxes ? (
          <div className="grid auto-rows-[minmax(10rem,auto)] grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={clearanceSkeletonClass(i, i === 0)} />
            ))}
          </div>
        ) : liveBoxes.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t("ยังไม่มีสินค้า Clearance", "No clearance products yet")}
          </p>
        ) : (
          <div className="space-y-10 sm:space-y-14">
            {sections.map((section) => (
              <section
                key={section.percent}
                aria-labelledby={`clearance-tier-${section.percent}`}
              >
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-zinc-800 pb-3 sm:mb-5">
                  <div>
                    <h2
                      id={`clearance-tier-${section.percent}`}
                      className="text-xl font-semibold tracking-tight text-white sm:text-2xl"
                    >
                      {t("ลด ", "")}
                      <span className={clearanceTierPercentClass(section.percent)}>
                        {section.percent}%
                      </span>
                      {t("", " off")}
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                      {t(
                        "ค่ายที่มีสินค้าในระดับส่วนลดนี้เท่านั้น",
                        "Breeders with products at this discount tier only"
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {t(
                      `${section.boxes.length} ค่าย`,
                      `${section.boxes.length} breeders`
                    )}
                  </p>
                </div>
                <div className="grid auto-rows-[minmax(10rem,auto)] grid-cols-2 gap-3 md:grid-cols-4">
                  {section.boxes.map((box, index) => (
                    <ClearanceBreederBoxCard
                      key={`${box.breederId}-${box.discountPercent}`}
                      box={box}
                      featured={index === 0}
                      style={{ animationDelay: `${Math.min(index, 8) * 80}ms` }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
