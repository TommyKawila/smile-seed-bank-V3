"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";
import { useNearViewport } from "@/hooks/use-near-viewport";
import { ClearanceCard } from "@/components/storefront/ClearanceCard";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { resolveSectionHeading, type SectionTitle } from "@/lib/homepage-section-title";

const ClearanceMobileCarousel = dynamic(
  () =>
    import("@/components/storefront/ClearanceMobileCarousel").then((m) => ({
      default: m.ClearanceMobileCarousel,
    })),
  { ssr: false }
);

const CLEARANCE_MOBILE_CAROUSEL_MIN = 4;

function ClearanceMobileRail({
  products,
  t,
}: {
  products: ProductWithBreederAndVariants[];
  t: (th: string, en: string) => string;
}) {
  const { ref, visible } = useNearViewport();

  return (
    <div ref={ref}>
      {visible ? (
        <ClearanceMobileCarousel products={products} t={t} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.slice(0, 3).map((p) => (
            <ClearanceCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
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

  const useMobileCarousel = products.length >= CLEARANCE_MOBILE_CAROUSEL_MIN;

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
            <p className="text-sm font-light text-muted-foreground">{sub}</p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 self-start border-emerald-500/40 bg-zinc-900 text-emerald-300 hover:bg-zinc-800 hover:text-emerald-200 sm:self-end"
          >
            <Link href="/seeds?quick=clearance">
              {t("ดูล้างสต็อกทั้งหมด", "View all clearance")}
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
              {useMobileCarousel ? (
                <ClearanceMobileRail products={products} t={t} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {products.map((p) => (
                    <ClearanceCard key={p.id} product={p} />
                  ))}
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
