"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { GrowerToolCard } from "@/components/storefront/tools/GrowerToolCard";
import { GROWER_TOOLS } from "@/lib/grower-tools";
import { isGrowerToolAiAvailable, type GrowerToolAiFlags } from "@/lib/grower-tools-settings";
import { cn } from "@/lib/utils";

export function GrowerToolsHubClient({ aiFlags }: { aiFlags: GrowerToolAiFlags }) {
  const { t } = useLanguage();
  const stagger = (i: number): CSSProperties => ({
    animationDelay: `${Math.min(i, 8) * 55}ms`,
  });

  return (
    <div className="min-h-0 bg-background text-foreground sm:min-h-[60vh]">
      <div className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-500/90">
            {t("เครื่องมือสายเขียว", "GROWER GEAR")}
          </p>
          <h1 className="mt-1.5 max-w-2xl font-sans text-2xl font-semibold tracking-tight sm:mt-2 sm:text-4xl">
            {t("AI ช่วยปลูก", "Grower Tools")}
          </h1>
          <p className="mt-1.5 max-w-xl text-xs font-light text-muted-foreground sm:mt-2 sm:text-sm">
            {t(
              "เลือกเครื่องมือ — ผสมดิน · VPD · ปุ๋ย · วิเคราะห์อาการ",
              "Pick a tool — soil mix · VPD · fertilizer · plant doctor"
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GROWER_TOOLS.map((tool, i) => (
            <div
              key={tool.slug}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500"
              )}
              style={stagger(i)}
            >
              <GrowerToolCard
                tool={tool}
                disabled={!isGrowerToolAiAvailable(tool.slug, aiFlags)}
              />
            </div>
          ))}
        </div>
        <p className="mt-8 text-center sm:mt-10">
          <Link
            href="/"
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            {t("กลับหน้าแรก", "Back to home")}
          </Link>
        </p>
      </div>
    </div>
  );
}
