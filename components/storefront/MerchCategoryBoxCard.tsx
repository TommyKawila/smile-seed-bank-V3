"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Pin, Shirt, Sticker, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  merchCategoryHref,
  type MerchCategory,
  type MerchCategoryId,
} from "@/lib/merch-catalog";

const ICONS: Record<MerchCategoryId, typeof Shirt> = {
  tees: Shirt,
  caps: HardHat,
  pins: Pin,
  stickers: Sticker,
};

export function MerchCategoryBoxCard({
  breederSlug,
  category,
  title,
  countLabel,
  style,
}: {
  breederSlug: string;
  category: MerchCategory;
  title: string;
  countLabel: string;
  style?: CSSProperties;
}) {
  const Icon = ICONS[category.id];
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition duration-400",
        "hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-emerald-500/15"
      )}
      style={style}
    >
      <Link
        href={merchCategoryHref(breederSlug, category.id)}
        className="relative flex min-h-[48px] aspect-[16/10] flex-col items-center justify-center gap-3 bg-zinc-900/80 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label={title}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background/60 text-emerald-400 transition duration-300 group-hover:scale-110 group-hover:border-emerald-500/50 group-active:scale-95">
          <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{countLabel}</p>
        </div>
      </Link>
    </article>
  );
}
