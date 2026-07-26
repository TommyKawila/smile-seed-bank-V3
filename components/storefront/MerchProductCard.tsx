"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Eye, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import type { MerchStorefrontProduct } from "@/lib/merch-catalog";

const ACCENT_BG: Record<MerchStorefrontProduct["accent"], string> = {
  emerald: "from-emerald-600/40 via-zinc-900 to-zinc-950",
  violet: "from-violet-600/40 via-zinc-900 to-zinc-950",
  amber: "from-amber-500/40 via-zinc-900 to-zinc-950",
  sky: "from-sky-500/40 via-zinc-900 to-zinc-950",
};

export function MerchProductCard({
  product,
  name,
  blurb,
  comingSoonLabel,
  quickLookLabel,
  onQuickLook,
  style,
}: {
  product: MerchStorefrontProduct;
  name: string;
  blurb: string;
  comingSoonLabel: string;
  quickLookLabel: string;
  onQuickLook: () => void;
  style?: CSSProperties;
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition duration-500",
        "hover:-translate-y-1 hover:border-emerald-500/35 hover:shadow-xl"
      )}
      style={style}
    >
      <button
        type="button"
        onClick={onQuickLook}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-zinc-900 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label={`${quickLookLabel}: ${name}`}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            className="object-cover transition duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <>
            <div
              aria-hidden
              className={cn(
                "absolute inset-0 bg-gradient-to-br transition duration-700 group-hover:scale-105",
                ACCENT_BG[product.accent]
              )}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition duration-700 group-hover:bg-white/20"
            />
          </>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 translate-y-full bg-gradient-to-t from-emerald-400/20 to-transparent opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100"
        />
        <span className="absolute right-3 top-3 inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
          <Eye className="h-4 w-4" aria-hidden />
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {name}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{blurb}</p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-base font-bold tabular-nums text-emerald-400">
            {formatPrice(product.priceBaht)}
          </span>
          <Button
            type="button"
            size="sm"
            className="min-h-11 gap-1.5 bg-emerald-600 hover:bg-emerald-500"
            onClick={() => toast.message(comingSoonLabel)}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">Cart</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
