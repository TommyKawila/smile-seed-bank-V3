"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatBulkShareLeadCopyText } from "@/lib/bulk-share-lead-copy";
import type { BulkShareLeadRecord } from "@/types/bulk-share-lead";

function fmtThb(n: number): string {
  return `฿${Math.ceil(n).toLocaleString("en-US")}`;
}

export function BulkShareLeadsPanel() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<BulkShareLeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bulk-seeds/leads?status=NEW&limit=50");
      const json = (await res.json()) as { leads?: BulkShareLeadRecord[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setLeads(json.leads ?? []);
    } catch (err) {
      toast({
        title: "โหลด lead ไม่สำเร็จ",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyLead(lead: BulkShareLeadRecord) {
    const text = formatBulkShareLeadCopyText(lead);
    await navigator.clipboard.writeText(text);
    setCopiedId(lead.id);
    toast({ title: "คัดลอกแล้ว", description: lead.refNumber });
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">คำสั่งจากลิงก์ (NEW)</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && leads.length === 0 ? (
          <p className="text-sm text-slate-500">กำลังโหลด…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีคำสั่งใหม่จากลิงก์ exclusive</p>
        ) : (
          <ul className="space-y-2">
            {leads.map((lead) => {
              const open = expandedId === lead.id;
              return (
                <li key={lead.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-2 text-left"
                    onClick={() => setExpandedId(open ? null : lead.id)}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-slate-900">{lead.refNumber}</p>
                      <p className="truncate text-sm text-slate-700">{lead.contactName}</p>
                      <p className="text-xs text-slate-500">
                        {lead.seedCount.toLocaleString()} เมล็ด · {fmtThb(lead.subtotalThb)} ·{" "}
                        {new Date(lead.createdAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{open ? "▲" : "▼"}</span>
                  </button>
                  {open ? (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm">
                      {lead.email ? (
                        <p>
                          <span className="text-slate-500">Email:</span> {lead.email}
                        </p>
                      ) : null}
                      {lead.lineId ? (
                        <p>
                          <span className="text-slate-500">LINE:</span> {lead.lineId}
                        </p>
                      ) : null}
                      {lead.phone ? (
                        <p>
                          <span className="text-slate-500">โทร:</span> {lead.phone}
                        </p>
                      ) : null}
                      {lead.note ? (
                        <p>
                          <span className="text-slate-500">หมายเหตุ:</span> {lead.note}
                        </p>
                      ) : null}
                      <p className="text-xs text-slate-500">Offer: {lead.shareTitle}</p>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {lead.items.map((it) => (
                          <li key={it.id}>
                            {it.supplierLabel} · {it.strainName} · {it.qty.toLocaleString()} ·{" "}
                            {fmtThb(it.lineThb)}
                          </li>
                        ))}
                      </ul>
                      <Button type="button" size="sm" variant="secondary" onClick={() => void copyLead(lead)}>
                        {copiedId === lead.id ? (
                          <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                        ) : (
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        คัดลอกเป็นข้อความใบเสนอราคา
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
