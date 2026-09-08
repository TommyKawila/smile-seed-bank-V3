"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SgSupremeInfoButton } from "@/components/share/bulk/SgSupremeInfoButton";
import { strainMatchesQuery } from "@/components/share/bulk/BulkShareStrainSearch";
import {
  BULK_SHARE_FORMAT_TAB_ORDER,
  defaultFormatTab,
  sgCategoryToFormatTab,
  type BulkShareFormatTab,
} from "@/lib/bulk-share-format-tabs";
import {
  BULK_SHARE_MIN_QTY,
  cartLineKey,
  type BulkShareStrainPick,
} from "@/lib/bulk-share-order";
import { BULK_SHARE_COPY, type BulkShareLang } from "@/lib/bulk-share-i18n";
import { sgfStrainsGrouped } from "@/lib/sgf-seeds-share";
import {
  SG_SUPREME_CATEGORY_INFO,
  SG_SUPREME_OVERVIEW,
  sgHasSupremeCategories,
} from "@/lib/seeds-genetics-supreme-copy";
import type { SgCatalogStrain, SgCategorySlug } from "@/lib/seeds-genetics-catalog";
import type { PartnerStrainRecord } from "@/types/partner-catalog";

type SgGroup = {
  slug: SgCategorySlug;
  label: string;
  strains: SgCatalogStrain[];
};

type CatalogEntry = BulkShareStrainPick & {
  id: string;
  formatTab: BulkShareFormatTab;
  sgSlug?: SgCategorySlug;
};

type Props = {
  sgfStrains: PartnerStrainRecord[];
  sgGroups: SgGroup[];
  onAddStrain: (pick: BulkShareStrainPick) => void;
  focusedKey?: string | null;
  cartQtyByKey: Map<string, number>;
  lang: BulkShareLang;
  query: string;
  onQueryChange: (q: string) => void;
};

export function BulkShareStrainCatalog({
  sgfStrains,
  sgGroups,
  onAddStrain,
  focusedKey,
  cartQtyByKey,
  lang,
  query,
  onQueryChange,
}: Props) {
  const t = BULK_SHARE_COPY[lang];
  const tabLabel: Record<BulkShareFormatTab, string> = {
    photo: t.tabPhoto,
    autoflower: t.tabAuto,
    "photo-ff": t.tabFf,
  };

  const entries = useMemo(() => {
    const list: CatalogEntry[] = [];
    for (const g of sgfStrainsGrouped(sgfStrains)) {
      for (const s of g.strains) {
        list.push({
          id: `gf-${s.id}`,
          supplierSlug: "green-future",
          supplierLabel: "SGF Seeds",
          strainName: s.strainName,
          category: g.bucket,
          formatTab: g.bucket,
        });
      }
    }
    for (const g of sgGroups) {
      const formatTab = sgCategoryToFormatTab(g.slug);
      for (const s of g.strains) {
        list.push({
          id: `sg-${s.id}`,
          supplierSlug: "seeds-genetics",
          supplierLabel: "Seeds Genetics",
          strainName: s.name,
          category: s.primaryCategory,
          formatTab,
          sgSlug: g.slug,
        });
      }
    }
    return list.sort((a, b) => a.strainName.localeCompare(b.strainName));
  }, [sgfStrains, sgGroups]);

  const tabCounts = useMemo(() => {
    const counts: Partial<Record<BulkShareFormatTab, number>> = {};
    for (const e of entries) {
      counts[e.formatTab] = (counts[e.formatTab] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  const [activeTab, setActiveTab] = useState<BulkShareFormatTab>("photo");

  useEffect(() => {
    setActiveTab(defaultFormatTab(tabCounts));
  }, [tabCounts]);

  const q = query.trim();
  const searchActive = q.length > 0;

  const visible = useMemo(() => {
    return entries.filter((e) => {
      if (!strainMatchesQuery(e.strainName, query)) return false;
      if (searchActive) return true;
      return e.formatTab === activeTab;
    });
  }, [entries, query, searchActive, activeTab]);

  const showSupremeOverview =
    sgGroups.length > 0 && sgHasSupremeCategories(sgGroups.map((g) => g.slug));
  const hasBothSuppliers = sgfStrains.length > 0 && sgGroups.length > 0;

  if (entries.length === 0) return null;

  const visibleTabs = BULK_SHARE_FORMAT_TAB_ORDER.filter((tab) => (tabCounts[tab] ?? 0) > 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-sm font-semibold text-slate-900">
            {sgfStrains.length > 0 && sgGroups.length === 0
              ? t.sgfStrainsTitle
              : sgGroups.length > 0 && sgfStrains.length === 0
                ? t.sgStrainsTitle
                : t.strainsTitleBoth}
          </h2>
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
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
          {t.catalogDisclaimer}
        </p>
      </div>

      <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <p className="mb-2 text-xs text-slate-500">{t.tapCallout}</p>
        <div className="relative">
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
        {!searchActive ? (
          <div
            className="mt-3 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
            role="tablist"
            aria-label={t.formatTabsLabel}
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`min-h-12 flex-1 rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm ${
                  activeTab === tab
                    ? "bg-[#12463e] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                {tabLabel[tab]}
                <span className="ml-1 font-normal opacity-80">({tabCounts[tab] ?? 0})</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="p-4">
        {visible.length === 0 ? (
          <p className="text-center text-sm text-slate-500">{t.searchNoResults}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {visible.map((entry) => {
              const key = cartLineKey(entry.supplierSlug, entry.strainName);
              const active = focusedKey === key;
              const qty = cartQtyByKey.get(key);
              const supremeInfo =
                entry.sgSlug != null ? SG_SUPREME_CATEGORY_INFO[entry.sgSlug] : undefined;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onAddStrain(entry)}
                    className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50"
                    }`}
                  >
                    <span className="min-w-0">
                      {hasBothSuppliers ? (
                        <span className="block text-[10px] uppercase tracking-wide text-slate-400">
                          {entry.supplierLabel}
                        </span>
                      ) : null}
                      <span className="font-medium leading-snug">{entry.strainName}</span>
                      {entry.category === "photo-ff" ? (
                        <span className="text-slate-400"> · FAST</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs font-mono text-emerald-700">
                      {qty ? `${qty.toLocaleString()} · ` : ""}+{BULK_SHARE_MIN_QTY}
                    </span>
                  </button>
                  {supremeInfo ? (
                    <div className="mt-1 pl-1">
                      <SgSupremeInfoButton
                        info={supremeInfo}
                        label={t.explain}
                        compact
                        lang={lang}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
