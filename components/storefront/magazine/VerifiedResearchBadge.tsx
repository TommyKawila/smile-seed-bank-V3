"use client";

import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function VerifiedResearchBadge({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary",
        className
      )}
    >
      <BadgeCheck className="h-3 w-3 shrink-0 text-primary" aria-hidden />
      {t("งานวิจัยรับรอง", "Verified Research")}
    </span>
  );
}
