"use client";

import { Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { resolveShippingPause } from "@/lib/shipping-pause";
import { cn } from "@/lib/utils";

type Variant = "strip" | "box";

export function ShippingPauseNotice({ variant }: { variant: Variant }) {
  const { settings } = useSiteSettings();
  const { locale } = useLanguage();
  const pause = resolveShippingPause(settings as Record<string, string>);

  if (!pause?.active) return null;

  const message = locale === "th" ? pause.messageTh : pause.messageEn;

  if (variant === "strip") {
    return (
      <div
        role="status"
        className="border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-center text-sm leading-relaxed text-amber-100"
      >
        <p className="mx-auto flex max-w-4xl items-center justify-center gap-2">
          <Truck className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          <span>{message}</span>
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5",
        "text-xs leading-relaxed text-amber-100/95",
      )}
    >
      <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
