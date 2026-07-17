"use client";

import Link from "next/link";
import FlaskConical from "lucide-react/dist/esm/icons/flask-conical";
import Droplets from "lucide-react/dist/esm/icons/droplets";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import Stethoscope from "lucide-react/dist/esm/icons/stethoscope";
import { useLanguage } from "@/context/LanguageContext";

const TOOLS = [
  { slug: "soil-mixer", icon: FlaskConical, labelTh: "ผสมดิน", labelEn: "Soil Mixer" },
  { slug: "vpd-calculator", icon: Droplets, labelTh: "คำนวณ VPD", labelEn: "VPD Calculator" },
  { slug: "fertilizer", icon: Leaf, labelTh: "ปุ๋ย", labelEn: "Fertilizer" },
  { slug: "plant-doctor", icon: Stethoscope, labelTh: "หมอพืช", labelEn: "Plant Doctor" },
] as const;

export function AiQuickToolsDock() {
  const { t } = useLanguage();

  return (
    <section className="border-b border-border bg-background py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <p className="mb-4 text-center font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {t("เครื่องมือ AI ด่วน", "AI Quick Tools")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {TOOLS.map(({ slug, icon: Icon, labelTh, labelEn }) => {
            const label = t(labelTh, labelEn);
            return (
              <Link
                key={slug}
                href={`/tools/${slug}`}
                className="group surface-glass flex min-h-12 min-w-[7.5rem] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/10"
                aria-label={label}
              >
                <Icon
                  className="h-5 w-5 text-primary transition-colors group-hover:text-emerald-400"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="text-center font-sans text-[11px] font-medium leading-tight text-muted-foreground transition-colors group-hover:text-foreground sm:text-xs">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
