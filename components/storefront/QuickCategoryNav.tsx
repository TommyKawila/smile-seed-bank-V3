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
};

const QUICK_ITEMS: QuickItem[] = [
  {
    href: "/seeds?difficulty=easy",
    Icon: Sprout,
    labelTh: "มือใหม่",
    labelEn: "Beginner",
  },
  {
    href: "/seeds?ft=auto",
    Icon: Zap,
    labelTh: "ออโต้ฟลาวเวอร์",
    labelEn: "Autoflower",
  },
  {
    href: "/seeds?thc=high",
    Icon: Flame,
    labelTh: "THC สูง",
    labelEn: "High THC",
  },
  {
    href: "/seeds?genetics=indica-dom",
    Icon: Moon,
    labelTh: "อินดิก้า",
    labelEn: "Indica",
  },
  {
    href: "/seeds?genetics=sativa-dom",
    Icon: Sun,
    labelTh: "ซาติว่า",
    labelEn: "Sativa",
  },
  {
    href: "/seeds?genetics=hybrid",
    Icon: Blend,
    labelTh: "ไฮบริด",
    labelEn: "Hybrid",
  },
  {
    href: "/seeds?yield=high",
    Icon: Trophy,
    labelTh: "ผลผลิตสูง",
    labelEn: "High yield",
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
      className="border-b border-border/60 bg-background"
      aria-label={navHeading}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {navHeading}
        </p>

        <ul
          className={cn(
            "flex gap-3 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "sm:flex-wrap sm:justify-center sm:overflow-visible sm:gap-4 sm:pb-0"
          )}
        >
          {QUICK_ITEMS.map(({ href, Icon, labelTh, labelEn }) => (
            <li
              key={href}
              className="w-[5.75rem] shrink-0 snap-start sm:w-[6.25rem]"
            >
              <Link
                href={href}
                className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors group-hover:border-zinc-700 group-hover:bg-zinc-900/70">
                  <Icon className="h-7 w-7 text-zinc-500 transition-colors group-hover:text-zinc-300" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="line-clamp-2 max-w-[7rem] text-[11px] font-medium leading-tight text-zinc-400 transition-colors group-hover:text-zinc-200 sm:text-xs">
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
