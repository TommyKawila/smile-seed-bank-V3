"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";
import { cn } from "@/lib/utils";

const ACCENT: Record<string, string> = {
  emerald: "from-emerald-500/25 via-transparent to-transparent ring-emerald-500/30",
  violet: "from-violet-500/25 via-transparent to-transparent ring-violet-500/30",
  amber: "from-amber-500/25 via-transparent to-transparent ring-amber-500/30",
  sky: "from-sky-500/25 via-transparent to-transparent ring-sky-500/30",
};

export function SeedsChooserBox({
  href,
  title,
  subtitle,
  imageUrl,
  imageFit = "contain",
  accent = "emerald",
  className,
}: {
  href: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  /** `cover` for photo banners; `contain` for breeder logos. */
  imageFit?: "cover" | "contain";
  accent?: keyof typeof ACCENT;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg",
        className
      )}
    >
      <Link
        href={href}
        className="relative block aspect-[16/10] min-h-[48px] overflow-hidden bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label={title}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn(
              "transition duration-500 group-hover:scale-[1.03]",
              imageFit === "cover"
                ? "object-cover object-center"
                : "object-contain p-6 sm:p-8"
            )}
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            unoptimized={shouldOffloadImageOptimization(imageUrl)}
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              ACCENT[accent] ?? ACCENT.emerald
            )}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/25 to-transparent" />
        {!imageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <Leaf className="h-12 w-12 text-muted-foreground" aria-hidden />
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-lg font-semibold tracking-tight text-white">{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-zinc-300">{subtitle}</p> : null}
        </div>
      </Link>
    </article>
  );
}
