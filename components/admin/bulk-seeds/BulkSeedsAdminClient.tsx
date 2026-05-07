"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { FileUp, Loader2, Search, Trash2, Download } from "lucide-react";
import { parseBulkSeedSpreadsheetFile } from "@/lib/bulk-seeds/spreadsheet-import";
import { BULK_SEED_SOURCE_OPTIONS, labelForTierKey } from "@/lib/bulk-seeds/constants";
import { defaultTierKeysForExport } from "@/lib/bulk-seeds/parse-import";
import type { BulkSeedDTO } from "@/lib/bulk-seeds/types";
import { sanitizeBulkSeedList, coerceBulkSeedRow } from "@/lib/bulk-seeds/sanitize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

async function exportPdfLazy(opts: {
  rows: BulkSeedDTO[];
  sourceFilterLabel?: string;
}): Promise<void> {
  const { exportBulkSeedsPdf } = await import("@/components/admin/bulk-seeds/exportBulkSeedsPdf");
  await exportBulkSeedsPdf({ ...opts, rows: sanitizeBulkSeedList(opts.rows) });
}

function TextCell({
  initial,
  onCommit,
  className,
}: {
  initial: string;
  onCommit: (v: string) => Promise<void>;
  className?: string;
}) {
  const [v, setV] = useState(initial);
  useEffect(() => setV(initial), [initial]);
  return (
    <Input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => void onCommit(v)}
      className={cn(
        "h-8 border-zinc-200 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100",
        className
      )}
    />
  );
}

function TierCell({
  initial,
  onCommit,
}: {
  initial: number | null;
  onCommit: (v: number | null) => Promise<void>;
}) {
  const [v, setV] = useState(initial == null ? "" : String(initial));
  useEffect(() => setV(initial == null ? "" : String(initial)), [initial]);
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const t = v.trim();
        if (t === "") void onCommit(null);
        else {
          const n = parseFloat(t.replace(/,/g, ""));
          void onCommit(Number.isFinite(n) ? n : null);
        }
      }}
      className="h-8 w-[4.25rem] min-w-[4rem] border-zinc-200 bg-white px-1.5 font-mono text-[11px] tabular-nums dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 sm:w-[4.75rem]"
    />
  );
}

