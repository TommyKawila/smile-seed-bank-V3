"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import {
  resolveSectionHeading,
  type SectionTitle,
} from "@/lib/homepage-section-title";
import { cn } from "@/lib/utils";
import { seedsBreederHref } from "@/lib/breeder-slug";
import { BREEDER_SHOWCASE_LIMIT } from "@/lib/constants";
import {
  fetchBreederShowcase,
  type BreederShowcaseRow,
} from "@/services/breeder-service";

export default function BreederShowcase({
  sectionTitle,
}: {
  sectionTitle?: SectionTitle;
}) {
  const { t, locale } = useLanguage();
  const [rows, setRows] = useState<BreederShowcaseRow[] | null>(null);
  const [totalBreeders, setTotalBreeders] = useState<number | null>(null);

  const mainHeading = resolveSectionHeading(
    locale,
    sectionTitle,
    "บรีดเดอร์ยอดนิยม",
    "Top Breeders in Stock"
  );

  const showcaseLabel = t(
    "แบรนด์สต็อกแน่น · Top 8",
    "Widest selection · Top 8"
  );

  const networkLabel =
    totalBreeders != null && totalBreeders > 0
      ? locale === "en"
        ? `${BREEDER_SHOWCASE_LIMIT} top brands · ${totalBreeders}+ in our network`
        : `${BREEDER_SHOWCASE_LIMIT} แบรนด์เด่น · เครือข่าย ${totalBreeders}+ แบรนด์`
      : t(
          "แบรนด์ที่มีสายพันธุ์ในคลังมากที่สุด",
          "Brands with the widest strain selection"
        );

  useEffect(() => {
    let cancelled = false;
    fetchBreederShowcase()
      .then((j) => {
        if (cancelled) return;
        setRows(j.breeders);
        setTotalBreeders(j.totalBreeders);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setTotalBreeders(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-b border-border bg-background" aria-label={mainHeading}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-6 space-y-2 text-center sm:mb-8 sm:space-y-3">
          <p className="font-sans text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {showcaseLabel}
          </p>
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
            {mainHeading}
          </h2>
          <p className="mx-auto max-w-md text-sm text-zinc-500">{networkLabel}</p>
        </div>

        {rows === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" aria-hidden />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t("ไม่พบข้อมูลแบรนด์", "No brands to display.")}</p>
        ) : (
          <ul
            className={cn(
              "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "sm:grid sm:grid-cols-4 sm:gap-5 sm:overflow-visible sm:pb-0"
            )}
          >
            {rows.map((b) => (
              <li key={b.id} className="w-[9.25rem] shrink-0 snap-start md:w-auto md:min-w-0">
                <Link
                  href={seedsBreederHref(b)}
                  className="group flex h-full flex-col rounded-xl border border-border/60 bg-zinc-950/40 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
                >
                  <div className="relative mx-auto flex h-20 w-full items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-2">
                    <div className="opacity-85 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0">
                      <BreederLogoImage
                        src={b.logoUrl}
                        breederName={b.name}
                        width={120}
                        height={64}
                        className="mx-auto flex max-h-16 max-w-[7.5rem] items-center justify-center"
                        imgClassName="max-h-16 object-contain"
                        sizes="120px"
                      />
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-center font-sans text-sm font-semibold leading-snug text-zinc-200 transition-colors group-hover:text-zinc-100">
                    {b.name}
                  </p>
                  <p className="mt-1 text-center font-sans text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    {b.strainCount}{" "}
                    {locale === "en"
                      ? b.strainCount === 1
                        ? "Strain"
                        : "Strains"
                      : "สายพันธุ์"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex justify-center md:mt-10">
          <Button
            asChild
            variant="outline"
            className="min-h-11 rounded-lg border-zinc-700 bg-zinc-900/50 font-semibold text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/70 hover:text-zinc-100"
          >
            <Link href="/shop" className="inline-flex items-center gap-1">
              {t("เลือกเมล็ดจากแบรนด์เด่น", "Shop top brands")}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
