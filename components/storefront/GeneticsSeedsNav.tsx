"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { SeedsFilterIconBadge } from "@/components/storefront/seeds-filter-icon-badge";
import { useBreeders } from "@/hooks/useBreeders";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { seedsBreederHref } from "@/lib/breeder-slug";
import {
  CATALOG_GENETICS_STRIP_LABELS,
  CATALOG_GENETICS_STRIP_SLUGS,
} from "@/lib/catalog-filter-strip-labels";
import { cn } from "@/lib/utils";

const serif = "font-sans";

const GENETICS_LINKS = CATALOG_GENETICS_STRIP_SLUGS.map((slug) => ({
  slug,
  labelTh: CATALOG_GENETICS_STRIP_LABELS[slug].th,
  labelEn: CATALOG_GENETICS_STRIP_LABELS[slug].en,
}));

const FLOWERING_LINKS = [
  { slug: "auto", labelTh: "เมล็ดออโต้", labelEn: "Autoflower seeds" },
  { slug: "photo", labelTh: "เมล็ดโฟโต้", labelEn: "Photoperiod seeds" },
] as const;

type Props = {
  navLinkClass: string;
  solidLightNav: boolean;
  onNavigate?: () => void;
  mode: "desktop" | "mobile";
};

function geneticsHref(slug: string): string {
  return `/seeds?genetics=${encodeURIComponent(slug)}`;
}

function floweringHref(slug: string): string {
  return `/seeds?ft=${encodeURIComponent(slug)}`;
}

export function GeneticsSeedsNav({ navLinkClass, onNavigate, mode }: Props) {
  const { t, locale } = useLanguage();
  const { breeders, isLoading: breedersLoading } = useBreeders();
  const [open, setOpen] = useState(false);
  const isEn = locale === "en";

  const label = t("เมล็ดพันธุ์", "Seeds");
  const catalogLabel = t("คลังเมล็ดพันธุ์ทั้งหมด", "Full seed catalog");
  const breederSectionLabel = t("เลือกเมล็ดตามค่าย", "Shop by breeder");
  const sectionHeadingClass =
    "font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary";
  const catalogLinkClass =
    "block text-[13px] font-semibold tracking-wide text-primary transition-colors hover:text-primary/80";
  const breederLinkClass =
    "flex items-center gap-3 rounded-lg py-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary";

  const rows = [
    ...GENETICS_LINKS.map((row) => ({
      slug: row.slug,
      href: geneticsHref(row.slug),
      label: isEn ? row.labelEn : row.labelTh,
    })),
    ...FLOWERING_LINKS.map((row) => ({
      slug: row.slug,
      href: floweringHref(row.slug),
      label: isEn ? row.labelEn : row.labelTh,
    })),
  ];

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const breederLinks = (
    <ul className={cn("space-y-3", mode === "desktop" ? "max-h-[min(40vh,14rem)] overflow-y-auto" : "max-h-56 overflow-y-auto")}>
      {breedersLoading ? (
        <li className="text-xs text-muted-foreground">…</li>
      ) : (
        breeders.map((b) => (
          <li key={b.id}>
            <Link
              href={seedsBreederHref(b)}
              onClick={close}
              className={cn(
                breederLinkClass,
                mode === "desktop" && "items-start leading-snug"
              )}
            >
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20 sm:h-10 sm:w-10">
                <BreederLogoImage
                  src={b.logo_url}
                  breederName={b.name}
                  width={40}
                  height={40}
                  className="rounded-sm"
                  imgClassName="object-contain p-0.5"
                  sizes="40px"
                />
              </span>
              <span className="min-w-0 leading-snug">{b.name}</span>
            </Link>
          </li>
        ))
      )}
    </ul>
  );

  if (mode === "mobile") {
    return (
      <div className="border-b border-border py-1">
        <Link
          href="/seeds"
          onClick={onNavigate}
          className="block py-2.5 text-base font-medium tracking-wide text-foreground hover:text-primary"
        >
          {label}
        </Link>
        <Link
          href="/seeds"
          onClick={onNavigate}
          className="block py-1 text-[13px] font-semibold tracking-wide text-primary transition-colors hover:text-primary/80"
        >
          {catalogLabel} →
        </Link>
        <p className={cn(sectionHeadingClass, "mb-2 mt-3")}>
          {breederSectionLabel}
        </p>
        <div className="pb-2">{breederLinks}</div>
        <ul className="space-y-2 pb-2">
          {rows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                onClick={onNavigate}
                className={cn(
                  serif,
                  "flex items-center gap-2.5 rounded-sm py-1 text-sm font-medium text-foreground hover:text-primary"
                )}
              >
                <SeedsFilterIconBadge slug={row.slug} />
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
        aria-label={t("เปิดเมนูเมล็ดพันธุ์", "Open seeds menu")}
        className={cn(navLinkClass, "inline-flex items-center gap-1 border-0 bg-transparent p-0")}
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-primary/70 opacity-80 transition-transform", open && "rotate-180")}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 pt-2 lg:left-0 lg:translate-x-0">
          <div className="overflow-hidden rounded-sm border border-border bg-card shadow-md">
            <div className="border-b border-border px-5 py-3">
              <Link
                href="/seeds"
                className={catalogLinkClass}
                onClick={() => setOpen(false)}
              >
                {catalogLabel} →
              </Link>
              <p className={cn(sectionHeadingClass, "mb-2 mt-4")}>
                {breederSectionLabel}
              </p>
              {breederLinks}
            </div>
            <ul className="space-y-1 px-3 py-3">
              {rows.map((row) => (
                <li key={row.href}>
                  <Link
                    href={row.href}
                    className={cn(
                      serif,
                      "flex items-center gap-2.5 rounded-sm px-2 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <SeedsFilterIconBadge slug={row.slug} />
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
