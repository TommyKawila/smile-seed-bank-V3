"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { cn } from "@/lib/utils";

function isSupabasePublicHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("supabase.co");
  } catch {
    return false;
  }
}

export function BreederLogoImage({
  src,
  breederName,
  width,
  height,
  className,
  imgClassName,
  sizes,
}: {
  src: string | null | undefined;
  breederName: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
  sizes?: string;
}) {
  const resolved = useMemo(() => resolvePublicAssetUrl(src), [src]);
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
        unoptimized={!isSupabasePublicHost(resolved)}
      />
    </div>
  );
}
