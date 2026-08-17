"use client";

import type { PartnerStrainRecord } from "@/types/partner-catalog";
import { sgfStrainsGrouped } from "@/lib/sgf-seeds-share";
import type { BulkShareStrainPick } from "@/lib/bulk-share-order";

type Props = {
  strains: PartnerStrainRecord[];
  onAddStrain: (pick: BulkShareStrainPick) => void;
  focusedKey?: string | null;
};

export function BulkShareSgfStrains({ strains, onAddStrain, focusedKey }: Props) {
  const groups = sgfStrainsGrouped(strains);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">สายพันธุ์ (SGF Seeds)</h2>
      <p className="mt-1 text-xs text-slate-500">กดชื่อสายเพื่อเพิ่มในตะกร้า · Photo · Auto · Photo FF</p>
      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.bucket}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.label}{" "}
              <span className="font-normal normal-case text-slate-400">
                ({group.strains.length})
              </span>
            </h3>
            <ul className="mt-2 columns-1 gap-x-6 text-sm sm:columns-2">
              {group.strains.map((s) => {
                const category = group.bucket;
                const lockedQty = category === "photo-ff" ? 1000 : undefined;
                const key = `green-future|${s.strainName.trim().toLowerCase()}`;
                const active = focusedKey === key;
                return (
                  <li key={s.id} className="mb-1 break-inside-avoid">
                    <button
                      type="button"
                      onClick={() =>
                        onAddStrain({
                          supplierSlug: "green-future",
                          supplierLabel: "SGF Seeds",
                          strainName: s.strainName,
                          category,
                          lockedQty,
                        })
                      }
                      className={`rounded px-1 py-0.5 text-left transition-colors hover:bg-emerald-50 hover:text-emerald-800 ${
                        active ? "bg-emerald-100 font-medium text-emerald-900" : "text-slate-700"
                      }`}
                    >
                      {s.strainName}
                      {lockedQty ? (
                        <span className="text-slate-400"> · 1,000</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
