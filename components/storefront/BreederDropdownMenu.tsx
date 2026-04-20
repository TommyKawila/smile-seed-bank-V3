"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useBreeders } from "@/hooks/useBreeders";
import { seedsBreederHref } from "@/lib/breeder-slug";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";

const serif = "font-sans";
const mono = "font-[family-name:var(--font-journal-product-mono)]";

type Props = {
  navLinkClass: string;
  solidLightNav: boolean;
  /** Close mobile sheet when a link is chosen */
  onNavigate?: () => void;
  mode: "desktop" | "mobile";
};

export function BreederSeedsNav({ navLinkClass, solidLightNav, onNavigate, mode }: Props) {
  const { breeders, isLoading } = useBreeders();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const label = t("เมล็ดพันธุ์", "Seeds");
  const catalogLabel = t("คลังเมล็ดพันธุ์ทั้งหมด", "Full seed catalog");

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
          FIND BY BREEDER
        </p>
        <ul className={`max-h-56 space-y-3 overflow-y-auto pb-2 ${JOURNAL_PRODUCT_FONT_VARS}`}>
          {isLoading ? (
            <li className="text-xs text-zinc-400">…</li>
          ) : (
            breeders.map((b) => (
              <li key={b.id}>
                <Link
                  href={seedsBreederHref(b)}
                  onClick={onNavigate}
                  className={cn(
                    serif,
                    "flex items-center gap-3 rounded-sm py-1 text-sm font-medium text-zinc-800 hover:text-emerald-900"
                  )}
                >
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-zinc-100 bg-zinc-50">
                    <BreederLogoImage
                      src={b.logo_url}
                      breederName={b.name}
                      width={36}
                      height={36}
                      className="rounded-sm"
                      imgClassName="object-contain p-0.5"
                      sizes="36px"
                    />
                  </span>
                  <span className="min-w-0 leading-snug">{b.name}</span>
                </Link>
              </li>
            ))
          )}
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

      {open && (
        <div className="absolute left-1/2 top-full z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 pt-2 lg:left-0 lg:translate-x-0">
          <div
            className={`overflow-hidden rounded-sm border border-zinc-100 bg-white shadow-md ${JOURNAL_PRODUCT_FONT_VARS}`}
          >
            <div className="border-b border-zinc-50 px-5 py-3">
              <p className={cn(mono, "text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-400")}>
                FIND BY BREEDER
              </p>
              <Link
                href="/seeds"
                className={cn(serif, "mt-2 block text-sm font-medium text-emerald-900 hover:underline")}
                onClick={() => setOpen(false)}
              >
                {catalogLabel} →
              </Link>
            </div>
            <ul className="max-h-[min(60vh,24rem)] space-y-4 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <li className="text-sm text-zinc-400">Loading…</li>
              ) : (
                breeders.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={seedsBreederHref(b)}
                      className={cn(
                        serif,
                        "flex items-start gap-3 rounded-sm py-0.5 text-sm font-medium leading-snug text-zinc-900 transition-colors hover:text-emerald-900"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <span className="relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-zinc-100 bg-zinc-50">
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
                      <span className="min-w-0 pt-1">{b.name}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
