"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Blend, Flame, Moon, Sprout, Sun, Trophy, Zap } from "lucide-react";
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
    href: "/shop?difficulty=easy",
    Icon: Sprout,
    labelTh: "มือใหม่",
    labelEn: "Beginner",
    iconBg: "bg-emerald-50",
    iconFg: "text-emerald-700",
  },
  {
    href: "/shop?ft=auto",
    Icon: Zap,
    labelTh: "ออโต้ฟลาวเวอร์",
    labelEn: "Autoflower",
    iconBg: "bg-amber-50",
    iconFg: "text-amber-600",
  },
  {
    href: "/shop?thc=high",
    Icon: Flame,
    labelTh: "THC สูง",
    labelEn: "High THC",
    iconBg: "bg-orange-50",
    iconFg: "text-orange-600",
  },
  {
    href: "/shop?genetics=indica-dom",
    Icon: Moon,
    labelTh: "อินดิก้า",
    labelEn: "Indica",
    iconBg: "bg-violet-50",
    iconFg: "text-violet-700",
  },
  {
    href: "/shop?genetics=sativa-dom",
    Icon: Sun,
    labelTh: "ซาติว่า",
    labelEn: "Sativa",
    iconBg: "bg-sky-50",
    iconFg: "text-sky-600",
  },
  {
    href: "/shop?genetics=hybrid",
    Icon: Blend,
    labelTh: "ไฮบริด",
    labelEn: "Hybrid",
    iconBg: "bg-teal-50",
    iconFg: "text-teal-700",
  },
  {
    href: "/shop?yield=high",
    Icon: Trophy,
    labelTh: "ผลผลิตสูง",
    labelEn: "High yield",
    iconBg: "bg-lime-50",
    iconFg: "text-lime-700",
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
      className="border-b border-zinc-100 bg-zinc-50/40"
      aria-label={navHeading}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {navHeading}
        </p>

        <ul
          className={cn(
            "flex gap-3 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:gap-4 sm:overflow-visible sm:pb-0",
            "sm:grid-cols-3 lg:grid-cols-7",
            "[&::-webkit-scrollbar]:hidden"
          )}
        >
          {QUICK_ITEMS.map(({ href, Icon, labelTh, labelEn, iconBg, iconFg }) => (
            <li
              key={href}
              className="min-w-[5.75rem] shrink-0 snap-start sm:min-w-0"
            >
              <Link
                href={href}
                className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-transform duration-200 hover:scale-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-shadow duration-200 group-hover:shadow-md",
                    iconBg
                  )}
                >
                  <Icon className={cn("h-7 w-7", iconFg)} strokeWidth={1.75} aria-hidden />
                </span>
                <span className="line-clamp-2 max-w-[7rem] text-[11px] font-medium leading-tight text-zinc-800 sm:text-xs">
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
