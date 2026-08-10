"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { seedsBreederHref } from "@/lib/breeder-slug";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";

export function CatalogProductCardShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-violet-500/20 bg-zinc-950 shadow-lg transition duration-300 hover:border-violet-400/35",
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
}: {
  breeder: { name: string; logo_url?: string | null; slug?: string | null };
  className?: string;
}) {
  return (
    <Link
      href={seedsBreederHref(breeder)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-violet-500/30 bg-white shadow-md ring-1 ring-violet-500/15 transition-transform hover:scale-105",
        className
      )}
      aria-label={breeder.name}
    >
      <BreederLogoImage
        src={breeder.logo_url}
        breederName={breeder.name}
        width={32}
        height={32}
        className="rounded-full"
        imgClassName="object-cover"
        sizes="32px"
      />
    </Link>
  );
}

export function CatalogProductCardBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col gap-2 p-3">{children}</div>;
}
