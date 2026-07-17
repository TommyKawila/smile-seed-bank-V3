"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { breederLogoUrl } from "@/lib/storefront-image-urls";
import { cn } from "@/lib/utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

export function BreederLogoImage({
  src,
  breederName,
  width,
  height,
  className,
  imgClassName,
  sizes,
  priority = false,
}: {
  src: string | null | undefined;
  breederName: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  /** Default false — logos are never the catalog LCP candidate. */
  priority?: boolean;
}) {
  const resolved = useMemo(() => breederLogoUrl(src, width), [src, width]);
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);

  const letter = (breederName.trim().charAt(0) || "?").toUpperCase();

  if (!resolved || failed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-accent text-xs font-bold text-primary sm:text-sm",
          className
        )}
        style={{ width, height }}
        aria-hidden
        title={breederName}
      >
        {letter}
      </div>
    );
  }

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden", className)}
      style={{ width, height }}
    >
      <Image
        src={resolved}
        alt={`${breederName} logo`}
        width={width}
        height={height}
        className={cn("object-contain", imgClassName)}
        sizes={sizes ?? `${width}px`}
        onError={onError}
        priority={priority}
        fetchPriority={priority ? "high" : "low"}
        loading={priority ? "eager" : "lazy"}
        unoptimized={shouldOffloadImageOptimization(resolved)}
      />
    </div>
  );
}
