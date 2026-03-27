"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Papa from "papaparse";
import {
  ArrowLeft,
  CircleStop,
  Download,
  Eye,
  Loader2,
  Play,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  formatPackQtyPriceCell,
  normalizeByPackForImport,
  parseSheetRowsToImportRows,
  IMPORT_PACK_SIZES,
  type ParsedImportSheetRow,
} from "@/lib/ai-import-sheet-parse";
import {
  saveManualGridImport,
  type ManualGridImportDraft,
} from "@/lib/manual-grid-import-handoff";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type RowStatus = "idle" | "queued" | "running" | "done" | "error" | "skipped";

type SeoLocalePreview = {
  title?: string | null;
  description?: string | null;
};

type ExtractedPreview = {
  description_th?: string | null;
  thc_percent?: number | null;
  name?: string | null;
  genetic_ratio?: string | null;
  image_url?: string | null;
  additional_images?: string[];
  images?: string[];
  seo?: {
    th?: SeoLocalePreview;
    en?: SeoLocalePreview;
  } | null;
};

type ApiSuccess = {
  ok: true;
  mode: string;
  productId: string | null;
  breederId: string;
  masterSku: string;
  extracted: ExtractedPreview;
  scrapeError: string | null;
};

type ImportRow = ParsedImportSheetRow & { result?: ApiSuccess };

function migrateStoredImportRow(raw: unknown): ImportRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const status = r.status as RowStatus | undefined;
  if (!r.id || typeof r.id !== "string") return null;
  const base: ParsedImportSheetRow = {
    id: r.id as string,
    rowKind: (r.rowKind as ParsedImportSheetRow["rowKind"]) ?? "product",
    name: String(r.name ?? ""),
    displayName: String(r.displayName ?? r.name ?? ""),
    breeder: String(r.breeder ?? ""),
    url: String(r.url ?? ""),
    geneticType: String(r.geneticType ?? ""),
    section: String(r.section ?? (r as { sheetCategory?: string }).sheetCategory ?? ""),
    masterSku: String(r.masterSku ?? ""),
    price: Number(r.price) || 0,
    stock: Number(r.stock) || 0,
    byPack:
      r.byPack && typeof r.byPack === "object" && !Array.isArray(r.byPack)
        ? normalizeByPackForImport(r.byPack as Record<string, { stock: number; price: number }>)
        : normalizeByPackForImport({}),
    status: status ?? "idle",
    errorMessage: r.errorMessage != null ? String(r.errorMessage) : undefined,
  };
  return { ...base, result: r.result as ApiSuccess | undefined };
}

const LS_AI_IMPORT = "ai-import-state-v1";

function extractedImageList(ex: ExtractedPreview): string[] {
  if (ex.images?.length) return ex.images.slice(0, 5);
  const out: string[] = [];
  if (ex.image_url?.trim()) out.push(ex.image_url.trim());
  for (const u of ex.additional_images ?? []) {
    if (out.length >= 5) break;
    const t = u.trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

function playSoftChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.1);
  } catch {
    /* ignore */
  }
}

function geneticTypeToDominance(t: string): string | null {
  const u = t.trim().toUpperCase();
  if (!u) return null;
  if (u.includes("INDICA") && !u.includes("SATIVA")) return "Mostly Indica";
  if (u.includes("SATIVA") && !u.includes("INDICA")) return "Mostly Sativa";
  if (u.includes("HYBRID") || u.includes("50/50") || u.includes("50-50")) return "Hybrid 50/50";
  return null;
}

function buildManualDraftsFromRows(selected: ImportRow[]): ManualGridImportDraft[] {
  return selected.map((r) => {
    let byPack = normalizeByPackForImport(
      r.byPack as Record<string, { stock: number; price: number }> | undefined
    );
    const hasAny = Object.values(byPack).some((c) => c.stock > 0 || c.price > 0);
    if (!hasAny && (r.stock > 0 || r.price > 0)) {
      byPack = normalizeByPackForImport({ 1: { stock: r.stock, price: r.price } });
    }
    const full: Record<number, { stock: number; cost: number; price: number }> = {};
    const extraKeys = Object.keys(byPack)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    const allKeys = new Set<number>([...IMPORT_PACK_SIZES, ...extraKeys]);
    for (const pk of [...allKeys].sort((a, b) => a - b)) {
      const v = byPack[pk];
      full[pk] = { stock: v?.stock ?? 0, cost: 0, price: v?.price ?? 0 };
    }
    return {
      name: r.displayName || r.name,
      masterSku: r.masterSku || "",
      category: r.section || undefined,
      strainDominance: geneticTypeToDominance(r.geneticType),
      byPack: full,
    };
  });
}

