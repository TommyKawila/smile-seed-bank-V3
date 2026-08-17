"use client";

import type { SgCatalogStrain, SgCategorySlug } from "@/lib/seeds-genetics-catalog";
import {
  SG_SUPREME_CATEGORY_INFO,
  SG_SUPREME_OVERVIEW,
  sgHasSupremeCategories,
} from "@/lib/seeds-genetics-supreme-copy";
import { SgSupremeInfoButton } from "@/components/share/bulk/SgSupremeInfoButton";
import type { BulkShareStrainPick } from "@/lib/bulk-share-order";

type Group = {
  slug: SgCategorySlug;
  label: string;
  strains: SgCatalogStrain[];
};

type Props = {
  groups: Group[];
  onAddStrain: (pick: BulkShareStrainPick) => void;
  focusedKey?: string | null;
};

export function BulkShareSgStrains({ groups, onAddStrain, focusedKey }: Props) {
  const showSupremeOverview = sgHasSupremeCategories(groups.map((g) => g.slug));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="text-sm font-semibold text-slate-900">สายพันธุ์ (Seeds Genetics)</h2>
        {showSupremeOverview ? (
          <SgSupremeInfoButton info={SG_SUPREME_OVERVIEW} label="Supreme คืออะไร?" compact />
        ) : null}
      </div>
      <p className="mt-1 text-xs text-slate-500">กดชื่อสายเพื่อเพิ่มในตะกร้า</p>
      <div className="mt-3 space-y-4">
        {groups.map((group) => {
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
                  <SgSupremeInfoButton info={supremeInfo} label="อธิบาย" compact />
                ) : null}
              </div>
              <ul className="mt-2 columns-1 gap-x-6 text-sm sm:columns-2">
                {group.strains.map((s) => {
                  const category = s.primaryCategory;
                  const lockedQty = category === "photo-ff" ? 1000 : undefined;
                  const key = `seeds-genetics|${s.name.trim().toLowerCase()}`;
                  const active = focusedKey === key;
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
                            lockedQty,
                          })
                        }
                        className={`rounded px-1 py-0.5 text-left transition-colors hover:bg-emerald-50 hover:text-emerald-800 ${
                          active ? "bg-emerald-100 font-medium text-emerald-900" : "text-slate-700"
                        }`}
                      >
                        {s.name}
                        {lockedQty ? (
                          <span className="text-slate-400"> · FAST · 1,000</span>
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
