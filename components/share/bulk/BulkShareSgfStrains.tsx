"use client";

import type { PartnerStrainRecord } from "@/types/partner-catalog";
import { sgfStrainsGrouped } from "@/lib/sgf-seeds-share";

type Props = {
  strains: PartnerStrainRecord[];
};

export function BulkShareSgfStrains({ strains }: Props) {
  const groups = sgfStrainsGrouped(strains);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">สายพันธุ์ (SGF Seeds)</h2>
      <p className="mt-1 text-xs text-slate-500">Photo · Auto · Photo FF</p>
      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.bucket}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.label}{" "}
              <span className="font-normal normal-case text-slate-400">
                ({group.strains.length})
              </span>
            </h3>
            <ul className="mt-2 columns-1 gap-x-6 text-sm text-slate-700 sm:columns-2">
              {group.strains.map((s) => (
                <li key={s.id} className="mb-1 break-inside-avoid">
                  {s.strainName}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
