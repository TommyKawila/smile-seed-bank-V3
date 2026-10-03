"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/context/LanguageContext";
import type { WholesaleCatalogStrain } from "@/lib/wholesale-public-pricing";

type Group = "all" | "auto" | "photo";

type Props = {
  catalog: WholesaleCatalogStrain[];
  valueId: string;
  onSelect: (strain: WholesaleCatalogStrain) => void;
};

function formatLabel(c: WholesaleCatalogStrain): string {
  return c.seedFormat === "FEM" ? "Photo" : "Auto";
}

function rowTitle(c: WholesaleCatalogStrain): string {
  const code = (c.varietyCode ?? c.id).trim();
  const name = c.name.trim();
  if (!code) return name;
  if (name.toLowerCase().startsWith(code.toLowerCase())) return name;
  return `${code} · ${name}`;
}

export function WholesaleStrainPicker({ catalog, valueId, onSelect }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group>("all");

  const selected = catalog.find((c) => c.id === valueId) ?? catalog[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((c) => {
      if (group === "auto" && c.seedFormat === "FEM") return false;
      if (group === "photo" && c.seedFormat !== "FEM") return false;
      if (!q) return true;
      const hay = `${c.name} ${c.varietyCode ?? ""} ${c.typeLabel} ${c.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, query, group]);

  const sections = useMemo(() => {
    const auto = filtered.filter((c) => c.seedFormat !== "FEM");
    const photo = filtered.filter((c) => c.seedFormat === "FEM");
    return [
      {
        key: "auto",
        label: "Auto",
        rows: auto,
      },
      {
        key: "photo",
        label: "Photo",
        rows: photo,
      },
    ].filter((s) => s.rows.length > 0);
  }, [filtered]);

  const pick = (strain: WholesaleCatalogStrain) => {
    onSelect(strain);
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500">
        {t("สายพันธุ์", "Strain")}
      </label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-left text-sm text-slate-900"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {selected?.name ?? t("เลือกสายพันธุ์", "Select a strain")}
          </span>
          {selected ? (
            <span className="mt-0.5 block text-xs text-slate-500">
              {(selected.varietyCode ?? selected.id).trim()}
              {" · "}
              {formatLabel(selected)}
            </span>
          ) : null}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[90vh] max-h-[90vh] flex-col gap-0 overflow-hidden rounded-t-2xl bg-white p-0 text-slate-900"
        >
          <SheetHeader className="border-b border-slate-100 px-4 pb-3 pt-5 text-left">
            <SheetTitle className="text-slate-900">
              {t("เลือกสายพันธุ์", "Choose a strain")}
            </SheetTitle>
            <SheetDescription className="text-slate-600">
              {t(
                `${catalog.length.toLocaleString("en-US")} สาย · เลื่อนหรือค้นหาได้เลย`,
                `${catalog.length.toLocaleString("en-US")} strains · scroll or search`
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="sticky top-0 z-10 space-y-2 border-b border-slate-100 bg-white px-4 py-3">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("ค้นหารหัสหรือชื่อสาย…", "Search code or strain name…")}
              className="h-12 border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400"
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", t("ทั้งหมด", "All")],
                  ["auto", "Auto"],
                  ["photo", "Photo"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setGroup(id)}
                  className={`min-h-12 rounded-lg border px-3 text-xs font-semibold ${
                    group === id
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
            {sections.length === 0 ? (
              <p className="px-3 py-6 text-sm text-slate-500">
                {t("ไม่พบสายพันธุ์", "No strains found")}
              </p>
            ) : (
              sections.map((section) => (
                <div key={section.key} className="pt-3">
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {section.label}
                  </p>
                  <ul>
                    {section.rows.map((c) => {
                      const active = c.id === valueId;
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => pick(c)}
                            className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                              active ? "bg-emerald-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-900">
                                {rowTitle(c)}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {formatLabel(c)}
                              </span>
                            </span>
                            {active ? (
                              <Check
                                className="h-4 w-4 shrink-0 text-emerald-700"
                                aria-hidden
                              />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
