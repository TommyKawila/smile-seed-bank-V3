"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { GROWER_TOOLS_DISCLAIMER } from "@/lib/grower-tools";
import { cn } from "@/lib/utils";

export function GrowerToolShell({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t, locale } = useLanguage();
  const disclaimer = locale === "en" ? GROWER_TOOLS_DISCLAIMER.en : GROWER_TOOLS_DISCLAIMER.th;

  return (
    <div className={cn("min-h-[60vh] bg-background text-foreground", className)}>
      <div className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.15),_transparent_55%)]"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-10">
          <Link
            href="/tools"
            className="mb-2 inline-flex min-h-12 items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 sm:mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("กลับ AI ช่วยปลูก", "Back to Grower Tools")}
          </Link>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-500/90">
            {t("AI ช่วยปลูก", "GROWER TOOLS")}
          </p>
          <h1 className="mt-1.5 font-sans text-xl font-semibold tracking-tight sm:mt-2 sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">{children}</div>
      <p className="mx-auto max-w-3xl px-4 pb-6 text-center text-xs text-muted-foreground sm:px-6 sm:pb-10">
        {disclaimer}
      </p>
    </div>
  );
}
