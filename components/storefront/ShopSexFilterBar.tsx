"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { parseListParam } from "@/lib/shop-attribute-filters";
import {
  CATALOG_SEX_STRIP_LABELS,
  CATALOG_SEX_STRIP_SLUGS,
  type CatalogSexStripSlug,
} from "@/lib/catalog-filter-strip-labels";
import { shopQuickChipClasses } from "@/components/storefront/shop-filter-chip-styles";
import { JOURNAL_PRODUCT_MONO_CLASS } from "@/components/storefront/journal-product-mono-class";
import { cn } from "@/lib/utils";

const mono = JOURNAL_PRODUCT_MONO_CLASS;

type SexMode = "all" | "feminized" | "regular";

export function ShopSexFilterBar({
  replaceCatalog,
  t,
  sexCounts,
}: {
  replaceCatalog: (mutate: (sp: URLSearchParams) => void) => void;
  t: (th: string, en: string) => string;
  sexCounts?: Partial<Record<CatalogSexStripSlug, number>>;
}) {
  const searchParams = useSearchParams();
  const sexList = parseListParam(searchParams.get("sex"));
  const feminizedOn = sexList.includes("feminized") && !sexList.includes("regular");
  const regularOn = sexList.includes("regular") && !sexList.includes("feminized");
  const allOn = sexList.length === 0;

  const setSex = useCallback(
    (mode: SexMode) => {
      replaceCatalog((sp) => {
        const cur = parseListParam(sp.get("sex"));
        if (mode === "all") {
          sp.delete("sex");
          return;
        }
        const slug = mode === "feminized" ? "feminized" : "regular";
        if (cur.length === 1 && cur[0] === slug) sp.delete("sex");
        else sp.set("sex", slug);
      });
    },
    [replaceCatalog]
  );

  const allLabel = t("ทั้งหมด", "All");

  return (
    <div className="contents">
      <button
        type="button"
        className={shopQuickChipClasses(allOn)}
        aria-pressed={allOn}
        onClick={() => setSex("all")}
      >
        {allLabel}
      </button>
      {CATALOG_SEX_STRIP_SLUGS.map((slug) => {
        const labels = CATALOG_SEX_STRIP_LABELS[slug];
        const on = slug === "feminized" ? feminizedOn : regularOn;
        const count = sexCounts?.[slug] ?? 0;
        return (
          <button
            key={slug}
            type="button"
            className={shopQuickChipClasses(on)}
            aria-pressed={on}
            aria-label={`${t(labels.th, labels.en)} (${count})`}
            onClick={() => setSex(slug)}
          >
            <span>{t(labels.th, labels.en)}</span>
            <span
              className={cn(
                mono,
                "text-[10px] font-medium tabular-nums",
                on ? "text-white/85" : "text-zinc-400"
              )}
            >
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
