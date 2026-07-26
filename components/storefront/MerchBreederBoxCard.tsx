"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { merchBreederHref, type MerchBreederBox } from "@/lib/merch-catalog";

const ACCENT_RING: Record<MerchBreederBox["accent"], string> = {
  emerald: "group-hover:shadow-emerald-500/25 group-hover:ring-emerald-500/40",
  violet: "group-hover:shadow-violet-500/25 group-hover:ring-violet-500/40",
  amber: "group-hover:shadow-amber-500/25 group-hover:ring-amber-500/40",
  sky: "group-hover:shadow-sky-500/25 group-hover:ring-sky-500/40",
};

const ACCENT_GLOW: Record<MerchBreederBox["accent"], string> = {
  emerald: "from-emerald-500/30 via-transparent to-transparent",
  violet: "from-violet-500/30 via-transparent to-transparent",
  amber: "from-amber-500/30 via-transparent to-transparent",
  sky: "from-sky-500/30 via-transparent to-transparent",
};

export function MerchBreederBoxCard({
  breeder,
  productCount,
  subtitle,
  style,
}: {
  breeder: MerchBreederBox;
  productCount: number;
  subtitle: string;
  style?: CSSProperties;
}) {
  const monogram = breeder.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg ring-1 ring-transparent transition duration-500",
        "hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl",
        ACCENT_RING[breeder.accent]
      )}
      style={style}
    >
      <Link
        href={merchBreederHref(breeder.slug)}
        className="relative block aspect-[16/10] min-h-[48px] overflow-hidden bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label={breeder.name}
      >
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-80 transition duration-500 group-hover:opacity-100",
            ACCENT_GLOW[breeder.accent]
          )}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-black/40 text-xl font-bold tracking-wider text-white backdrop-blur-sm transition duration-500 group-hover:scale-110 sm:h-20 sm:w-20 sm:text-2xl">
            {monogram}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-lg font-semibold tracking-tight text-white">{breeder.name}</p>
          <p className="mt-0.5 text-xs text-zinc-300">{subtitle}</p>
          <p className="mt-1 text-[11px] tabular-nums text-zinc-400">
            {productCount} items
          </p>
        </div>
      </Link>
    </article>
  );
}
