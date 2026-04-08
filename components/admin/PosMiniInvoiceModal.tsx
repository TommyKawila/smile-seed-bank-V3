"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export type PosMiniInvoiceLine = {
  productName: string;
  unitLabel: string;
  quantity: number;
  lineTotal: number;
  isFreeGift?: boolean;
};

export type PosMiniInvoiceData = {
  orderNumber: string;
  /** Numeric DB id for /track/{orderId} — optional for legacy sessions */
  orderId?: string;
  lines: PosMiniInvoiceLine[];
  grandTotal: number;
  paymentMethodLabel: string;
};

type BankRow = {
  bankName: string;
  accountNo: string;
  accountName: string;
};

/** Maps POS Thai payment labels to English for the EN clipboard template. */
function paymentMethodLabelToEnglish(thLabel: string): string {
  const t = thLabel.trim();
  const exact: Record<string, string> = {
    เงินสด: "Cash",
    โอนเงิน: "Bank Transfer",
    CRYPTO: "Crypto",
    Crypto: "Crypto",
    COD: "Cash on Delivery (COD)",
  };
  if (exact[t]) return exact[t];
  if (/^COD/i.test(t) || t.includes("เก็บเงินปลายทาง")) return "Cash on Delivery (COD)";
  return t;
}

function buildClipboardText(data: PosMiniInvoiceData, bank: BankRow | null): string {
  const siteBase = (
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://smileseedbank.com"
  ).replace(/\/$/, "");
  const dash = "----------------------------------";
  const lineStr = data.lines
    .map((l) => {
      const pricePart = l.isFreeGift
        ? "ฟรี (ของแถม)"
        : `${formatPrice(l.lineTotal)} บาท`;
      return `- ${l.productName} (${l.unitLabel}) x${l.quantity}: ${pricePart}`;
    })
    .join("\n");

  const bankBlock = bank
    ? `ธนาคาร: ${bank.bankName}\nเลขบัญชี: ${bank.accountNo}\nชื่อบัญชี: ${bank.accountName}`
    : `ธนาคาร: (ตั้งค่าใน Admin → การชำระเงิน)\nเลขบัญชี: —\nชื่อบัญชี: —`;

  const oid = data.orderId?.trim();
  const trackLine =
    oid && oid.length > 0
      ? `\n🔗 ตรวจสอบสถานะและรับแจ้งเตือนผ่าน Line: ${siteBase}/track/${oid}`
      : "";

  return `🌱 *Smile Seed Bank - สรุปรายการสั่งซื้อ*
${dash}
เลขที่ออเดอร์: *#${data.orderNumber}*
ชำระเงิน: ${data.paymentMethodLabel}
${dash}
รายการสินค้า:
${lineStr}
${dash}
💰 *ยอดรวมทั้งสิ้น: ${formatPrice(data.grandTotal)} บาท*
${dash}
🏦 *ช่องทางการชำระเงิน*
${bankBlock}
${dash}
แจ้งโอนแล้วรบกวนส่งสลิปได้เลยครับ ขอบคุณที่อุดหนุนครับ! 🙏✨${trackLine}`;
}

function buildClipboardTextEn(data: PosMiniInvoiceData, bank: BankRow | null): string {
  const siteBase = (
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://smileseedbank.com"
  ).replace(/\/$/, "");
  const dash = "----------------------------------";
  const payEn = paymentMethodLabelToEnglish(data.paymentMethodLabel);
  const lineStr = data.lines
    .map((l) => {
      const pricePart = l.isFreeGift
        ? "Free (gift)"
        : `${formatPrice(l.lineTotal)} THB`;
      return `- ${l.productName} (${l.unitLabel}) ×${l.quantity}: ${pricePart}`;
    })
    .join("\n");

  const bankBlock = bank
    ? `Bank: ${bank.bankName}\nAccount number: ${bank.accountNo}\nAccount name: ${bank.accountName}`
    : `Bank: (set in Admin → Payment)\nAccount number: —\nAccount name: —`;

  const oid = data.orderId?.trim();
  const trackLine =
    oid && oid.length > 0
      ? `\n🔗 Track status & LINE notifications: ${siteBase}/track/${oid}`
      : "";

  return `🌱 *Smile Seed Bank — Order summary*
${dash}
Order ID: *#${data.orderNumber}*
Payment method: ${payEn}
${dash}
Items:
${lineStr}
${dash}
💰 *Grand total: ${formatPrice(data.grandTotal)} THB*
${dash}
🏦 *Payment details*
${bankBlock}
${dash}
Once paid, please send your transfer slip. Thank you for your support! 🙏✨${trackLine}`;
}

