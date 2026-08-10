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
import { MobileNavAccordion } from "@/components/storefront/MobileNavAccordion";
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
  menuOpen?: boolean;
  seedsActive?: boolean;
  mode: "desktop" | "mobile";
};

function geneticsHref(slug: string): string {
  return `/seeds?genetics=${encodeURIComponent(slug)}`;
}

function floweringHref(slug: string): string {
  return `/seeds?ft=${encodeURIComponent(slug)}`;
}

export function GeneticsSeedsNav({ navLinkClass, onNavigate, menuOpen, seedsActive, mode }: Props) {
  const { t, locale } = useLanguage();
  const { breeders, isLoading: breedersLoading } = useBreeders();
  const [open, setOpen] = useState(false);
  const isEn = locale === "en";

  const label = t("เมล็ดพันธุ์", "Seeds");
  const entryLinks = [
    { href: "/seeds", label: t("เมล็ดพันธุ์ทั้งหมด", "All Seeds") },
    { href: "/new", label: t("เมล็ดพันธุ์มาใหม่", "New Seeds") },
    { href: "/clearance", label: t("เมล็ดพันธุ์ลดราคา", "Clearance Seeds") },
  ] as const;
  const breederSectionLabel = t("เลือกเมล็ดตามค่าย", "Shop by breeder");
  const sectionHeadingClass =
    "text-[10px] font-medium uppercase tracking-wide text-zinc-500";
  const entryLinkClass =
    "block rounded-lg px-2 py-2 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-zinc-900/70 hover:text-zinc-100";
  const breederLinkClass =
    "flex items-center gap-3 rounded-lg px-1 py-0.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900/50 hover:text-zinc-200";

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
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 sm:h-10 sm:w-10">
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
      <MobileNavAccordion
        id="nav-seeds"
        label={label}
        active={seedsActive}
        menuOpen={menuOpen}
        panelClassName="space-y-3"
      >
        <ul className="space-y-0.5">
          {entryLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={entryLinkClass}
                prefetch={item.href === "/clearance" ? false : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div>
          <p className={cn(sectionHeadingClass, "mb-2")}>{breederSectionLabel}</p>
          {breederLinks}
        </div>
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                onClick={onNavigate}
                className={cn(
                  serif,
                  "flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-1 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900/70 hover:text-zinc-100"
                )}
              >
                <SeedsFilterIconBadge slug={row.slug} />
                {row.label}
              </Link>
            </li>
          ))}
        </ul>
      </MobileNavAccordion>
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
          className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform", open && "rotate-180")}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 pt-2 lg:left-0 lg:translate-x-0">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-zinc-950/95 shadow-lg backdrop-blur-md">
            <div className="border-b border-border/60 px-4 py-3">
              <ul className="space-y-0.5">
                {entryLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={entryLinkClass}
                      onClick={() => setOpen(false)}
                      prefetch={item.href === "/clearance" ? false : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className={cn(sectionHeadingClass, "mb-2 mt-4 px-2")}>
                {breederSectionLabel}
              </p>
              <div className="px-1">{breederLinks}</div>
            </div>
            <ul className="space-y-0.5 px-2 py-2">
              {rows.map((row) => (
                <li key={row.href}>
                  <Link
                    href={row.href}
                    className={cn(
                      serif,
                      "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900/70 hover:text-zinc-100"
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
