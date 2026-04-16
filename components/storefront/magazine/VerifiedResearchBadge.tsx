"use client";

import { BadgeCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function VerifiedResearchBadge({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-900",
        className
      )}
    >
      <BadgeCheck className="h-3 w-3 shrink-0 text-emerald-700" aria-hidden />
      {t("งานวิจัยรับรอง", "Verified Research")}
    </span>
  );
}
