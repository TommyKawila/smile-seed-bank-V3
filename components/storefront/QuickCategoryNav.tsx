"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import Blend from "lucide-react/dist/esm/icons/blend";
import Flame from "lucide-react/dist/esm/icons/flame";
import Moon from "lucide-react/dist/esm/icons/moon";
import Sprout from "lucide-react/dist/esm/icons/sprout";
import Sun from "lucide-react/dist/esm/icons/sun";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Zap from "lucide-react/dist/esm/icons/zap";
import { useLanguage } from "@/context/LanguageContext";
import {
  resolveSectionHeading,
  type SectionTitle,
} from "@/lib/homepage-section-title";
import { cn } from "@/lib/utils";

type QuickItem = {
  href: string;
  Icon: LucideIcon;
  labelTh: string;
  labelEn: string;
  iconBg: string;
  iconFg: string;
};

const QUICK_ITEMS: QuickItem[] = [
  {
    href: "/seeds?difficulty=easy",
    Icon: Sprout,
    labelTh: "มือใหม่",
    labelEn: "Beginner",
    iconBg: "bg-primary/15 border-primary/25",
    iconFg: "text-primary",
  },
  {
    href: "/seeds?ft=auto",
    Icon: Zap,
    labelTh: "ออโต้ฟลาวเวอร์",
    labelEn: "Autoflower",
    iconBg: "bg-amber-500/15 border-amber-500/25",
    iconFg: "text-amber-400",
  },
  {
    href: "/seeds?thc=high",
    Icon: Flame,
    labelTh: "THC สูง",
    labelEn: "High THC",
    iconBg: "bg-orange-500/15 border-orange-500/25",
    iconFg: "text-orange-400",
  },
  {
    href: "/seeds?genetics=indica-dom",
    Icon: Moon,
    labelTh: "อินดิก้า",
    labelEn: "Indica",
    iconBg: "bg-indica/15 border-indica/25",
    iconFg: "text-indica",
  },
  {
    href: "/seeds?genetics=sativa-dom",
    Icon: Sun,
    labelTh: "ซาติว่า",
    labelEn: "Sativa",
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    iconFg: "text-emerald-400",
  },
  {
    href: "/seeds?genetics=hybrid",
    Icon: Blend,
    labelTh: "ไฮบริด",
    labelEn: "Hybrid",
    iconBg: "bg-teal-500/15 border-teal-500/25",
    iconFg: "text-teal-400",
  },
  {
    href: "/seeds?yield=high",
    Icon: Trophy,
    labelTh: "ผลผลิตสูง",
    labelEn: "High yield",
    iconBg: "bg-lime-500/15 border-lime-500/25",
    iconFg: "text-lime-400",
  },
];

export default function QuickCategoryNav({
  sectionTitle,
}: {
  sectionTitle?: SectionTitle;
}) {
  const { locale, t } = useLanguage();
  const isEn = locale === "en";
  const navHeading = resolveSectionHeading(
    locale,
    sectionTitle,
    "เลือกสไตล์การปลูก",
    "Find your grow style"
  );

  return (
    <section
      className="border-b border-border bg-muted/20"
      aria-label={navHeading}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {navHeading}
        </p>

        <ul
          className={cn(
            "flex gap-3 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "sm:flex-wrap sm:justify-center sm:overflow-visible sm:gap-4 sm:pb-0"
          )}
        >
          {QUICK_ITEMS.map(({ href, Icon, labelTh, labelEn, iconBg, iconFg }) => (
            <li
              key={href}
              className="w-[5.75rem] shrink-0 snap-start sm:w-[6.25rem]"
            >
              <Link
                href={href}
                className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-transform duration-200 hover:scale-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:shadow-md group-hover:shadow-primary/10",
                    iconBg
                  )}
                >
                  <Icon className={cn("h-7 w-7", iconFg)} strokeWidth={1.75} aria-hidden />
                </span>
                <span className="line-clamp-2 max-w-[7rem] text-[11px] font-medium leading-tight text-muted-foreground transition-colors group-hover:text-foreground sm:text-xs">
                  {isEn ? labelEn : labelTh}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
