"use client";

import Link from "next/link";
import FlaskConical from "lucide-react/dist/esm/icons/flask-conical";
import Droplets from "lucide-react/dist/esm/icons/droplets";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import Stethoscope from "lucide-react/dist/esm/icons/stethoscope";
import { useLanguage } from "@/context/LanguageContext";
import {
  GROWER_TOOLS,
  growerToolHref,
  type GrowerToolIconName,
} from "@/lib/grower-tools";

const ICONS: Record<GrowerToolIconName, typeof FlaskConical> = {
  flask: FlaskConical,
  droplets: Droplets,
  leaf: Leaf,
  stethoscope: Stethoscope,
};

export function AiQuickToolsDock() {
  const { t, locale } = useLanguage();
  const isEn = locale === "en";

  return (
    <section className="border-b border-border bg-background py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <p className="mb-4 text-center font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {t("เครื่องมือ AI ด่วน", "AI Quick Tools")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {GROWER_TOOLS.map((tool) => {
            const Icon = ICONS[tool.iconName];
            const label = isEn ? tool.labelEn : tool.labelTh;
            return (
              <Link
                key={tool.slug}
                href={growerToolHref(tool.slug)}
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
        <Link
          href="/tools"
          className="mt-4 inline-flex min-h-12 items-center justify-center px-4 text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
        >
          {t("ดูทั้งหมด →", "View all →")}
        </Link>
      </div>
    </section>
  );
}
