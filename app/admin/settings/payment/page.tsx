"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Plus, Trash2, CreditCard, QrCode, MessageCircle, Upload, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type PaymentSettingsForm,
  type BankAccount,
  type PromptPay,
} from "@/lib/validations/payment-settings";

/** Inline QR uploader — uploads to brand-assets bucket via existing endpoint */
function QrUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("key", "promptpay-qr");
      const res = await fetch("/api/admin/settings/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "อัปโหลดล้มเหลว");
      onChange(json.url);
    } catch (e) {
      setErr(String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">รูป QR Code PromptPay</Label>

      {/* Preview / Drop zone */}
      <div
        className="relative flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-primary/60"
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <Image src={`${value}?t=${Date.now()}`} alt="QR" fill className="object-contain p-2" unoptimized />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <span className="text-[11px] font-medium text-center px-2">คลิกเพื่ออัปโหลด QR</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3 w-3" />
          {value ? "เปลี่ยนรูป" : "อัปโหลด"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-red-500 hover:text-red-600"
            onClick={() => onChange("")}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {err && <p className="text-[11px] text-red-500">{err}</p>}
    </div>
  );
}

const emptyBank: BankAccount = { bankName: "", accountName: "", accountNo: "", isActive: true };
const emptyPromptPay: PromptPay = { identifier: "", qrUrl: "", isActive: true, accountName: "" };

export default function PaymentSettingsPage() {
  const [form, setForm] = useState<PaymentSettingsForm>({
    bankAccounts: [],
    promptPay: emptyPromptPay,
    lineId: "",
    messengerUrl: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  /** UI + toggles locked until POST succeeds and form state is updated from server. */
  const [isLocked, setIsLocked] = useState(false);
  const [toast, setToast] = useState<"success" | "error" | null>(null);
  /** Bumps when save starts so in-flight GET cannot overwrite form after user intent. */
  const fetchGenRef = useRef(0);

  useEffect(() => {
    const gen = ++fetchGenRef.current;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/admin/settings/payment", { signal: ac.signal });
        if (!res.ok) {
          if (gen === fetchGenRef.current) setIsLoading(false);
          return;
        }
        const data = await res.json();
        if (gen !== fetchGenRef.current) return;
        setForm({
          bankAccounts: Array.isArray(data.bankAccounts) && data.bankAccounts.length > 0
            ? data.bankAccounts
            : [emptyBank],
          promptPay: data.promptPay ?? emptyPromptPay,
          lineId: data.lineId ?? "",
          messengerUrl: data.messengerUrl ?? "",
        });
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        if (gen === fetchGenRef.current) setIsLoading(false);
      } finally {
        if (gen === fetchGenRef.current) setIsLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const handleSave = async () => {
    fetchGenRef.current += 1;
    setIsLocked(true);
    setIsSaving(true);
    setToast(null);
    try {
      const payload = {
        ...form,
        bankAccounts: form.bankAccounts.filter((b) => b.bankName.trim() || b.accountNo.trim()),
      };
      if (process.env.NODE_ENV === "development") {
        console.log("Payload to be sent:", JSON.stringify(payload, null, 2));
      }
      const res = await fetch("/api/admin/settings/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        bankAccounts?: unknown[];
        promptPay?: unknown;
        lineId?: string;
        messengerUrl?: string;
      };
      if (!res.ok || json.ok !== true) {
        setToast("error");
        return;
      }
      setForm((prev) => ({
        ...prev,
        bankAccounts:
          Array.isArray(json.bankAccounts) && json.bankAccounts.length > 0
            ? (json.bankAccounts as BankAccount[])
            : [emptyBank],
        promptPay: (json.promptPay as PromptPay) ?? prev.promptPay ?? emptyPromptPay,
        lineId: json.lineId ?? prev.lineId,
        messengerUrl: json.messengerUrl ?? prev.messengerUrl,
      }));
      setToast("success");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
      setIsLocked(false);
    }
  };

  const addBank = () => setForm((f) => ({ ...f, bankAccounts: [...f.bankAccounts, { ...emptyBank }] }));
  const removeBank = (i: number) =>
    setForm((f) => ({ ...f, bankAccounts: f.bankAccounts.filter((_, idx) => idx !== i) }));
  const updateBank = (i: number, field: keyof BankAccount, value: string | boolean) =>
    setForm((f) => ({
      ...f,
      bankAccounts: f.bankAccounts.map((b, idx) =>
        idx === i ? { ...b, [field]: value } : b
      ),
    }));

  const updatePromptPay = (field: keyof PromptPay, value: string | boolean) =>
    setForm((f) => ({ ...f, promptPay: { ...(f.promptPay ?? emptyPromptPay), [field]: value } }));

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">ช่องทางการชำระเงิน</h1>
        <p className="mt-1 text-sm text-zinc-500">
          จัดการบัญชีธนาคาร, PromptPay และช่องทางติดต่อ
        </p>
      </div>

      {toast === "success" && (
        <div className="rounded-lg bg-accent px-4 py-3 text-sm font-medium text-primary shadow-sm">
          ✅ บันทึกเรียบร้อยแล้ว
        </div>
      )}
      {toast === "error" && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          ❌ บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูล
        </div>
      )}

      {/* ── Bank Accounts ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            บัญชีธนาคาร
          </CardTitle>
          <Button variant="outline" size="sm" onClick={addBank} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            เพิ่มบัญชี
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {(form.bankAccounts.length === 0 ? [emptyBank] : form.bankAccounts).map((b, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">บัญชี #{i + 1}</span>
                {form.bankAccounts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-red-500 hover:text-red-600"
                    onClick={() => removeBank(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">ชื่อธนาคาร</Label>
                  <Input
                    placeholder="เช่น SCB, KBANK"
                    value={b.bankName}
                    onChange={(e) => updateBank(i, "bankName", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">ชื่อบัญชี</Label>
                  <Input
                    placeholder="ชื่อเจ้าของบัญชี"
                    value={b.accountName}
                    onChange={(e) => updateBank(i, "accountName", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">เลขบัญชี</Label>
                  <Input
                    placeholder="เลขบัญชี"
                    value={b.accountNo}
                    onChange={(e) => updateBank(i, "accountNo", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={b.isActive}
                  disabled={isSaving || isLocked}
                  onCheckedChange={(v) => updateBank(i, "isActive", v)}
                />
                <Label className="text-xs">เปิดใช้งาน</Label>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── PromptPay ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-4 w-4" />
            PromptPay
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">เบอร์โทร / เลข PromptPay</Label>
            <Input
              placeholder="เช่น 0812345678"
              value={form.promptPay?.identifier ?? ""}
              onChange={(e) => updatePromptPay("identifier", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">ชื่อผู้รับเงิน (แสดงหน้าเช็คเอาต์)</Label>
            <Input
              placeholder="ไม่บังคับ — ค่าเริ่มต้นจากระบบถ้าว่าง"
              value={form.promptPay?.accountName ?? ""}
              onChange={(e) => updatePromptPay("accountName", e.target.value)}
              className="mt-1"
            />
          </div>

          <QrUpload
            value={form.promptPay?.qrUrl ?? ""}
            onChange={(url) => updatePromptPay("qrUrl", url)}
          />

          <div className="flex items-center gap-2">
            <Switch
              checked={form.promptPay?.isActive ?? true}
              disabled={isSaving || isLocked}
              onCheckedChange={(v) => updatePromptPay("isActive", v)}
            />
            <Label className="text-xs">เปิดใช้งาน</Label>
          </div>
        </CardContent>
      </Card>

      {/* ── Contact ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            ช่องทางติดต่อ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Line ID</Label>
            <Input
              placeholder="เช่น @smileseedbank"
              value={form.lineId}
              onChange={(e) => setForm((f) => ({ ...f, lineId: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Messenger URL</Label>
            <Input
              placeholder="https://m.me/..."
              value={form.messengerUrl}
              onChange={(e) => setForm((f) => ({ ...f, messengerUrl: e.target.value }))}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Save ─────────────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving || isLoading || isLocked}
          className="min-w-[180px] gap-2"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? "กำลังบันทึก..." : "Save Changes"}
        </Button>
      </div>

      {/* ── SQL Setup ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">📋 SQL Setup (Supabase — รันครั้งเดียว)</p>
        <pre className="mt-2 overflow-x-auto rounded bg-amber-100 p-3 text-[11px] leading-relaxed text-amber-900">
{`-- 1. Create table
CREATE TABLE IF NOT EXISTS payment_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bank_accounts jsonb DEFAULT '[]',
  prompt_pay jsonb DEFAULT '{}',
  crypto_wallets jsonb DEFAULT '[]',
  line_id text DEFAULT '',
  messenger_url text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- 2. Disable RLS (API uses postgres.js with DATABASE_URL — bypasses RLS entirely)
ALTER TABLE payment_settings DISABLE ROW LEVEL SECURITY;

-- 3. Create payment-assets storage bucket for QR uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;`}
        </pre>
      </div>
    </div>
  );
}
