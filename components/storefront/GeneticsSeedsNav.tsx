"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  CATALOG_GENETICS_STRIP_LABELS,
  CATALOG_GENETICS_STRIP_SLUGS,
} from "@/lib/catalog-filter-strip-labels";
import { shopFilterChipLeadingGlyph } from "@/components/storefront/shop-filter-chip-styles";
import { cn } from "@/lib/utils";
import { JOURNAL_PRODUCT_MONO_CLASS } from "@/components/storefront/journal-product-mono-class";

const serif = "font-sans";
const mono = JOURNAL_PRODUCT_MONO_CLASS;

const GENETICS_LINKS = CATALOG_GENETICS_STRIP_SLUGS.map((slug) => ({
  slug,
  labelTh: CATALOG_GENETICS_STRIP_LABELS[slug].th,
  labelEn: CATALOG_GENETICS_STRIP_LABELS[slug].en,
}));

type Props = {
  navLinkClass: string;
  solidLightNav: boolean;
  onNavigate?: () => void;
  mode: "desktop" | "mobile";
};

function geneticsHref(slug: string): string {
  return `/seeds?genetics=${encodeURIComponent(slug)}`;
}

export function GeneticsSeedsNav({ navLinkClass, solidLightNav, onNavigate, mode }: Props) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const isEn = locale === "en";

  const label = t("เมล็ดพันธุ์", "Seeds");
  const sectionLabel = t("พันธุกรรม", "Genetics");
  const catalogLabel = t("คลังเมล็ดพันธุ์ทั้งหมด", "Full seed catalog");

  const rows = GENETICS_LINKS.map((row) => ({
    href: geneticsHref(row.slug),
    label: isEn ? row.labelEn : row.labelTh,
    glyph: shopFilterChipLeadingGlyph(row.slug),
  }));

  if (mode === "mobile") {
    return (
      <div className="border-b border-gray-100 py-1">
        <Link
          href="/seeds"
          onClick={onNavigate}
          className="block py-2.5 text-base font-normal tracking-wide text-zinc-800 hover:text-emerald-900"
        >
          {label}
        </Link>
        <p className={cn(mono, "mb-2 mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-400")}>
          {sectionLabel}
        </p>
        <ul className="space-y-2 pb-2">
          {rows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                onClick={onNavigate}
                className={cn(
                  serif,
                  "flex items-center gap-2 rounded-sm py-1 text-sm font-medium text-zinc-800 hover:text-emerald-900"
                )}
              >
                {row.glyph ? <span aria-hidden>{row.glyph}</span> : null}
                {row.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("เปิดเมนูเมล็ดพันธุ์ตามพันธุกรรม", "Open seeds by genetics menu")}
        className={cn(
          navLinkClass,
          "inline-flex items-center gap-1 border-0 bg-transparent p-0",
          solidLightNav ? "text-zinc-800" : "text-zinc-600"
        )}
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 opacity-60 transition-transform", open && "rotate-180")}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-50 w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 pt-2 lg:left-0 lg:translate-x-0">
          <div className="overflow-hidden rounded-sm border border-zinc-100 bg-white shadow-md">
            <div className="border-b border-zinc-50 px-5 py-3">
              <p className={cn(mono, "text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-400")}>
                {sectionLabel}
              </p>
              <Link
                href="/seeds"
                className={cn(serif, "mt-2 block text-sm font-medium text-emerald-900 hover:underline")}
                onClick={() => setOpen(false)}
              >
                {catalogLabel} →
              </Link>
            </div>
            <ul className="space-y-1 px-3 py-3">
              {rows.map((row) => (
                <li key={row.href}>
                  <Link
                    href={row.href}
                    className={cn(
                      serif,
                      "flex items-center gap-2 rounded-sm px-2 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {row.glyph ? <span aria-hidden>{row.glyph}</span> : null}
                    {row.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
