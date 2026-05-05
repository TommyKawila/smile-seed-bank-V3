"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { PROMPTPAY_CHECKOUT_DISPLAY_NAME } from "@/lib/payment-utils";
import { quantizeBaht2 } from "@/lib/money-thb";

const QR_SIZE = 280;
const AMOUNT_DEBOUNCE_MS = 320;

export type PromptPayCheckoutBody = {
  customerId: string | null;
  promoCodeId: number | null;
  items: Array<{
    variantId: number;
    quantity: number;
    price: number;
    isFreeGift?: boolean;
    productName: string;
  }>;
  summary: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
};

export type PromptPayResolution =
  | { mode: "checkout"; checkout: PromptPayCheckoutBody }
  | { mode: "order"; orderNumber: string };

async function fetchPromptPayResolved(
  resolution: PromptPayResolution,
): Promise<{ payload: string | null; amountBaht: number | null }> {
  if (resolution.mode === "order") {
    const res = await fetch(
      `/api/storefront/promptpay-payload?orderNumber=${encodeURIComponent(resolution.orderNumber)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return { payload: null, amountBaht: null };
    const data = (await res.json()) as { payload?: string | null; amountBaht?: number | null };
    const payload = typeof data.payload === "string" && data.payload.length > 0 ? data.payload : null;
    const amountBaht = typeof data.amountBaht === "number" && Number.isFinite(data.amountBaht) ? data.amountBaht : null;
    return { payload, amountBaht };
  }

  const { checkout } = resolution;
  const res = await fetch("/api/storefront/promptpay-payload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id: checkout.customerId,
      promo_code_id: checkout.promoCodeId,
      items: checkout.items,
      summary: checkout.summary,
    }),
    cache: "no-store",
  });
  if (!res.ok) return { payload: null, amountBaht: null };
  const data = (await res.json()) as { payload?: string | null; amountBaht?: number | null };
  const payload = typeof data.payload === "string" && data.payload.length > 0 ? data.payload : null;
  const amountBaht = typeof data.amountBaht === "number" && Number.isFinite(data.amountBaht) ? data.amountBaht : null;
  return { payload, amountBaht };
}

export function DynamicPromptPayQr({
  amountBaht,
  resolution,
  t,
}: {
  amountBaht: number;
  resolution: PromptPayResolution;
  t: (th: string, en: string) => string;
}) {
  const [payload, setPayload] = useState<string | null>(null);
  const [serverAmountBaht, setServerAmountBaht] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displayBaht = useMemo(() => {
    const fromApi = serverAmountBaht != null ? quantizeBaht2(serverAmountBaht) : null;
    if (fromApi != null && fromApi > 0) return fromApi;
    return Number.isFinite(amountBaht) ? quantizeBaht2(amountBaht) : 0;
  }, [amountBaht, serverAmountBaht]);

  const requestKey =
    resolution.mode === "checkout"
      ? JSON.stringify(resolution.checkout)
      : `order:${resolution.orderNumber}`;

  useEffect(() => {
    if (resolution.mode === "checkout" && resolution.checkout.items.length === 0) {
      setPayload(null);
      setServerAmountBaht(null);
      setLoading(false);
      return;
    }

    if (resolution.mode === "order" && !resolution.orderNumber.trim()) {
      setPayload(null);
      setServerAmountBaht(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const tid = window.setTimeout(() => {
      void fetchPromptPayResolved(resolution)
        .then(({ payload: p, amountBaht: ab }) => {
          if (!cancelled) {
            setPayload(p);
            setServerAmountBaht(ab);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPayload(null);
            setServerAmountBaht(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, AMOUNT_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [requestKey]);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `smile-promptpay-${displayBaht}.png`;
    a.rel = "noopener";
    a.click();
  }, [displayBaht, payload]);

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
            {formatPrice(displayBaht)}
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