function statusBadge(status: RowStatus) {
  const map: Record<RowStatus, { label: string; className: string }> = {
    idle: { label: "Ready", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
    queued: { label: "Queued", className: "bg-amber-50 text-amber-800 border-amber-200" },
    running: { label: "Importing…", className: "bg-sky-50 text-sky-800 border-sky-200" },
    done: { label: "Done", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    error: { label: "Error", className: "bg-red-50 text-red-800 border-red-200" },
    skipped: { label: "Skipped", className: "bg-zinc-50 text-zinc-500 border-zinc-200" },
  };
  const m = map[status];
  return (
    <Badge variant="outline" className={cn("font-normal", m.className)}>
      {m.label}
    </Badge>
  );
}

export default function AiImportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [pasteCsv, setPasteCsv] = useState("");
  const [fetching, setFetching] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [breeders, setBreeders] = useState<{ id: number; name: string }[]>([]);
  const [targetBreederId, setTargetBreederId] = useState("");
  const [selectedManualIds, setSelectedManualIds] = useState<Set<string>>(new Set());

  const [bulkRunning, setBulkRunning] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [showReviewEach, setShowReviewEach] = useState(false);
  const [review, setReview] = useState<ImportRow | null>(null);
  const reviewContinueRef = useRef<(() => void) | null>(null);
  const bulkAbortRef = useRef<AbortController | null>(null);
  const bulkStopRequestedRef = useRef(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_AI_IMPORT);
      if (raw) {
        const p = JSON.parse(raw) as {
          sheetUrl?: string;
          pasteCsv?: string;
          rows?: ImportRow[];
        };
        if (typeof p.sheetUrl === "string") setSheetUrl(p.sheetUrl);
        if (typeof p.pasteCsv === "string") setPasteCsv(p.pasteCsv);
        if (Array.isArray(p.rows) && p.rows.length > 0) {
          const migrated = p.rows
            .map((x) => migrateStoredImportRow(x))
            .filter((x): x is ImportRow => x != null);
          if (migrated.length) setRows(migrated);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    fetch("/api/admin/breeders")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { id?: number; name?: string }[]) => {
        if (Array.isArray(data)) {
          setBreeders(
            data
              .filter((b) => b.id != null && b.name != null)
              .map((b) => ({ id: Number(b.id), name: String(b.name) }))
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setRows((prev) =>
      prev.some((r) => r.status === "running")
        ? prev.map((r) =>
            r.status === "running"
              ? { ...r, status: "idle" as const, errorMessage: undefined }
              : r
          )
        : prev
    );
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (rows.length === 0 && !sheetUrl && !pasteCsv) {
        localStorage.removeItem(LS_AI_IMPORT);
        return;
      }
      localStorage.setItem(
        LS_AI_IMPORT,
        JSON.stringify({ sheetUrl, pasteCsv, rows })
      );
    } catch {
      /* ignore */
    }
  }, [hydrated, rows, sheetUrl, pasteCsv]);

  const importableRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.rowKind === "product" &&
          r.status !== "skipped" &&
          r.name.trim() &&
          r.breeder.trim() &&
          r.url.trim() &&
          /^https?:\/\//i.test(r.url)
      ),
    [rows]
  );

  const manualImportCandidates = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.rowKind === "product" &&
          r.name.trim() &&
          r.breeder.trim() &&
          r.masterSku.trim()
      ),
    [rows]
  );

  const toggleManualSelect = (id: string) => {
    setSelectedManualIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllManual = () => {
    const ids = manualImportCandidates.map((r) => r.id);
    setSelectedManualIds(new Set(ids));
  };

  const clearManualSelection = () => setSelectedManualIds(new Set());

  const sendSelectedToManualGrid = () => {
    if (!targetBreederId) {
      toast({
        title: "เลือก Breeder",
        description: "เลือก Breeder ปลายทางก่อนส่งไป Manual Grid",
        variant: "destructive",
      });
      return;
    }
    const selected = manualImportCandidates.filter((r) => selectedManualIds.has(r.id));
    if (selected.length === 0) {
      toast({
        title: "ยังไม่ได้เลือกแถว",
        description: "เลือกอย่างน้อยหนึ่งแถวสินค้า (checkbox)",
        variant: "destructive",
      });
      return;
    }
    const drafts = buildManualDraftsFromRows(selected);
    saveManualGridImport({ v: 1, breederId: targetBreederId, drafts });
    toast({
      title: "ไปที่ Manual Inventory",
      description: `เพิ่ม ${drafts.length} แถวแบบร่างที่ด้านบน`,
    });
    router.push(`/admin/inventory/manual?breederId=${encodeURIComponent(targetBreederId)}`);
  };

  const loadCsvText = useCallback((csv: string) => {
    const parsed = Papa.parse<Record<string, unknown>>(csv, {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length) {
      const msg = parsed.errors[0]?.message ?? "CSV parse error";
      setFetchError(msg);
      return;
    }
    const list = parseSheetRowsToImportRows(parsed.data).map((r) => ({ ...r })) as ImportRow[];
    setRows(list);
    setSelectedManualIds(new Set());
    setFetchError(null);
    setProgress({ processed: 0, total: 0 });
  }, []);

  const handleFetchSheet = async () => {
    const csvDirect = pasteCsv.trim();
    if (csvDirect) {
      loadCsvText(csvDirect);
      return;
    }
    if (!sheetUrl.trim()) {
      setFetchError("Paste a Google Sheet URL or CSV text.");
      return;
    }
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(
        `/api/admin/import/sheet?url=${encodeURIComponent(sheetUrl.trim())}`
      );
      const data = (await res.json()) as { csv?: string; error?: string };
      if (!res.ok || !data.csv) {
        throw new Error(data.error ?? "Failed to load sheet");
      }
      loadCsvText(data.csv);
    } catch (e) {
      setFetchError(String(e));
    } finally {
      setFetching(false);
    }
  };

  const runSingleImport = async (
    row: ImportRow,
    signal?: AbortSignal
  ): Promise<ImportRow> => {
    const body = {
      name: (row.displayName || row.name).trim(),
      breeder: row.breeder.trim(),
      url: row.url.trim(),
      price: row.price,
      stock: row.stock,
      dryRun: false,
    };
    const res = await fetch("/api/admin/import/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const json = (await res.json()) as ApiSuccess & { error?: string };
    if (!res.ok || json.error) {
      throw new Error(json.error ?? `HTTP ${res.status}`);
    }
    if (!json.ok) {
      throw new Error("Unexpected response");
    }
    return {
      ...row,
      status: "done",
      result: json,
      errorMessage: undefined,
    };
  };

  const stopBulkImport = useCallback(() => {
    bulkStopRequestedRef.current = true;
    bulkAbortRef.current?.abort();
    reviewContinueRef.current?.();
    reviewContinueRef.current = null;
    setReview(null);
  }, []);

  const startBulkImport = async () => {
    const targets = importableRows.filter((r) => r.status === "idle" || r.status === "error");
    if (targets.length === 0) return;

    bulkStopRequestedRef.current = false;
    const ac = new AbortController();
    bulkAbortRef.current = ac;

    setBulkRunning(true);
    setProgress({ processed: 0, total: targets.length });

    let processed = 0;
    let stopped = false;

    for (const row of targets) {
      if (bulkStopRequestedRef.current) {
        stopped = true;
        break;
      }

      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: "running" as const } : r))
      );

      try {
        const updated = await runSingleImport({ ...row, status: "running" }, ac.signal);
        processed += 1;
        setProgress({ processed, total: targets.length });

        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? updated : r))
        );

        if (showReviewEach && updated.result) {
          await new Promise<void>((resolve) => {
            reviewContinueRef.current = resolve;
            setReview(updated);
          });
        }
        if (bulkStopRequestedRef.current) {
          stopped = true;
          break;
        }
      } catch (e) {
        processed += 1;
        setProgress({ processed, total: targets.length });
        const err = e as Error;
        if (err.name === "AbortError") {
          setRows((prev) =>
            prev.map((r) =>
              r.id === row.id
                ? {
                    ...r,
                    status: "idle" as const,
                    errorMessage: undefined,
                  }
                : r
            )
          );
          stopped = true;
          break;
        }
        const msg = String(e);
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, status: "error" as const, errorMessage: msg }
              : r
          )
        );
      }
    }

    bulkAbortRef.current = null;
    bulkStopRequestedRef.current = false;
    setBulkRunning(false);

    if (stopped) {
      toast({
        title: "Import stopped",
        description: "Sequential import was halted. Remaining rows are unchanged.",
      });
      return;
    }

    toast({
      title: "Batch complete",
      description: `Processed ${processed} of ${targets.length} row(s).`,
    });
    playSoftChime();
  };

  const retryRow = async (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row || row.status !== "error" || bulkRunning) return;
    setRetryingId(rowId);
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, status: "running" as const, errorMessage: undefined } : r
      )
    );
    try {
      const updated = await runSingleImport({ ...row, status: "running" });
      setRows((prev) => prev.map((r) => (r.id === rowId ? updated : r)));
      toast({ title: "Row imported", description: updated.result?.masterSku ?? row.name });
    } catch (e) {
      const msg = String(e);
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, status: "error" as const, errorMessage: msg } : r
        )
      );
      toast({ title: "Import failed", description: msg, variant: "destructive" });
    } finally {
      setRetryingId(null);
    }
  };

  const openReview = (row: ImportRow) => {
    if (row.result) setReview(row);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/inventory"
            className="mb-2 inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> สต็อก / Inventory
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900">
            <Sparkles className="h-7 w-7 text-emerald-600" />
            AI Product Import
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Load a public Google Sheet (CSV export), then run AI import row by row.
          </p>
        </div>
      </div>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-lg">1. Load sheet</CardTitle>
          <CardDescription>
            Share the sheet as &quot;Anyone with the link can view&quot;, paste the URL, then Fetch. Or paste raw CSV
            below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sheet-url">Google Sheet URL</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="sheet-url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleFetchSheet}
                disabled={fetching}
                className="bg-emerald-700 text-white hover:bg-emerald-800"
              >
                {fetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Fetch
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paste-csv">Or paste CSV (optional)</Label>
            <Textarea
              id="paste-csv"
              placeholder="Name,Breeder,URL,Price,Stock&#10;Zkittlez,Fast Buds,https://...,299,10"
              value={pasteCsv}
              onChange={(e) => setPasteCsv(e.target.value)}
              rows={4}
              className="font-mono text-xs"
            />
          </div>
          {fetchError && (
            <p className="text-sm text-red-600" role="alert">
              {fetchError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">2. Preview & import</CardTitle>
            <CardDescription>
              รองรับหัวคอลัมภาษาไทย/อังกฤษ: Strains Name, Type, จำนวน Pack N / Pack N Price, Breeder, URL — แถวหมวด (Photoperiod / Auto) จะถูกใช้เป็นหมวดให้แถวถัดไป
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs text-zinc-500">Manual Grid · Breeder</Label>
              <select
                className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm"
                value={targetBreederId}
                onChange={(e) => setTargetBreederId(e.target.value)}
              >
                <option value="">— เลือก Breeder —</option>
                {breeders.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                className="border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                disabled={manualImportCandidates.length === 0}
                onClick={sendSelectedToManualGrid}
              >
                Import selected → Manual Grid
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={selectAllManual}>
                Select all products
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearManualSelection}>
                Clear selection
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="review-each"
                checked={showReviewEach}
                onCheckedChange={setShowReviewEach}
              />
              <Label htmlFor="review-each" className="text-sm font-normal text-zinc-600">
                Review after each row
              </Label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={startBulkImport}
                disabled={bulkRunning || importableRows.length === 0}
                className="bg-emerald-700 text-white hover:bg-emerald-800"
              >
                {bulkRunning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start AI Import
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={stopBulkImport}
                disabled={!bulkRunning}
                className="border-zinc-300 text-zinc-800"
              >
                <CircleStop className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(bulkRunning || progress.total > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Processed (done + failed)</span>
                <span>
                  {progress.processed} / {progress.total}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
                  style={{
                    width:
                      progress.total > 0
                        ? `${Math.min(100, (progress.processed / progress.total) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          )}

          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No rows yet. Fetch a sheet or paste CSV.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50">
                    <TableHead className="w-10" />
                    <TableHead className="min-w-[100px]">Name</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="min-w-[90px]">Section</TableHead>
                    <TableHead className="min-w-[100px]">Breeder</TableHead>
                    <TableHead className="min-w-[120px] font-mono text-[11px]">Master SKU</TableHead>
                    <TableHead className="min-w-[160px]">URL</TableHead>
                    {IMPORT_PACK_SIZES.map((sz) => (
                      <TableHead key={sz} className="min-w-[108px] px-1.5 text-center align-bottom">
                        <div className="whitespace-nowrap text-[11px] font-semibold leading-tight text-zinc-800">
                          Pack {sz}
                        </div>
                        <div className="text-[10px] font-normal leading-tight text-zinc-500">
                          จำนวน / ฿
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={row.rowKind === "category" ? "bg-muted/50 italic text-zinc-600" : ""}
                    >
                      <TableCell className="align-middle">
                        {row.rowKind === "product" && row.masterSku ? (
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-zinc-300"
                            checked={selectedManualIds.has(row.id)}
                            onChange={() => toggleManualSelect(row.id)}
                            title="ส่งไป Manual Grid"
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate font-medium">
                        {row.rowKind === "category" ? `— ${row.name} —` : row.displayName || row.name || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600">
                        {row.rowKind === "product" ? row.geneticType || "—" : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {row.section || "—"}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-zinc-700">
                        {row.breeder || "—"}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate font-mono text-[11px] text-zinc-800">
                        {row.masterSku || "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-zinc-600">
                        {row.url || "—"}
                      </TableCell>
                      {IMPORT_PACK_SIZES.map((sz) => (
                        <TableCell
                          key={sz}
                          className="max-w-[112px] whitespace-nowrap px-1.5 text-center font-mono text-[11px] text-zinc-800"
                          title={
                            row.rowKind === "product"
                              ? `${sz} Seed${sz > 1 ? "s" : ""}: qty / price`
                              : undefined
                          }
                        >
                          {row.rowKind === "product"
                            ? formatPackQtyPriceCell(row.byPack, sz)
                            : "—"}
                        </TableCell>
                      ))}
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          {row.status === "error" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Retry import"
                              disabled={bulkRunning || retryingId === row.id}
                              onClick={() => retryRow(row.id)}
                            >
                              {retryingId === row.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                              ) : (
                                <RefreshCcw className="h-4 w-4 text-amber-700" />
                              )}
                            </Button>
                          )}
                          {row.result && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Review extracted data"
                              onClick={() => openReview(row)}
                            >
                              <Eye className="h-4 w-4 text-emerald-700" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {rows.some((r) => r.errorMessage) && (
            <div className="rounded-md border border-red-100 bg-red-50/50 p-3 text-sm text-red-800">
              {rows
                .filter((r) => r.errorMessage)
                .map((r) => (
                  <p key={r.id}>
                    <span className="font-medium">{r.name || r.id}:</span> {r.errorMessage}
                  </p>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open) {
            reviewContinueRef.current?.();
            reviewContinueRef.current = null;
            setReview(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI extraction review</DialogTitle>
            <DialogDescription>
              {review?.result?.masterSku && (
                <span className="font-mono text-xs text-zinc-600">{review.result.masterSku}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {review?.result && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase text-zinc-500">THC %</p>
                <p className="text-zinc-900">
                  {review.result.extracted.thc_percent != null
                    ? `${review.result.extracted.thc_percent}%`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-zinc-500">Description (TH)</p>
                <p className="whitespace-pre-wrap text-zinc-800">
                  {review.result.extracted.description_th?.trim() || "—"}
                </p>
              </div>
              <div className="space-y-3 rounded-md border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                  SEO preview (Google-style)
                </p>
                <p className="text-[11px] text-zinc-600">
                  Approximate search snippet — titles ≤60 chars, descriptions ≤160 chars.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[10px] font-medium uppercase text-zinc-500">Thai</p>
                    <div className="rounded border border-zinc-200 bg-white p-3 text-left shadow-sm">
                      <div className="mb-px truncate text-xs text-[#202124]">
                        smileseedbank.com › product › {review.result.masterSku?.toLowerCase() ?? "strain"}
                      </div>
                      <div className="mb-1 line-clamp-2 cursor-pointer text-lg leading-snug text-[#1a0dab]">
                        {review.result.extracted.seo?.th?.title?.trim() || "—"}
                      </div>
                      <div className="line-clamp-4 text-sm leading-relaxed text-[#4d5156]">
                        {review.result.extracted.seo?.th?.description?.trim() || "—"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-medium uppercase text-zinc-500">English</p>
                    <div className="rounded border border-zinc-200 bg-white p-3 text-left shadow-sm">
                      <div className="mb-px truncate text-xs text-[#202124]">
                        smileseedbank.com › en › product › {review.result.masterSku?.toLowerCase() ?? "strain"}
                      </div>
                      <div className="mb-1 line-clamp-2 cursor-pointer text-lg leading-snug text-[#1a0dab]">
                        {review.result.extracted.seo?.en?.title?.trim() || "—"}
                      </div>
                      <div className="line-clamp-4 text-sm leading-relaxed text-[#4d5156]">
                        {review.result.extracted.seo?.en?.description?.trim() || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {extractedImageList(review.result.extracted).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
                    Images (up to 5, localized)
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {extractedImageList(review.result.extracted).map((src, i) => (
                      <div
                        key={`${src}-${i}`}
                        className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
                      >
                        <Image
                          src={src}
                          alt={`${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="120px"
                          unoptimized
                        />
                        <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                          {i === 0 ? "Hero" : `#${i + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {review.result.productId && (
                <p className="text-xs text-zinc-500">
                  Product ID: {review.result.productId} · Mode: {review.result.mode}
                </p>
              )}
              {review.result.scrapeError && (
                <p className="text-xs text-amber-800">
                  Scrape note: {review.result.scrapeError}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setReview(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
