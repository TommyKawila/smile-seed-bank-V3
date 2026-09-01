"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { GfSeedClaimListItem } from "@/lib/gf-seed-claim-admin";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function storageLabel(s: GfSeedClaimListItem["storage"]): string {
  if (s === "google_drive") return "Drive";
  if (s === "supabase") return "Supabase";
  if (s === "mixed") return "Mixed";
  return "—";
}

export function GfClaimInboxClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<GfSeedClaimListItem[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/claim/seeds", { cache: "no-store" });
      const json = (await res.json()) as { claims?: GfSeedClaimListItem[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "load failed");
      setClaims(json.claims ?? []);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "โหลดคำขอเคลมไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return claims;
    return claims.filter((c) =>
      [c.name, c.email, c.phone, c.lotNumber, c.strainName, c.orderNumber, c.id]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [claims, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Seed claim inbox</h2>
          <p className="text-sm text-slate-500">
            คำขอจาก `/claim/seeds` — คัดลอกสรุปส่งต่อ GF ได้ในหน้ารายละเอียด
          </p>
        </div>
        <Input
          className="max-w-xs bg-white"
          placeholder="ค้นหาชื่อ อีเมล ล็อต…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {claims.length === 0 ? "ยังไม่มีคำขอเคลม" : "ไม่พบรายการที่ตรงกับการค้นหา"}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>ผู้ติดต่อ</TableHead>
                <TableHead>ล็อต / พันธุ์</TableHead>
                <TableHead>ผล</TableHead>
                <TableHead>ไฟล์</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap text-xs text-slate-500">
                    {formatWhen(c.createdAt)}
                    <div className="font-mono text-[10px] text-slate-400">#{c.id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{c.name || "—"}</div>
                    <div className="text-xs text-slate-500">{c.email || "—"}</div>
                    <div className="text-xs text-slate-400">{c.phone || ""}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm text-slate-900">{c.lotNumber || "—"}</div>
                    <div className="text-xs text-slate-500">
                      {c.strainName || "—"}
                      {c.orderNumber ? ` · ${c.orderNumber}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] text-xs text-slate-600">
                    {c.result}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-slate-600">
                    {c.packagingCount}/{c.claimedSeedsCount}/{c.processCount} · {storageLabel(c.storage)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/partners/green-future/claims/${c.id}`}
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      เปิด
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
