"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGreenFutureCatalog } from "@/hooks/useGreenFutureCatalog";
import type { PartnerSeedFormat, PartnerStrainRecord } from "@/types/partner-catalog";

type Props = {
  compact?: boolean;
};

const GF_FORMAT_ORDER: PartnerSeedFormat[] = ["AUTO_FEM", "FEM"];

const GF_FORMAT_LABEL: Record<PartnerSeedFormat, string> = {
  AUTO_FEM: "Auto FEM",
  FEM: "FEM",
};

function groupGfStrains(strains: PartnerStrainRecord[], query: string) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? strains.filter((s) => {
        const hay = `${s.varietyCode} ${s.strainName} ${s.typeLabel ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
    : strains;

  return GF_FORMAT_ORDER.map((format) => ({
    format,
    label: GF_FORMAT_LABEL[format],
    strains: filtered.filter((s) => s.seedFormat === format),
  })).filter((g) => g.strains.length > 0);
}

export function GfStrainCatalogPanel({ compact = false }: Props) {
  const [query, setQuery] = useState("");
  const { loading, strains, total, priceList, error } = useGreenFutureCatalog({
    q: "",
    format: "ALL",
    stock: "ALL",
    ista: "ALL",
  });

  const groups = useMemo(() => groupGfStrains(strains, query), [strains, query]);
  const shown = groups.reduce((n, g) => n + g.strains.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Green Future — ลิสต์สายพันธุ์ ({loading ? "…" : total})
          </h3>
          <p className="text-xs text-slate-500">
            จาก catalog Green Future (DB)
            {priceList?.refCode ? ` · ${priceList.refCode}` : ""}
            {priceList?.issuedAt
              ? ` · ${new Date(priceList.issuedAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}`
              : ""}
          </p>
        </div>
        {!compact ? (
          <div className="w-full sm:max-w-xs">
            <Label className="sr-only" htmlFor="gf-strain-search">
              ค้นหาสายพันธุ์
            </Label>
            <Input
              id="gf-strain-search"
              placeholder="ค้นหารหัส / ชื่อสายพันธุ์…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังโหลด…
        </p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section
              key={group.format}
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
                    <span className="font-mono text-[11px] text-slate-400">{s.varietyCode}</span>{" "}
                    {s.strainName}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">ไม่พบสายพันธุ์ที่ตรงคำค้น</p>
          ) : query.trim() && shown < total ? (
            <p className="text-xs text-slate-400">
              แสดง {shown} จาก {total} สาย
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
