"use client";

import type { SgCatalogStrain, SgCategorySlug } from "@/lib/seeds-genetics-catalog";
import {
  SG_SUPREME_CATEGORY_INFO,
  SG_SUPREME_OVERVIEW,
  sgHasSupremeCategories,
} from "@/lib/seeds-genetics-supreme-copy";
import { SgSupremeInfoButton } from "@/components/share/bulk/SgSupremeInfoButton";
import { strainMatchesQuery } from "@/components/share/bulk/BulkShareStrainSearch";
import { cartLineKey, type BulkShareStrainPick } from "@/lib/bulk-share-public";
import { BULK_SHARE_COPY, type BulkShareLang } from "@/lib/bulk-share-i18n";

type Group = {
  slug: SgCategorySlug;
  label: string;
  strains: SgCatalogStrain[];
};

type Props = {
  groups: Group[];
  onAddStrain: (pick: BulkShareStrainPick) => void;
  focusedKey?: string | null;
  lang?: BulkShareLang;
  query?: string;
  cartQtyByKey?: Map<string, number>;
};

export function BulkShareSgStrains({
  groups,
  onAddStrain,
  focusedKey,
  lang = "th",
  query = "",
  cartQtyByKey,
}: Props) {
  const filtered = groups
    .map((g) => ({
      ...g,
      strains: g.strains.filter((s) => strainMatchesQuery(s.name, query)),
    }))
    .filter((g) => g.strains.length > 0);
  const showSupremeOverview = sgHasSupremeCategories(filtered.map((g) => g.slug));
  const t = BULK_SHARE_COPY[lang];

  if (filtered.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="text-sm font-semibold text-slate-900">{t.sgStrainsTitle}</h2>
        {showSupremeOverview ? (
          <SgSupremeInfoButton
            info={SG_SUPREME_OVERVIEW}
            label={t.supremeWhat}
            compact
            lang={lang}
          />
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-500">{t.tapHint}</p>
      <div className="mt-3 space-y-4">
        {filtered.map((group) => {
          const supremeInfo = SG_SUPREME_CATEGORY_INFO[group.slug];
          return (
            <div key={group.slug}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group.label}{" "}
                  <span className="font-normal normal-case text-slate-400">
                    ({group.strains.length})
                  </span>
                </h3>
                {supremeInfo ? (
                  <SgSupremeInfoButton
                    info={supremeInfo}
                    label={t.explain}
                    compact
                    lang={lang}
                  />
                ) : null}
              </div>
              <ul className="mt-2 columns-1 gap-x-6 text-sm sm:columns-2">
                {group.strains.map((s) => {
                  const category = s.primaryCategory;
                  const key = cartLineKey("seeds-genetics", s.name);
                  const active = focusedKey === key;
                  const qty = cartQtyByKey?.get(key);
                  return (
                    <li key={s.id} className="mb-1 break-inside-avoid">
                      <button
                        type="button"
                        onClick={() =>
                          onAddStrain({
                            supplierSlug: "seeds-genetics",
                            supplierLabel: "Seeds Genetics",
                            strainName: s.name,
                            category,
                          })
                        }
                        className={`rounded px-1 py-0.5 text-left transition-colors hover:bg-emerald-50 hover:text-emerald-800 ${
                          active ? "bg-emerald-100 font-medium text-emerald-900" : "text-slate-700"
                        }`}
                      >
                        {s.name}
                        {category === "photo-ff" ? (
                          <span className="text-slate-400"> · FAST</span>
                        ) : null}
                        {qty ? (
                          <span className="text-emerald-700"> · {qty.toLocaleString()}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
