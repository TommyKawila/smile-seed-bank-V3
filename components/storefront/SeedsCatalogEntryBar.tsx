"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname, useSearchParams } from "next/navigation";
import {
  isSeedsIndexPath,
  parseJournalBreederSlugFromPathname,
  resolveCatalogFtFromUrl,
} from "@/lib/catalog-navigation";
import {
  CATALOG_GENETICS_STRIP_LABELS,
  CATALOG_GENETICS_STRIP_SLUGS,
} from "@/lib/catalog-filter-strip-labels";

/** Compact context bar: current Seeds Hub entry + link back to hub. */
export function SeedsCatalogEntryBar() {
  const { t, locale } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSeedsIndex = isSeedsIndexPath(pathname);
  const breederSlug = parseJournalBreederSlugFromPathname(pathname);
  const viewAll = searchParams.get("view")?.trim().toLowerCase() === "all";
  const ft = resolveCatalogFtFromUrl({
    ft: searchParams.get("ft"),
    filter: searchParams.get("filter"),
  });
  const genetics = searchParams.get("genetics")?.trim().split(",")[0]?.toLowerCase() ?? "";

  const show =
    Boolean(breederSlug) ||
    (onSeedsIndex && (viewAll || Boolean(ft) || Boolean(genetics) || Boolean(searchParams.get("q"))));

  if (!show) return null;

  let label = t("คลังเมล็ดพันธุ์", "Seed vault");
  if (breederSlug) {
    label = t("ค่ายที่เลือก", "Selected breeder");
  } else if (viewAll && !ft && !genetics) {
    label = t("สินค้าทั้งหมด", "All strains");
  } else if (ft === "auto") {
    label = t("ออโต้ฟลาวเวอร์", "Autoflower");
  } else if (ft === "photo" || ft === "photo-ff" || ft === "photo-3n") {
    label = t("โฟโต้พีเรียด", "Photoperiod");
  } else if (
    (CATALOG_GENETICS_STRIP_SLUGS as readonly string[]).includes(genetics)
  ) {
    const g =
      CATALOG_GENETICS_STRIP_LABELS[
        genetics as (typeof CATALOG_GENETICS_STRIP_SLUGS)[number]
      ];
    label = locale === "en" ? g.en : g.th;
  }

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/40 px-3 py-2.5 sm:px-4">
      <p className="min-w-0 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{label}</span>
      </p>
      <Link
        href="/seeds"
        className="inline-flex min-h-12 items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("กลับไปหน้าก่อนนี้", "Back to previous page")}
      </Link>
    </div>
  );
}
