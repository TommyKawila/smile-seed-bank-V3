"use client";

import { useMemo, useState } from "react";
import { BadgePercent, Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatWholesaleMoney,
  lineTotal,
  resolveTier,
  tierLabel,
  unitPrice,
  type WholesaleCatalogStrain,
  type WholesaleTier,
} from "@/lib/wholesale-public-pricing";
import type { WholesaleCurrency } from "./types";

type Props = {
  currency: WholesaleCurrency;
  catalog: WholesaleCatalogStrain[];
  tiers: WholesaleTier[];
  moq: number;
  onAdd: (strainId: string, name: string, quantity: number) => void;
};

export function StrainPricingGrid({
  currency,
  catalog,
  tiers,
  moq,
  onAdd,
}: Props) {
  const { t } = useLanguage();
  const [qtyById, setQtyById] = useState<Record<string, number>>(() =>
    Object.fromEntries(catalog.map((s) => [s.id, moq]))
  );

  const tierGuide = useMemo(
    () =>
      tiers.map((tier) => {
        const price =
          currency === "THB" ? tier.thbPerSeed : tier.eurPerSeed;
        return {
          ...tier,
          priceLabel: formatWholesaleMoney(price, currency),
        };
      }),
    [currency, tiers]
  );

  return (
    <section id="rfq" className="scroll-mt-24 border-b border-slate-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t("ราคาขายส่งแบบขั้นบันได", "Tiered Wholesale Pricing")}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              {t(
                `ขั้นต่ำ ${moq} เมล็ดต่อสายพันธุ์ — ราคารวมอัปเดตตามจำนวนและสกุลเงินที่เลือก`,
                `Minimum ${moq} seeds per strain — totals update with quantity and currency.`
              )}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {tierGuide.map((tier) => (
            <div
              key={`${tier.id}-${tier.minQty}`}
              className={
                tier.bestValue
                  ? "rounded-xl border-2 border-emerald-500 bg-emerald-50/80 p-4"
                  : "rounded-xl border border-slate-200 bg-slate-50 p-4"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tier {tier.id}
                </p>
                {tier.bestValue ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    <BadgePercent className="h-3 w-3" aria-hidden />
                    Best Value
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {tierLabel(tier)}
              </p>
              <p className="mt-2 text-lg font-bold text-emerald-800">
                {tier.priceLabel}
                <span className="text-sm font-medium text-slate-500">
                  {" "}
                  / seed
                </span>
              </p>
            </div>
          ))}
        </div>

        {catalog.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {t("ยังไม่มีสายพันธุ์ในแคตตาล็อก", "No strains in the catalog yet")}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalog.map((strain) => {
              const qty = qtyById[strain.id] ?? moq;
              const tier = resolveTier(qty, tiers);
              const unit = unitPrice(qty, currency, tiers);
              const total = lineTotal(qty, currency, tiers);
              return (
                <article
                  key={strain.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-slate-900">
                    {strain.name}
                  </h3>
                  <p className="text-sm text-slate-500">{strain.typeLabel}</p>
                  <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("จำนวนเมล็ด", "Quantity (seeds)")}
                    <input
                      type="number"
                      min={moq}
                      step={50}
                      value={qty}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setQtyById((prev) => ({
                          ...prev,
                          [strain.id]: Number.isFinite(n)
                            ? Math.max(moq, Math.floor(n))
                            : moq,
                        }));
                      }}
                      className="mt-1.5 flex h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none ring-emerald-500 focus:ring-2"
                    />
                  </label>
                  <dl className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">{t("ขั้นราคา", "Tier")}</dt>
                      <dd className="font-medium text-slate-800">
                        Tier {tier.id}
                        {tier.bestValue ? " · Best Value" : ""}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">
                        {t("ราคาต่อเมล็ด", "Unit price")}
                      </dt>
                      <dd className="font-semibold text-emerald-800">
                        {formatWholesaleMoney(unit, currency)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                      <dt className="font-medium text-slate-700">
                        {t("ราคารวม", "Line total")}
                      </dt>
                      <dd className="text-base font-bold text-slate-900">
                        {formatWholesaleMoney(total, currency)}
                      </dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => onAdd(strain.id, strain.name, qty)}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    {t("เพิ่มในคำขอใบเสนอราคา", "Add to Quote Request")}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
