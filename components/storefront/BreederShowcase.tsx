"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { JOURNAL_PRODUCT_MONO_CLASS } from "@/components/storefront/journal-product-mono-class";
import {
  resolveSectionHeading,
  type SectionTitle,
} from "@/lib/homepage-section-title";
import { cn } from "@/lib/utils";
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
        ? `${BREEDER_SHOWCASE_LIMIT} brands with the most strains in our vault — from a network of ${totalBreeders}+ breeders`
        : `${BREEDER_SHOWCASE_LIMIT} แบรนด์ที่มีสายพันธุ์ในคลังมากที่สุด — จากเครือข่าย ${totalBreeders}+ แบรนด์`
      : t(
          `${BREEDER_SHOWCASE_LIMIT} แบรนด์ที่มีสายพันธุ์ในคลังมากที่สุด`,
          `${BREEDER_SHOWCASE_LIMIT} brands with the widest strain selection`
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
    <section
      className="border-b border-zinc-100 bg-zinc-100/50"
      aria-label={mainHeading}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 text-center md:mb-10">
          <span
            className={cn(
              JOURNAL_PRODUCT_MONO_CLASS,
              "mb-3 inline-flex items-center rounded-full border border-emerald-200/60 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-emerald-800"
            )}
          >
            {showcaseLabel}
          </span>
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {mainHeading}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">{networkLabel}</p>
        </div>

        {rows === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700/50" aria-hidden />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">{t("ไม่พบข้อมูลแบรนด์", "No brands to display.")}</p>
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
                  href={`/shop?breeder=${encodeURIComponent(b.slug)}`}
                  className="group flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200/90 hover:shadow-md"
                >
                  <div className="relative mx-auto flex h-20 w-full items-center justify-center">
                    <div className="grayscale transition duration-300 group-hover:grayscale-0">
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
                  <p className="mt-3 line-clamp-2 text-center text-sm font-semibold leading-snug text-zinc-900">
                    {b.name}
                  </p>
                  <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
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
            className="border-emerald-200 bg-white font-semibold text-emerald-900 hover:bg-emerald-50"
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
