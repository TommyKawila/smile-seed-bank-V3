"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { CabinetStorageAdminView, CabinetStorageLogEntryView } from "@/lib/cabinet-storage-log-types";
import {
  formatStorageLogWhen,
  storageLogT,
} from "@/lib/cabinet-storage-log-i18n";

function SpecBadge({ inSpec }: { inSpec: boolean }) {
  return (
    <span
      className={
        inSpec
          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
          : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
      }
    >
      {inSpec ? "In spec" : "Out of spec"}
    </span>
  );
}

export function GfStorageLogClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CabinetStorageAdminView | null>(null);
  const [tempC, setTempC] = useState("5");
  const [rhPct, setRhPct] = useState("35");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners/green-future/storage-log", {
        cache: "no-store",
      });
      const json = (await res.json()) as CabinetStorageAdminView & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "load failed");
      setData(json);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "โหลด log ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = async () => {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      toast({ title: "คัดลอกลิงก์แล้ว" });
    } catch {
      toast({ variant: "destructive", title: "คัดลอกไม่สำเร็จ" });
    }
  };

  const rotateLink = async () => {
    try {
      const res = await fetch(
        "/api/admin/partners/green-future/storage-log/share",
        { method: "POST" }
      );
      const json = (await res.json()) as {
        shareUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "rotate failed");
      toast({ title: "หมุน token แล้ว — ลิงก์เก่าใช้ไม่ได้" });
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "หมุน token ไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      toast({ variant: "destructive", title: "เลือกรูป Hygrometer" });
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.set("photo", photo);
      form.set("tempC", tempC);
      form.set("rhPct", rhPct);
      if (note.trim()) form.set("note", note.trim());
      const res = await fetch("/api/admin/partners/green-future/storage-log", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "save failed");
      toast({ title: "บันทึก log แล้ว" });
      setPhoto(null);
      setNote("");
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "บันทึกไม่สำเร็จ",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm("ลบรายการนี้?")) return;
    try {
      const res = await fetch(
        `/api/admin/partners/green-future/storage-log/${id}`,
        { method: "DELETE" }
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "delete failed");
      toast({ title: "ลบแล้ว" });
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "ลบไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        กำลังโหลด…
      </div>
    );
  }

  const t = storageLogT("th");

  return (
    <div className="space-y-6">
      {!data?.loggedToday ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          วันนี้ (เวลาไทย) ยังไม่มี log — ถ่ายรูป Hygrometer แล้วบันทึก
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">ลิงก์แชร์ GF (24 ชม.)</h3>
        <p className="text-xs text-slate-500">
          ส่งครั้งเดียว — GF เปิดดูประวัติได้ตลอด ไม่ต้องล็อกอิน
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={data?.shareUrl ?? ""} className="font-mono text-xs" />
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={() => void copyLink()}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button type="button" variant="outline" onClick={() => void rotateLink()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Rotate
            </Button>
          </div>
        </div>
      </section>

      <form
        onSubmit={(e) => void submit(e)}
        className="rounded-xl border border-slate-200 bg-white p-4 space-y-4"
      >
        <h3 className="text-sm font-semibold text-slate-900">บันทึกวันนี้</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tempC">{t.temp} (°C)</Label>
            <Input
              id="tempC"
              inputMode="decimal"
              value={tempC}
              onChange={(e) => setTempC(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rhPct">{t.rh} (%)</Label>
            <Input
              id="rhPct"
              inputMode="decimal"
              value={rhPct}
              onChange={(e) => setRhPct(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo">รูป Hygrometer</Label>
          <Input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">{t.note}</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>
        <Button type="submit" disabled={saving} className="bg-[#12463e] hover:bg-[#0f3a34]">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          บันทึก
        </Button>
      </form>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">{t.history}</h3>
        <ul className="space-y-3">
          {(data?.entries ?? []).map((entry: CabinetStorageLogEntryView) => (
            <li
              key={entry.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.photoUrl}
                alt=""
                className="h-24 w-24 shrink-0 rounded-lg object-cover bg-slate-100"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {entry.tempC}°C · {entry.rhPct}% RH
                  </span>
                  <SpecBadge inSpec={entry.inSpec} />
                </div>
                <p className="text-xs text-slate-500">
                  {formatStorageLogWhen(entry.loggedAt, "th")}
                </p>
                {entry.note ? (
                  <p className="text-sm text-slate-600">{entry.note}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-red-600 hover:text-red-700"
                onClick={() => void removeEntry(entry.id)}
                aria-label="Delete entry"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
