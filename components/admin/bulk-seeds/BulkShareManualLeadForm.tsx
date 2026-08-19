"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_EUR_THB, type BulkSupplierSlug } from "@/lib/bulk-seeds-book";
import type { ManualBulkLeadLineInput } from "@/lib/bulk-share-manual-lead";
import type { BulkShareLeadRecord } from "@/types/bulk-share-lead";

type Line = ManualBulkLeadLineInput;

function emptyLine(slug: BulkSupplierSlug = "green-future"): Line {
  return { supplierSlug: slug, strainName: "", qty: 50, unitEur: slug === "seeds-genetics" ? 2.5 : 2.13 };
}

type Props = {
  onCreated: (lead: BulkShareLeadRecord) => void;
};

export function BulkShareManualLeadForm({ onCreated }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [shareTitle, setShareTitle] = useState("Manual bulk order (chat)");
  const [lines, setLines] = useState<Line[]>([emptyLine("green-future")]);

  function patchLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/bulk-seeds/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          email,
          lineId,
          phone,
          note,
          shareTitle,
          eurThb: DEFAULT_EUR_THB,
          lines,
        }),
      });
      const json = (await res.json()) as { lead?: BulkShareLeadRecord; error?: string };
      if (!res.ok || !json.lead) throw new Error(json.error ?? "Failed");
      toast({ title: "สร้าง lead แล้ว", description: json.lead.refNumber });
      setContactName("");
      setEmail("");
      setLineId("");
      setPhone("");
      setNote("");
      setLines([emptyLine("green-future")]);
      setOpen(false);
      onCreated(json.lead);
    } catch (err) {
      toast({
        title: "สร้าง lead ไม่สำเร็จ",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        สร้าง lead มือ (แชท)
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-[#12463e]/25 bg-white p-3">
      <p className="text-xs text-slate-600">
        ลูกค้าสั่งนอกลิงก์ — กรอกชื่อ + LINE/โทร/อีเมล + รายการ แล้วได้เลข SSB-BL
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">ชื่อลูกค้า</Label>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">หัวข้อ offer</Label>
          <Input value={shareTitle} onChange={(e) => setShareTitle(e.target.value)} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">LINE</Label>
          <Input value={lineId} onChange={(e) => setLineId(e.target.value)} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">โทร</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-8" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">หมายเหตุ</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ship end Sep · SG 50% deposit · address TBD"
            className="h-8"
          />
        </div>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid gap-2 rounded-md border border-slate-100 bg-slate-50/80 p-2 sm:grid-cols-[7rem_1fr_4.5rem_4.5rem_2rem]">
            <select
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
              value={l.supplierSlug}
              onChange={(e) =>
                patchLine(i, { supplierSlug: e.target.value as BulkSupplierSlug })
              }
            >
              <option value="green-future">SGF</option>
              <option value="seeds-genetics">SG</option>
            </select>
            <Input
              className="h-8"
              placeholder="Strain"
              value={l.strainName}
              onChange={(e) => patchLine(i, { strainName: e.target.value })}
            />
            <Input
              className="h-8"
              type="number"
              min={1}
              value={l.qty}
              onChange={(e) => patchLine(i, { qty: Number(e.target.value) || 0 })}
            />
            <Input
              className="h-8"
              type="number"
              min={0.01}
              step={0.01}
              value={l.unitEur}
              onChange={(e) => patchLine(i, { unitEur: Number(e.target.value) || 0 })}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400"
              onClick={() => setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)))}
              aria-label="Remove line"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="ghost" onClick={() => setLines((p) => [...p, emptyLine()])}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          เพิ่มบรรทัด
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="bg-[#12463e] hover:bg-[#0f3a34]" disabled={busy} onClick={() => void submit()}>
          {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          บันทึกเป็น Bulk lead
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
