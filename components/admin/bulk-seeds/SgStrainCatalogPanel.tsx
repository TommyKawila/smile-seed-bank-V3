"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SEEDS_GENETICS_CATALOG,
  filterSgCatalog,
  sgCatalogFetchedLabel,
} from "@/lib/seeds-genetics-catalog";

type Props = {
  compact?: boolean;
};

export function SgStrainCatalogPanel({ compact = false }: Props) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => filterSgCatalog(query), [query]);
  const total = SEEDS_GENETICS_CATALOG.strains.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Seeds Genetics — ลิสต์สายพันธุ์ ({total})
          </h3>
          <p className="text-xs text-slate-500">
            กวาดจากเว็บสาธารณะ · อัปเดต {sgCatalogFetchedLabel()} · แยกหมวดรอคัด
          </p>
        </div>
        {!compact ? (
          <div className="w-full sm:max-w-xs">
            <Label className="sr-only" htmlFor="sg-strain-search">
              ค้นหาสายพันธุ์
            </Label>
            <Input
              id="sg-strain-search"
              placeholder="ค้นหาชื่อสายพันธุ์…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <section
            key={group.slug}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.label}{" "}
              <span className="font-normal normal-case text-slate-400">
                ({group.strains.length})
              </span>
            </h4>
            <ul className="mt-2 columns-1 gap-x-4 text-sm text-slate-700 sm:columns-2 lg:columns-3">
              {group.strains.map((s) => (
                <li key={s.id} className="mb-1 break-inside-avoid">
                  {s.name}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.length === 0 ? (
          <p className="text-sm text-slate-500">ไม่พบสายพันธุ์ที่ตรงคำค้น</p>
        ) : null}
      </div>
    </div>
  );
}
