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
  const tag = "[DynamicPromptPayQr] PromptPay API";

  if (resolution.mode === "order") {
    const url = `/api/storefront/promptpay-payload?orderNumber=${encodeURIComponent(resolution.orderNumber)}`;
    const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
    let data: unknown = {};
    try {
      data = await res.json();
    } catch {
      console.error(`${tag} GET invalid JSON`, { status: res.status, orderNumber: resolution.orderNumber });
      return { payload: null, amountBaht: null };
    }
    const o = data as { payload?: string | null; amountBaht?: number | null; error?: unknown };
    if (!res.ok) {
      const bodySnippet = (() => {
        try {
          return JSON.stringify(o).slice(0, 900);
        } catch {
          return String(o.error ?? "");
        }
      })();
      console.error(`${tag} GET failed`, {
        status: res.status,
        url,
        responseBody: bodySnippet,
      });
      return { payload: null, amountBaht: null };
    }
    const payload = typeof o.payload === "string" && o.payload.length > 0 ? o.payload : null;
    const amountBaht = typeof o.amountBaht === "number" && Number.isFinite(o.amountBaht) ? o.amountBaht : null;
    if (!payload && res.ok && (o.payload === undefined || o.payload === null))
      console.warn(`${tag} GET ok but empty payload — check merchant ID in payment settings or env`, {
        amountBaht,
        orderNumber: resolution.orderNumber,
      });
    return { payload, amountBaht };
  }

  const { checkout } = resolution;
  const res = await fetch("/api/storefront/promptpay-payload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id: checkout.customerId,
      promo_code_id: checkout.promoCodeId,
      items: checkout.items.map((line) => ({
        ...line,
        isFreeGift: line.isFreeGift === true,
      })),
      summary: checkout.summary,
    }),
    cache: "no-store",
    credentials: "same-origin",
  });
  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    console.error(`${tag} POST invalid JSON`, { status: res.status });
    return { payload: null, amountBaht: null };
  }
  const o = data as { payload?: string | null; amountBaht?: number | null; error?: unknown };
  if (!res.ok) {
    const bodySnippet = (() => {
      try {
        return JSON.stringify(o).slice(0, 900);
      } catch {
        return String(o.error ?? "");
      }
    })();
    console.error(`${tag} POST failed (relative /api/storefront/promptpay-payload)`, {
      status: res.status,
      responseBody: bodySnippet,
    });
    return { payload: null, amountBaht: null };
  }
  const payload = typeof o.payload === "string" && o.payload.length > 0 ? o.payload : null;
  const amountBaht = typeof o.amountBaht === "number" && Number.isFinite(o.amountBaht) ? o.amountBaht : null;
  if (!payload && (o.payload === undefined || o.payload === null || o.payload === ""))
      console.warn(`${tag} POST ok but empty payload — check merchant ID in payment settings or env`, {
        amountBaht,
      });
  return { payload, amountBaht };
}

export function DynamicPromptPayQr({
  amountBaht,
  resolution,
  deferPromptPayFetch = false,
  reloadNonce = 0,
  payeeDisplayName,
  t,
}: {
  amountBaht: number;
  resolution: PromptPayResolution;
  deferPromptPayFetch?: boolean;
  /** Increment to force a new POST/GET to `/api/storefront/promptpay-payload`. */
  reloadNonce?: number;
  /** From `payment_settings.prompt_pay` — never the raw PromptPay ID. */
  payeeDisplayName?: string;
  t: (th: string, en: string) => string;
}) {
  const [payload, setPayload] = useState<string | null>(null);
  const [serverAmountBaht, setServerAmountBaht] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payeeLabel =
    typeof payeeDisplayName === "string" && payeeDisplayName.trim()
      ? payeeDisplayName.trim()
      : PROMPTPAY_CHECKOUT_DISPLAY_NAME;

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
    if (deferPromptPayFetch) {
      setPayload(null);
      setServerAmountBaht(null);
      setLoading(true);
      return;
    }

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
  }, [requestKey, deferPromptPayFetch, reloadNonce]);

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
            "พร้อมเพย์ไม่พร้อมให้บริการในขณะนี้ — กรุณาใช้ข้อมูลโอนเงินผ่านธนาคารด้านล่าง",
            "PromptPay is not available — please use the bank transfer details below.",
          )}
        </p>
      </CardShell>
    );
  }

  return (
    <CardShell t={t}>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-3 py-3">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {t("ยอดที่ต้องชำระ", "Amount to pay")}
          </span>
          <span className="font-mono text-lg font-semibold tabular-nums text-zinc-900">
            {formatPrice(displayBaht)}
          </span>
        </div>
        <div className="flex justify-between gap-2 px-0.5">
          <span className="text-xs text-zinc-500">{t("ชื่อผู้รับเงิน", "Payee")}</span>
          <span className="max-w-[65%] text-right text-sm font-medium leading-snug text-zinc-900">
            {payeeLabel}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          {t(
            "ยอดจากเซิร์ฟเวอร์ — สแกน QR (หมายเลขพร้อมเพย์ไม่แสดงเป็นข้อความ)",
            "Server-validated amount — scan QR (PromptPay ID not shown as text).",
          )}
        </p>
      </div>

      <div className="mx-auto mt-2 flex w-full max-w-[300px] flex-col items-center gap-3">
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-inner">
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
          className="w-full max-w-xs gap-2 rounded-xl border-zinc-200"
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
    <div className="overflow-hidden rounded-3xl border border-zinc-200/85 bg-white shadow-[0_16px_48px_-20px_rgba(15,23,42,0.22)]">
      <div className="border-b border-emerald-900/10 bg-gradient-to-r from-[#12463e]/[0.07] to-zinc-50/90 px-5 py-3.5">
        <h3 className="text-sm font-semibold tracking-tight text-[#12463e]">
          {t("พร้อมเพย์", "PromptPay")}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
