"use client";

import { Sprout } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getPhoto3nAdvantageCopy } from "@/lib/photo-3n-copy";

export function Photo3nAdvantageBox() {
  const { locale } = useLanguage();
  const copy = getPhoto3nAdvantageCopy(locale);

  return (
    <aside
      className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 surface-glass sm:p-6"
      aria-label={copy.heading}
    >
      <div className="flex items-start gap-2.5">
        <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {copy.heading}
          </h3>
          <ul className="mt-3 space-y-3">
            {copy.bullets.map((item) => (
              <li key={item.title} className="text-sm leading-relaxed text-foreground/75">
                <span className="font-semibold text-foreground">{item.title}:</span>{" "}
                {item.body}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
