"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  TMY_DEPOSIT_PAYEE_EN,
  TMY_DEPOSIT_PAYEE_TH,
  type TmyBankPublic,
} from "@/lib/tmy-deposit-bank";
import { formatThb } from "@/lib/wholesale-bulk-pricing";

type OrderSummary = {
  reservationNumber: string;
  depositThb: number;
  grandTotalThb: number;
  status: string;
};

type Props = {
  bank: TmyBankPublic;
  initialRef?: string;
};

export function DepositTransferForm({ bank, initialRef = "" }: Props) {
  const { t } = useLanguage();
  const [ref, setRef] = useState(initialRef);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [payerName, setPayerName] = useState("");
  const [amount, setAmount] = useState("");
  const [transferredAt, setTransferredAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const q = ref.trim();
    if (!q) {
      setOrder(null);
      return;
    }
    let cancelled = false;
    setLookupError(null);
    fetch(`/api/wholesale/deposit-order/lookup?ref=${encodeURIComponent(q)}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          order?: OrderSummary;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !body.order) {
          setOrder(null);
          setLookupError(body.error || t("ไม่พบเลขอ้างอิง", "Reference not found"));
          return;
        }
        setOrder(body.order);
        if (!amount) setAmount(String(body.order.depositThb));
      })
      .catch(() => {
        if (!cancelled) setLookupError(t("ค้นหาไม่สำเร็จ", "Lookup failed"));
      });
    return () => {
      cancelled = true;
    };
  }, [ref, t]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!file) {
      setSubmitError(t("กรุณาแนบสลิป", "Please attach a slip"));
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("reservationNumber", ref.trim());
      fd.set("payerName", payerName.trim());
      fd.set("transferAmountThb", amount.trim());
      fd.set("transferredAt", transferredAt || new Date().toISOString());
      fd.set("slip", file);
      const res = await fetch("/api/wholesale/deposit-transfer", {
        method: "POST",
        body: fd,
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Submit failed");
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-950">
        <p className="font-semibold">
          {t("ส่งแจ้งโอนแล้ว", "Transfer notice submitted")}
        </p>
        <p className="mt-2">
          {t(
            "ทีมจะตรวจสลิปแล้วติดต่อกลับ — ยังไม่ใช่การโอนให้ผู้ผลิต",
            "Our team will verify the slip and follow up — this is not a producer transfer"
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("โอนเข้าบัญชีนี้เท่านั้น", "Transfer only to this account")}
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          {t(TMY_DEPOSIT_PAYEE_TH, TMY_DEPOSIT_PAYEE_EN)}
        </p>
        <dl className="mt-3 space-y-1 text-sm text-slate-700">
          <div className="flex justify-between gap-3">
            <dt>{t("ธนาคาร", "Bank")}</dt>
            <dd className="font-medium">
              {bank.bankName || t("ตั้งค่าใน Admin → การชำระเงิน", "Set in Admin → Payments")}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{t("เลขบัญชี", "Account no.")}</dt>
            <dd className="font-mono font-semibold">{bank.accountNo || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{t("ชื่อบัญชี", "Account name")}</dt>
            <dd className="font-medium">{bank.accountName}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          {t(
            "ฟอร์มนี้แยกจากตะกร้าสินค้าปกติของร้าน",
            "This form is separate from the regular shop cart"
          )}
        </p>
      </div>

      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("เลขอ้างอิงจอง", "Reservation reference")}
        <input
          required
          value={ref}
          onChange={(e) => setRef(e.target.value.toUpperCase())}
          placeholder="SSB-WD-2026-001"
          className="mt-1.5 flex h-12 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </label>
      {lookupError ? <p className="text-sm text-red-600">{lookupError}</p> : null}
      {order ? (
        <p className="text-sm text-slate-700">
          {t("มัดจำที่ต้องโอน", "Deposit due")}:{" "}
          <strong>{formatThb(order.depositThb)}</strong>
          {order.status !== "PENDING_TRANSFER"
            ? ` · ${order.status}`
            : ""}
        </p>
      ) : null}

      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("ชื่อผู้โอน", "Payer name")}
        <input
          required
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          className="mt-1.5 flex h-12 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("ยอดที่โอน (บาท)", "Amount transferred (THB)")}
        <input
          required
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1.5 flex h-12 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("วันเวลาโอน", "Transfer date and time")}
        <input
          required
          type="datetime-local"
          value={transferredAt}
          onChange={(e) => setTransferredAt(e.target.value)}
          className="mt-1.5 flex h-12 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("แนบสลิป (jpg / png / webp / pdf, สูงสุด 5MB)", "Attach slip (jpg / png / webp / pdf, max 5MB)")}
        <input
          required
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1.5 block w-full text-sm text-slate-700"
        />
      </label>
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting
          ? t("กำลังส่ง…", "Submitting…")
          : t("ส่งแจ้งโอน + แนบสลิป", "Submit transfer + slip")}
      </button>
    </form>
  );
}