type Props = {
  open: boolean;
  data: PosMiniInvoiceData | null;
  onClose: () => void;
};

export function PosMiniInvoiceModal({ open, data, onClose }: Props) {
  const { toast } = useToast();
  const [bank, setBank] = useState<BankRow | null>(null);
  const [copying, setCopying] = useState<"th" | "en" | null>(null);

  useEffect(() => {
    if (!open || !data) {
      setBank(null);
      return;
    }
    let cancelled = false;
    fetch("/api/admin/settings/payment")
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { bankAccounts?: Array<Record<string, unknown>> } | null) => {
        if (!json?.bankAccounts || !Array.isArray(json.bankAccounts)) {
          if (!cancelled) setBank(null);
          return;
        }
        const rows = json.bankAccounts as Array<{
          bankName?: string;
          accountNo?: string;
          accountName?: string;
          isActive?: boolean;
        }>;
        const first =
          rows.find((a) => a.isActive !== false && a.bankName && a.accountNo) ??
          rows.find((a) => a.bankName && a.accountNo) ??
          null;
        if (cancelled) return;
        if (first) {
          setBank({
            bankName: String(first.bankName ?? ""),
            accountNo: String(first.accountNo ?? ""),
            accountName: String(first.accountName ?? ""),
          });
        } else {
          setBank(null);
        }
      })
      .catch(() => {
        if (!cancelled) setBank(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, data]);

  const clipTextTh = useMemo(
    () => (data ? buildClipboardText(data, bank) : ""),
    [data, bank]
  );

  const clipTextEn = useMemo(
    () => (data ? buildClipboardTextEn(data, bank) : ""),
    [data, bank]
  );

  const handleCopyTh = useCallback(async () => {
    if (!clipTextTh) return;
    setCopying("th");
    try {
      await navigator.clipboard.writeText(clipTextTh);
      toast({
        title: "คัดลอกแล้ว",
        description: "วางส่ง LINE ได้เลยครับ",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "คัดลอกไม่สำเร็จ",
        description: "ลองอนุญาต Clipboard ในเบราว์เซอร์",
      });
    } finally {
      setCopying(null);
    }
  }, [clipTextTh, toast]);

  const handleCopyEn = useCallback(async () => {
    if (!clipTextEn) return;
    setCopying("en");
    try {
      await navigator.clipboard.writeText(clipTextEn);
      toast({
        title: "Copied!",
        description: "Paste into LINE or any chat.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Allow clipboard access in your browser.",
      });
    } finally {
      setCopying(null);
    }
  }, [clipTextEn, toast]);

  if (!open || !data) return null;

  const invoice = data;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-200 bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-zinc-900">
            สรุปออเดอร์ (Mini Invoice)
          </DialogTitle>
          <p className="text-sm text-zinc-500">
            เลขที่ <span className="font-mono font-medium text-primary">#{invoice.orderNumber}</span>
          </p>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              รายการสินค้า
            </p>
            <ul className="mt-2 space-y-2">
              {invoice.lines.map((l, i) => (
                <li
                  key={`${l.productName}-${l.unitLabel}-${i}`}
                  className="flex justify-between gap-3 border-b border-zinc-100 pb-2 last:border-0"
                >
                  <span className="min-w-0 flex-1 text-zinc-800">
                    {l.productName}{" "}
                    <span className="text-zinc-500">({l.unitLabel})</span>{" "}
                    <span className="text-zinc-600">×{l.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium text-zinc-900">
                    {l.isFreeGift ? (
                      <span className="text-amber-700">ฟรี</span>
                    ) : (
                      formatPrice(l.lineTotal)
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-base font-bold text-zinc-900">
            <span>ยอดรวม</span>
            <span className="text-primary">{formatPrice(invoice.grandTotal)}</span>
          </div>
          <p className="text-xs text-zinc-500">ชำระ: {invoice.paymentMethodLabel}</p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="grid w-full grid-cols-2 gap-2">
            <Button
              type="button"
              className="w-full border border-emerald-800/20 bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={handleCopyTh}
              disabled={copying !== null || !clipTextTh}
            >
              {copying === "th" ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4 shrink-0" />
              )}
              Copy TH 🇹🇭
            </Button>
            <Button
              type="button"
              className="w-full border border-emerald-900/30 bg-emerald-800 text-white hover:bg-emerald-900"
              onClick={handleCopyEn}
              disabled={copying !== null || !clipTextEn}
            >
              {copying === "en" ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4 shrink-0" />
              )}
              Copy EN 🇺🇸
            </Button>
          </div>
          <Button type="button" variant="outline" className="w-full border-zinc-200" onClick={onClose}>
            ปิด · พร้อมรับออเดอร์ถัดไป
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
