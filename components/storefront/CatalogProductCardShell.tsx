"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { seedsBreederHref } from "@/lib/breeder-slug";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import {
  productAccentTokens,
  type ProductStatusAccent,
} from "@/lib/storefront-category-accents";

export type { ProductStatusAccent };

export function CatalogProductCardShell({
  children,
  className,
  accent = "vault",
}: {
  children: ReactNode;
  className?: string;
  accent?: ProductStatusAccent;
}) {
  const a = productAccentTokens(accent);
  return (
    <article
      className={cn(
        "group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-zinc-950 shadow-lg transition duration-300",
        a.cardBorder,
        JOURNAL_PRODUCT_FONT_VARS,
        className
      )}
    >
      {children}
    </article>
  );
}

export function CatalogProductCardImageArea({
  href,
  onNavigate,
  outOfStock,
  soldOutLabel,
  imageOverlay,
  children,
}: {
  href: string;
  onNavigate?: () => void;
  outOfStock?: boolean;
  soldOutLabel: string;
  imageOverlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
      <Link href={href} onClick={onNavigate} className="absolute inset-0 block">
        {children}
      </Link>
      {imageOverlay}
      {outOfStock ? (
        <div
          className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center bg-zinc-950/35 p-3"
          aria-hidden
        >
          <div className="w-full max-w-[min(92%,15rem)] rounded-lg border border-zinc-700 bg-zinc-950/95 px-3 py-2.5 text-center shadow-lg">
            <p className="font-sans text-[11px] font-bold leading-tight text-zinc-100 sm:text-xs">
              {soldOutLabel}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CatalogProductCardBreederLogo({
  breeder,
  className,
  accent = "vault",
}: {
  breeder: { name: string; logo_url?: string | null; slug?: string | null };
  className?: string;
  accent?: ProductStatusAccent;
}) {
  const a = productAccentTokens(accent);
  return (
    <Link
      href={seedsBreederHref(breeder)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border bg-white shadow-md ring-1 transition-transform hover:scale-105",
        a.cardBreederLogo,
        className
      )}
      aria-label={breeder.name}
    >
      <BreederLogoImage
        src={breeder.logo_url}
        breederName={breeder.name}
        width={32}
        height={32}
        className="h-8 w-8"
        imgClassName="object-contain p-0.5"
        sizes="32px"
      />
    </Link>
  );
}

export function CatalogProductCardBody({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-3">{children}</div>;
}
