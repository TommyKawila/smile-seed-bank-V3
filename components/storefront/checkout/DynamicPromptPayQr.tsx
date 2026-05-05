"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { PROMPTPAY_CHECKOUT_DISPLAY_NAME } from "@/lib/payment-utils";

const QR_SIZE = 280;

async function fetchPromptPayPayload(amountBaht: number): Promise<string | null> {
  const res = await fetch(
    `/api/storefront/promptpay-payload?amount=${encodeURIComponent(String(amountBaht))}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { payload?: string | null };
  return typeof data.payload === "string" && data.payload.length > 0 ? data.payload : null;
}

export function DynamicPromptPayQr({
  amountBaht,
  t,
}: {
  amountBaht: number;
  t: (th: string, en: string) => string;
}) {
  const [payload, setPayload] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!Number.isFinite(amountBaht) || amountBaht <= 0) {
      setPayload(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchPromptPayPayload(amountBaht)
      .then((p) => {
        if (!cancelled) setPayload(p);
      })
      .catch(() => {
        if (!cancelled) setPayload(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [amountBaht]);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `smile-promptpay-${Math.round(amountBaht * 100) / 100}.png`;
    a.rel = "noopener";
    a.click();
  }, [amountBaht, payload]);

  if (!Number.isFinite(amountBaht) || amountBaht <= 0) {
    return null;
  }

  if (loading) {
    return (
      <CardShell t={t}>
        <div
          className="flex w-full flex-col items-center justify-center gap-3 py-6"
          style={{ minHeight: QR_SIZE + 48 }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-xs text-zinc-500">
            {t("กำลังเตรียม QR พร้อมเพย์...", "Preparing PromptPay QR...")}
          </p>
        </div>
      </CardShell>
    );
  }

  if (!payload) {
    return (
      <CardShell t={t}>
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-center text-sm text-zinc-600">
          {t(
            "ชำระผ่าน PromptPay ชั่วคราวไม่พร้อม — ใช้บัญชีธนาคารหรือ QR ด้านล่างได้",
            "PromptPay QR is unavailable — use the bank account or QR below.",
          )}
        </p>
      </CardShell>
    );
  }

  return (
    <CardShell t={t}>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-2 border-b border-zinc-100 pb-2">
          <span className="text-zinc-500">{t("ยอดที่ต้องชำระ", "Amount to pay")}</span>
          <span className="font-mono font-semibold tabular-nums text-zinc-900">
            {formatPrice(amountBaht)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">{t("ชื่อบัญชีรับเงิน", "Payee name")}</span>
          <span className="text-right font-medium text-zinc-900">{PROMPTPAY_CHECKOUT_DISPLAY_NAME}</span>
        </div>
        <p className="text-xs text-zinc-500">
          {t(
            "สแกน QR ด้านล่าง — ไม่แสดงหมายเลขพร้อมเพย์เป็นข้อความ",
            "Scan the QR below — the PromptPay number is not shown as text.",
          )}
        </p>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-[300px] flex-col items-center gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <QRCodeCanvas
            ref={canvasRef}
            value={payload}
            size={QR_SIZE}
            level="M"
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#0f172a"
            title={t("QR พร้อมเพย์ตามยอดออเดอร์", "PromptPay QR for this order amount")}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full max-w-xs gap-2"
          onClick={() => downloadPng()}
        >
          <Download className="h-4 w-4" aria-hidden />
          {t("บันทึก QR ลงเครื่อง", "Save QR image")}
        </Button>
      </div>
    </CardShell>
  );
}

function CardShell({ children, t }: { children: ReactNode; t: (th: string, en: string) => string }) {
  return (
    <div className="rounded-sm border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h3 className="text-base font-medium text-primary">{t("พร้อมเพย์", "PromptPay")}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
