"use client";

import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import type { WholesaleCurrency } from "./types";

type Props = {
  currency: WholesaleCurrency;
  onChange: (c: WholesaleCurrency) => void;
};

export function CurrencyToggle({ currency, onChange }: Props) {
  const { t } = useLanguage();
  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
      role="group"
      aria-label={t("สกุลเงินราคา", "Price currency")}
    >
      {(
        [
          { id: "THB" as const, label: t("แสดงราคาเป็นบาท (฿)", "Show Prices in THB (฿)") },
          { id: "EUR" as const, label: t("แสดงราคาเป็นยูโร (€)", "Show Prices in EUR (€)") },
        ] as const
      ).map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "min-h-12 rounded-md px-3 text-sm font-semibold transition sm:px-4",
            currency === opt.id
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
          aria-pressed={currency === opt.id}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
