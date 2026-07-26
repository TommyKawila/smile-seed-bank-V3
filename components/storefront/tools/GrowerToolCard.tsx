"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import FlaskConical from "lucide-react/dist/esm/icons/flask-conical";
import Droplets from "lucide-react/dist/esm/icons/droplets";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import Stethoscope from "lucide-react/dist/esm/icons/stethoscope";
import { useLanguage } from "@/context/LanguageContext";
import {
  growerToolHref,
  type GrowerToolDef,
  type GrowerToolIconName,
} from "@/lib/grower-tools";
import { cn } from "@/lib/utils";

const ICONS: Record<GrowerToolIconName, typeof FlaskConical> = {
  flask: FlaskConical,
  droplets: Droplets,
  leaf: Leaf,
  stethoscope: Stethoscope,
};

export function GrowerToolCard({
  tool,
  style,
  disabled = false,
}: {
  tool: GrowerToolDef;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  const { t, locale } = useLanguage();
  const Icon = ICONS[tool.iconName];
  const title = locale === "en" ? tool.labelEn : tool.labelTh;
  const blurb = locale === "en" ? tool.blurbEn : tool.blurbTh;

  const inner = (
    <>
      {disabled ? (
        <span className="absolute right-2 top-2 rounded-md bg-zinc-800/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("ปิดชั่วคราว", "Off")}
        </span>
      ) : null}
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background/60 text-emerald-400 transition duration-300",
          !disabled && "group-hover:scale-110 group-hover:border-emerald-500/50"
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
      </span>
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{blurb}</p>
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition duration-400",
        disabled
          ? "cursor-not-allowed opacity-45 saturate-50"
          : "hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-emerald-500/10"
      )}
      style={style}
      aria-disabled={disabled || undefined}
    >
      {disabled ? (
        <div
          className="relative flex min-h-[48px] aspect-[16/10] flex-col items-center justify-center gap-3 bg-zinc-900/80 p-4"
          aria-label={`${title} — ${t("ปิดชั่วคราว", "temporarily off")}`}
        >
          {inner}
        </div>
      ) : (
        <Link
          href={growerToolHref(tool.slug)}
          className="relative flex min-h-[48px] aspect-[16/10] flex-col items-center justify-center gap-3 bg-zinc-900/80 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={title}
        >
          {inner}
        </Link>
      )}
    </article>
  );
}