export function BulkSeedsAdminClient() {
  const { toast } = useToast();
  const [rows, setRows] = useState<BulkSeedDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const debouncedSearch = useDebouncedCallback((v: string) => setQDebounced(v), 350);
  useEffect(() => {
    debouncedSearch(q);
  }, [q, debouncedSearch]);
  const [sourceKind, setSourceKind] = useState<string>("all");
  const [importTarget, setImportTarget] = useState<string>(
    BULK_SEED_SOURCE_OPTIONS[0]?.value ?? "auto_fem"
  );
  const [replaceImport, setReplaceImport] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const safeRows = useMemo(() => sanitizeBulkSeedList(rows), [rows]);

  const tierKeys = useMemo(
    () => defaultTierKeysForExport(safeRows.map((r) => r.tier_prices)),
    [safeRows]
  );

  const tableColSpan = 8 + tierKeys.length;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (qDebounced.trim()) params.set("q", qDebounced.trim());
      if (sourceKind !== "all") params.set("sourceKind", sourceKind);
      params.set("take", "2500");
      const res = await fetch(`/api/admin/bulk-seeds?${params}`, { cache: "no-store" });
      const data = (await res.json()) as { rows?: BulkSeedDTO[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setRows(sanitizeBulkSeedList(data.rows));
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Bulk seeds",
        description: e instanceof Error ? e.message : "Could not load",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [qDebounced, sourceKind, toast]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const patchRow = async (id: string, patch: Partial<BulkSeedDTO>) => {
    const prev = rows;
    setRows((r) =>
      sanitizeBulkSeedList(
        r.map((x) =>
          x?.id === id ? { ...x, ...patch, tier_prices: patch.tier_prices ?? x.tier_prices } : x
        )
      )
    );
    try {
      const res = await fetch(`/api/admin/bulk-seeds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: patch.code,
          strain: patch.strain,
          thc: patch.thc,
          cycle: patch.cycle,
          type: patch.type,
          flavor: patch.flavor,
          tier_prices: patch.tier_prices,
        }),
      });
      const data = (await res.json()) as { row?: BulkSeedDTO; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      const next = coerceBulkSeedRow(data.row);
      if (next) {
        setRows((cur) => sanitizeBulkSeedList(cur.map((x) => (x?.id === id ? next : x))));
      }
    } catch (e) {
      setRows(prev);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: e instanceof Error ? e.message : "Error",
      });
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this bulk seed row?")) return;
    try {
      const res = await fetch(`/api/admin/bulk-seeds/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Delete failed");
      }
      setRows((r) => r.filter((x) => x?.id !== id));
      toast({ title: "Deleted" });
    } catch (e) {
      toast({
        variant: "destructive",
        description: e instanceof Error ? e.message : "Delete failed",
      });
    }
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    setUploadBusy(true);
    try {
      const parsed = await parseBulkSeedSpreadsheetFile(f);
      if (!parsed.length) throw new Error("No data rows parsed — check headers (ID, code, strain, …)");
      const normalized = parsed.map((r) => ({
        external_id: r.external_id,
        code: r.code,
        strain: r.strain,
        thc: r.thc,
        cycle: r.cycle,
        type: r.type,
        flavor: r.flavor,
        tier_prices: r.tier_prices,
      }));
      const res = await fetch("/api/admin/bulk-seeds/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceKind: importTarget,
          replace: replaceImport,
          rows: normalized,
        }),
      });
      const data = (await res.json()) as { inserted?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      toast({
        title: "Import complete",
        description: `${data.inserted ?? 0} row(s) written`,
      });
      await fetchRows();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setUploadBusy(false);
    }
  };

  const sourceLabelPdf =
    sourceKind === "all"
      ? "All sheets"
      : BULK_SEED_SOURCE_OPTIONS.find((o) => o.value === sourceKind)?.label ?? sourceKind;

  return (
    <div className="mx-auto max-w-[100vw] space-y-5 px-1 pb-24 sm:px-0 lg:pb-12">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Wholesale
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bulk seeds price list
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Admin only — CSV / XLSX import, edit tiers inline, PDF export with Smile Seed Bank
            branding.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || safeRows.length === 0}
          onClick={() =>
            void exportPdfLazy({
              rows: safeRows,
              sourceFilterLabel: sourceLabelPdf,
            })
          }
          className="shrink-0 gap-2 border-emerald-800/40 text-emerald-900 hover:bg-emerald-950/10 dark:border-emerald-600/40 dark:text-emerald-100"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search strain or code…"
            className="h-9 border-zinc-200 pl-9 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <Select value={sourceKind} onValueChange={setSourceKind}>
          <SelectTrigger className="w-full border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 sm:w-[200px]">
            <SelectValue placeholder="Sheet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sheets</SelectItem>
            {BULK_SEED_SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Select value={importTarget} onValueChange={setImportTarget}>
            <SelectTrigger className="w-full border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 sm:w-[180px]">
              <SelectValue placeholder="Import into" />
            </SelectTrigger>
            <SelectContent>
              {BULK_SEED_SOURCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  Import → {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={replaceImport}
              onChange={(e) => setReplaceImport(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600"
            />
            Replace all rows for this sheet
          </label>
          <label
            className={cn(
              "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900",
              uploadBusy && "pointer-events-none opacity-60"
            )}
          >
            {uploadBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Upload CSV / XLSX
            <input
              type="file"
              accept=".csv,.xlsx,.xlsm,text/csv"
              className="sr-only"
              disabled={uploadBusy}
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="max-h-[min(70vh,720px)] w-full overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-zinc-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : (
            <Table className="min-w-[960px] text-xs lg:text-[13px]">
              <TableHeader>
                <TableRow className="border-zinc-200 hover:bg-transparent dark:border-zinc-800">
                  <TableHead className="sticky left-0 z-20 w-28 border-r border-zinc-100 bg-white font-semibold shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    Sheet
                  </TableHead>
                  <TableHead className="sticky left-28 z-20 min-w-[10rem] border-r border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    Strain
                  </TableHead>
                  <TableHead className="min-w-[4.5rem]">Code</TableHead>
                  <TableHead className="min-w-[3.5rem]">THC</TableHead>
                  <TableHead className="min-w-[3.5rem]">Cycle</TableHead>
                  <TableHead className="min-w-[5rem]">Type</TableHead>
                  <TableHead className="min-w-[5rem]">Flavor</TableHead>
                  {tierKeys.map((k) => (
                    <TableHead key={k} className="min-w-[5rem] text-right tabular-nums">
                      {labelForTierKey(k)}
                    </TableHead>
                  ))}
                  <TableHead className="w-10" aria-label="Delete" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableColSpan}
                      className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  safeRows.map((r) => {
                    const tp = r.tier_prices ?? {};
                    return (
                      <TableRow
                        key={r.id}
                        className="border-zinc-100 dark:border-zinc-900 dark:hover:bg-zinc-900/40"
                      >
                        <TableCell className="sticky left-0 z-10 whitespace-nowrap border-r border-zinc-100 bg-zinc-50/95 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/98 dark:text-zinc-400">
                          {BULK_SEED_SOURCE_OPTIONS.find((o) => o.value === r?.source_kind)
                            ?.label ?? r?.source_kind}
                        </TableCell>
                        <TableCell className="sticky left-28 z-10 border-r border-zinc-100 bg-zinc-50/95 py-2 dark:border-zinc-800 dark:bg-zinc-950/98">
                          <TextCell
                            initial={r?.strain ?? ""}
                            onCommit={(strain) =>
                              strain === (r?.strain ?? "")
                                ? Promise.resolve()
                                : patchRow(r.id, { strain })
                            }
                            className="min-w-[140px]"
                          />
                        </TableCell>
                        <TableCell>
                          <TextCell
                            initial={r?.code ?? ""}
                            onCommit={(code) =>
                              code === (r?.code ?? "")
                                ? Promise.resolve()
                                : patchRow(r.id, { code })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextCell
                            initial={r?.thc ?? ""}
                            onCommit={(thc) =>
                              thc === (r?.thc ?? "")
                                ? Promise.resolve()
                                : patchRow(r.id, { thc })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextCell
                            initial={r?.cycle ?? ""}
                            onCommit={(cycle) =>
                              cycle === (r?.cycle ?? "")
                                ? Promise.resolve()
                                : patchRow(r.id, { cycle })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextCell
                            initial={r?.type ?? ""}
                            onCommit={(type) =>
                              type === (r?.type ?? "")
                                ? Promise.resolve()
                                : patchRow(r.id, { type })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextCell
                            initial={r?.flavor ?? ""}
                            onCommit={(flavor) =>
                              flavor === (r?.flavor ?? "")
                                ? Promise.resolve()
                                : patchRow(r.id, { flavor })
                            }
                          />
                        </TableCell>
                        {tierKeys.map((k) => (
                          <TableCell key={`${r.id}_${k}`} className="p-2 text-right">
                            <TierCell
                              initial={tp[k] ?? null}
                              onCommit={(val) => {
                                const prev = tp[k] ?? null;
                                if (val === prev) return Promise.resolve();
                                return patchRow(r.id, {
                                  tier_prices: { ...tp, [k]: val },
                                });
                              }}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                            onClick={() => void onDelete(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
