"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GF_SEED_CLAIM_REFERENCE_FORM,
  isGfSeedClaimPreview,
  type GfSeedClaimPayload,
} from "@/lib/green-future-seed-claim";

const EMPTY: GfSeedClaimPayload = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  invoicePo: "",
  lotNumber: "",
  varietyCode: "",
  quantity: "",
  receivedDate: "",
  openedDate: "",
  storageLogNotes: "",
  germinationMethod: "",
  testCount: "",
  timeline: "",
  notes: "",
};

export function SeedClaimFormClient() {
  const { t } = useLanguage();
  const preview = isGfSeedClaimPreview();
  const [form, setForm] = useState<GfSeedClaimPayload>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof GfSeedClaimPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/storefront/claim/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? t("ส่งไม่สำเร็จ", "Submission failed"));
        return;
      }
      setDoneId(json.id ?? "ok");
      setForm(EMPTY);
    } catch {
      setError(t("ส่งไม่สำเร็จ ลองใหม่อีกครั้ง", "Submission failed — please try again"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wholesale-b2b min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {t("โปรแกรม SGF SEEDS", "SGF SEEDS programme")}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          {t("ฟอร์มเคลมเมล็ด", "Seed viability claim")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {t(
            "กรอกข้อมูลครบถ้วนเพื่อให้ทีม Smile ตรวจสอบและส่งต่อเข้าระบบเคลมของ Green Future ตามเงื่อนไขในใบเสนอราคา",
            "Complete all fields so Smile can review and forward your claim to Green Future per the quotation terms."
          )}
        </p>

        {preview ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {t(
              "ฟอร์มนี้อยู่ในขั้นทดสอบภายใน — ยังไม่เปิดให้ลูกค้าทั่วไปจนกว่า Regulatory Gate จะผ่าน การส่งจะบันทึกไว้เพื่อทดสอบกระบวนการเท่านั้น",
              "This form is in internal preview — not open to the general public until the Regulatory Gate passes. Submissions are recorded for process testing only."
            )}
          </p>
        ) : null}

        {doneId ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {t(
              "รับคำขอแล้ว — ทีมจะติดต่อหลังตรวจสอบเอกสาร",
              "Claim received — our team will follow up after document review."
            )}{" "}
            <span className="font-mono text-xs">#{doneId.slice(0, 8)}</span>
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ชื่อผู้ติดต่อ", "Contact name")}>
              <Input required value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </Field>
            <Field label={t("อีเมล", "Email")}>
              <Input required type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
            <Field label={t("โทรศัพท์", "Phone")}>
              <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </Field>
            <Field label={t("Invoice / PO", "Invoice / PO")}>
              <Input required value={form.invoicePo} onChange={(e) => set("invoicePo", e.target.value)} />
            </Field>
            <Field label={t("เลขล็อต", "Lot number")}>
              <Input required value={form.lotNumber} onChange={(e) => set("lotNumber", e.target.value)} placeholder="GF-AF99-2606-B01" />
            </Field>
            <Field label={t("รหัสพันธุ์", "Variety code")}>
              <Input required value={form.varietyCode} onChange={(e) => set("varietyCode", e.target.value)} placeholder="AF99" />
            </Field>
            <Field label={t("จำนวนเมล็ด", "Seed quantity")}>
              <Input required value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </Field>
            <Field label={t("วันที่รับสินค้า", "Date received")}>
              <Input required type="date" value={form.receivedDate} onChange={(e) => set("receivedDate", e.target.value)} />
            </Field>
            <Field label={t("วันที่เปิดซอง", "Date pouch opened")}>
              <Input type="date" value={form.openedDate} onChange={(e) => set("openedDate", e.target.value)} />
            </Field>
            <Field label={t("จำนวนที่ทดสอบ", "Seeds tested")}>
              <Input required value={form.testCount} onChange={(e) => set("testCount", e.target.value)} />
            </Field>
          </div>
          <Field label={t("วิธีเพาะ / ทดสอบ", "Germination method")}>
            <Textarea required rows={2} value={form.germinationMethod} onChange={(e) => set("germinationMethod", e.target.value)} />
          </Field>
          <Field label={t("บันทึกการเก็บรักษา (storage log)", "Storage log notes")}>
            <Textarea rows={2} value={form.storageLogNotes} onChange={(e) => set("storageLogNotes", e.target.value)} />
          </Field>
          <Field label={t("ลำดับเหตุการณ์ / timeline", "Timeline")}>
            <Textarea rows={2} value={form.timeline} onChange={(e) => set("timeline", e.target.value)} />
          </Field>
          <Field label={t("หมายเหตุเพิ่มเติม", "Additional notes")}>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>

          <p className="text-xs text-slate-500">
            {t(
              "หลักฐานภาพ/วิดีโอ — ส่งทางอีเมลหลังยืนยันคำขอ อ้างอิงฟอร์ม GF:",
              "Photo/video evidence — send by email after we confirm receipt. GF reference form:"
            )}{" "}
            <Link href={GF_SEED_CLAIM_REFERENCE_FORM.url} className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">
              Google Form
            </Link>
          </p>

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? t("กำลังส่ง…", "Submitting…") : t("ส่งคำขอเคลม", "Submit claim")}
          </Button>
        </form>

        <p className="mt-8 text-sm text-slate-500">
          <Link href="/wholesale" className="text-emerald-700 hover:underline">
            {t("← กลับหน้าขายส่ง", "← Back to wholesale")}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-slate-700">{label}</Label>
      {children}
    </div>
  );
}
