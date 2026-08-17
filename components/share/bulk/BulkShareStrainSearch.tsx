"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BULK_SHARE_MIN_QTY, BULK_SHARE_PHOTO_FF_QTY, cartLineKey } from "@/lib/bulk-share-order";
import { BULK_SHARE_COPY, type BulkShareLang } from "@/lib/bulk-share-i18n";
import type { BulkShareStrainPick } from "@/lib/bulk-share-order";

export type StrainSearchEntry = BulkShareStrainPick & { id: string };

type Props = {
  entries: StrainSearchEntry[];
  query: string;
  onQueryChange: (q: string) => void;
  onAddStrain: (pick: BulkShareStrainPick) => void;
  cartQtyByKey: Map<string, number>;
  focusedKey?: string | null;
  lang: BulkShareLang;
};

export function BulkShareStrainSearch({
  entries,
  query,
  onQueryChange,
  onAddStrain,
  cartQtyByKey,
  focusedKey,
  lang,
}: Props) {
  const t = BULK_SHARE_COPY[lang];
  const q = query.trim().toLowerCase();
  const results = q
    ? entries.filter((e) => e.strainName.toLowerCase().includes(q)).slice(0, 24)
    : [];

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
      <p className="text-sm font-medium leading-relaxed text-emerald-950">{t.tapCallout}</p>
      <p className="mt-1 text-xs text-emerald-800/80">{t.photoFfNote}</p>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="border-slate-200 bg-white pl-9"
          aria-label={t.searchLabel}
        />
      </div>
      {q ? (
        results.length > 0 ? (
          <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
            {results.map((entry) => {
              const key = cartLineKey(entry.supplierSlug, entry.strainName);
              const inCart = cartQtyByKey.get(key);
              const active = focusedKey === key;
              const step = entry.lockedQty ? BULK_SHARE_PHOTO_FF_QTY : BULK_SHARE_MIN_QTY;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onAddStrain(entry)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-emerald-50 ${
                      active ? "bg-emerald-100 font-medium text-emerald-900" : "text-slate-800"
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      <span className="text-slate-500">{entry.supplierLabel} · </span>
                      {entry.strainName}
                    </span>
                    <span className="shrink-0 text-xs text-emerald-700">
                      {inCart ? `${inCart.toLocaleString()} · ` : ""}+{step.toLocaleString()}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-500">{t.searchNoResults}</p>
        )
      ) : null}
    </section>
  );
}

export function strainMatchesQuery(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q);
}
