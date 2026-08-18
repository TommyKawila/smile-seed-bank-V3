"use client";

import type { PartnerStrainRecord } from "@/types/partner-catalog";
import { sgfStrainsGrouped } from "@/lib/sgf-seeds-display";
import { cartLineKey, type BulkShareStrainPick } from "@/lib/bulk-share-public";
import { BULK_SHARE_COPY, type BulkShareLang } from "@/lib/bulk-share-i18n";
import { strainMatchesQuery } from "@/components/share/bulk/BulkShareStrainSearch";

type Props = {
  strains: PartnerStrainRecord[];
  onAddStrain: (pick: BulkShareStrainPick) => void;
  focusedKey?: string | null;
  lang?: BulkShareLang;
  query?: string;
  cartQtyByKey?: Map<string, number>;
};

export function BulkShareSgfStrains({
  strains,
  onAddStrain,
  focusedKey,
  lang = "th",
  query = "",
  cartQtyByKey,
}: Props) {
  const groups = sgfStrainsGrouped(strains)
    .map((g) => ({
      ...g,
      strains: g.strains.filter((s) => strainMatchesQuery(s.strainName, query)),
    }))
    .filter((g) => g.strains.length > 0);
  const t = BULK_SHARE_COPY[lang];

  if (groups.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{t.sgfStrainsTitle}</h2>
      <p className="mt-1 text-xs text-slate-500">
        {t.tapHint} · {t.sgfFormats}
      </p>
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
                const key = cartLineKey("green-future", s.strainName);
                const active = focusedKey === key;
                const qty = cartQtyByKey?.get(key);
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
                        })
                      }
                      className={`rounded px-1 py-0.5 text-left transition-colors hover:bg-emerald-50 hover:text-emerald-800 ${
                        active ? "bg-emerald-100 font-medium text-emerald-900" : "text-slate-700"
                      }`}
                    >
                      {s.strainName}
                      {qty ? (
                        <span className="text-emerald-700"> · {qty.toLocaleString()}</span>
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
