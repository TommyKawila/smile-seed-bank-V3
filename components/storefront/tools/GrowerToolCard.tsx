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

const CARD_BODY =
  "relative flex min-h-[48px] aspect-[4/3] flex-col items-center justify-center gap-2 bg-zinc-900/80 p-3 sm:aspect-[16/10] sm:gap-3 sm:p-4";

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
        <span className="absolute right-1.5 top-1.5 rounded-md bg-zinc-800/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:right-2 sm:top-2 sm:px-2 sm:text-[10px]">
          {t("ปิดชั่วคราว", "Off")}
        </span>
      ) : null}
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/60 text-emerald-400 transition duration-300 sm:h-14 sm:w-14 sm:rounded-2xl",
          !disabled && "group-hover:scale-110 group-hover:border-emerald-500/50"
        )}
      >
        <Icon className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={1.5} aria-hidden />
      </span>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground sm:text-base">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground sm:mt-1 sm:text-xs">
          {blurb}
        </p>
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card shadow-lg transition duration-400 sm:rounded-2xl",
        disabled
          ? "cursor-not-allowed opacity-45 saturate-50"
          : "hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-emerald-500/10"
      )}
      style={style}
      aria-disabled={disabled || undefined}
    >
      {disabled ? (
        <div className={CARD_BODY} aria-label={`${title} — ${t("ปิดชั่วคราว", "temporarily off")}`}>
          {inner}
        </div>
      ) : (
        <Link
          href={growerToolHref(tool.slug)}
          className={cn(CARD_BODY, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500")}
          aria-label={title}
        >
          {inner}
        </Link>
      )}
    </article>
  );
}
