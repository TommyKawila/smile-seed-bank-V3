"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

const ICONS: Record<GrowerToolIconName, typeof FlaskConical> = {
  flask: FlaskConical,
  droplets: Droplets,
  leaf: Leaf,
  stethoscope: Stethoscope,
};

type Props = {
  navLinkClass: string;
  onNavigate?: () => void;
  mode: "desktop" | "mobile";
};

export function GrowerToolsNavDropdown({ navLinkClass, onNavigate, mode }: Props) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const isEn = locale === "en";

  const label = t("ผู้ช่วย AI", "AI Assistant");
  const allLabel = t("ดูทั้งหมด", "View all");

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const toolLinks = GROWER_TOOLS.map((tool) => {
    const Icon = ICONS[tool.iconName];
    const name = isEn ? tool.labelEn : tool.labelTh;
    const blurb = isEn ? tool.blurbEn : tool.blurbTh;
    return { tool, Icon, name, blurb };
  });

  const itemClass =
    "flex min-h-12 items-start gap-3 rounded-sm px-2 py-2.5 text-left transition-colors hover:bg-primary/10";

  if (mode === "mobile") {
    return (
      <div className="border-b border-border py-1">
        <p className="py-2.5 text-base font-medium tracking-wide text-foreground">{label}</p>
        <ul className="space-y-0.5 pb-2">
          {toolLinks.map(({ tool, Icon, name, blurb }) => (
            <li key={tool.slug}>
              <Link
                href={growerToolHref(tool.slug)}
                onClick={close}
                className={itemClass}
                aria-label={name}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{name}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{blurb}</span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/tools"
              onClick={close}
              className="block rounded-sm py-2 text-[13px] font-semibold tracking-wide text-primary transition-colors hover:bg-primary/10"
            >
              {allLabel} →
            </Link>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("เปิดเมนูผู้ช่วย AI", "Open AI assistant menu")}
        className={cn(navLinkClass, "inline-flex items-center gap-1 border-0 bg-transparent p-0")}
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-primary/70 opacity-80 transition-transform", open && "rotate-180")}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-50 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 pt-2 lg:left-0 lg:translate-x-0">
          <div className="overflow-hidden rounded-sm border border-border bg-card shadow-md">
            <ul className="divide-y divide-border px-2 py-1">
              {toolLinks.map(({ tool, Icon, name, blurb }) => (
                <li key={tool.slug}>
                  <Link
                    href={growerToolHref(tool.slug)}
                    className={itemClass}
                    onClick={() => setOpen(false)}
                    aria-label={name}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{name}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{blurb}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-4 py-3">
              <Link
                href="/tools"
                className="text-[13px] font-semibold tracking-wide text-primary transition-colors hover:text-primary/90"
                onClick={() => setOpen(false)}
              >
                {allLabel} →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
