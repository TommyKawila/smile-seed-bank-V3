"use client";

import { cn } from "@/lib/utils";

const mono = "font-[family-name:var(--font-journal-product-mono)]";

export function CatalogImagePlaceholder({
  seed,
  className,
}: {
  seed: string | number;
  className?: string;
}) {
  const label =
    typeof seed === "number"
      ? seed % 2 === 0
        ? "IMAGE_UNDER_RESEARCH"
        : "GENETIC_ARCHIVE_STAGING"
      : seed.toString().split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 2 === 0
        ? "IMAGE_UNDER_RESEARCH"
        : "GENETIC_ARCHIVE_STAGING";

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100",
        className
      )}
    >
      <span
        className={cn(
          mono,
          "max-w-[90%] text-center text-[8px] font-medium uppercase leading-tight tracking-[0.18em] text-zinc-400 sm:text-[9px]"
        )}
      >
        {label}
      </span>
    </div>
  );
}
