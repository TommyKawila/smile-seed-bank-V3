"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  createEmptyGfSeedClaimForm,
  GF_CLAIM_STEPS,
  isGfSeedClaimPreview,
  validateGfClaimStep,
  type GfClaimStepId,
  type GfSeedClaimFormData,
} from "@/lib/green-future-seed-claim";
import { ClaimStepContent, claimStepTitle } from "./ClaimStepContent";

export function SeedClaimFormClient() {
  const { t } = useLanguage();
  const preview = isGfSeedClaimPreview();
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState<GfSeedClaimFormData>(() => createEmptyGfSeedClaimForm());
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const step = GF_CLAIM_STEPS[stepIdx] as GfClaimStepId;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === GF_CLAIM_STEPS.length - 1;

  const set = useCallback(<K extends keyof GfSeedClaimFormData>(key: K, value: GfSeedClaimFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldError(null);
  }, []);

  const progress = useMemo(
    () => Math.round(((stepIdx + 1) / GF_CLAIM_STEPS.length) * 100),
    [stepIdx]
  );

  const goNext = () => {
    const err = validateGfClaimStep(step, form);
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError(null);
    setStepIdx((i) => Math.min(i + 1, GF_CLAIM_STEPS.length - 1));
  };

  const goBack = () => {
    setFieldError(null);
    setStepIdx((i) => Math.max(i - 1, 0));
  };

  const onSubmit = async () => {
    const err = validateGfClaimStep("confirm", form);
    if (err) {
      setFieldError(err);
      return;
    }
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
    } catch {
      setError(t("ส่งไม่สำเร็จ ลองใหม่อีกครั้ง", "Submission failed — please try again"));
    } finally {
      setSubmitting(false);
    }
  };

  if (doneId) {
    return (
      <div className="wholesale-b2b min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            {t("รับคำขอแล้ว — ทีมจะติดต่อหลังตรวจสอบเอกสาร", "Claim received — our team will follow up after document review.")}{" "}
            <span className="font-mono text-xs">#{doneId.slice(0, 8)}</span>
          </p>
          <p className="mt-6 text-sm text-slate-500">
            <Link href="/wholesale" className="text-emerald-700 hover:underline">
              {t("← กลับหน้าขายส่ง", "← Back to wholesale")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

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
            "กรอกข้อมูลครบถ้วนเพื่อให้ทีม Smile ตรวจสอบและส่งต่อเข้าระบบเคลมของ Green Future",
            "Complete all sections so Smile can review and forward your claim to Green Future."
          )}
        </p>

        {preview ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {t(
              "ฟอร์มนี้อยู่ในขั้นทดสอบภายใน — ยังไม่เปิดให้ลูกค้าทั่วไปจนกว่า Regulatory Gate จะผ่าน",
              "This form is in internal preview — not open to the general public until the Regulatory Gate passes."
            )}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {t("ขั้นตอน", "Step")} {stepIdx + 1}/{GF_CLAIM_STEPS.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">{claimStepTitle(step, t)}</h2>
          <div className="mt-4">
            <ClaimStepContent step={step} data={form} set={set} t={t} fieldError={fieldError} />
          </div>
          {fieldError ? (
            <p className="mt-3 text-sm text-red-600">
              {t("กรุณากรอกข้อมูลที่จำเป็นให้ครบ", "Please complete all required fields")}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {!isFirst ? (
            <Button type="button" variant="outline" onClick={goBack} className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50">
              {t("ย้อนกลับ", "Back")}
            </Button>
          ) : null}
          {!isLast ? (
            <Button type="button" onClick={goNext}>
              {t("ถัดไป", "Next")}
            </Button>
          ) : (
            <Button type="button" disabled={submitting} onClick={onSubmit}>
              {submitting ? t("กำลังส่ง…", "Submitting…") : t("ส่งคำขอเคลม", "Submit claim")}
            </Button>
          )}
        </div>

        <p className="mt-8 text-sm text-slate-500">
          <Link href="/wholesale" className="text-emerald-700 hover:underline">
            {t("← กลับหน้าขายส่ง", "← Back to wholesale")}
          </Link>
        </p>
      </div>
    </div>
  );
}
