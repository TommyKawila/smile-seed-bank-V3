"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, CreditCard, Upload, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LineParcelTrackingCta } from "@/components/storefront/LineParcelTrackingCta";
import { lineOaPrefillUrlForOrderSuccess } from "@/lib/line-oa-url";
import { formatPrice } from "@/lib/utils";
import type { ActiveBankAccount } from "@/lib/storefront-payment-shared";
import { PAYMENT_CONFIG } from "@/lib/storefront-payment-shared";
import { DynamicPromptPayQr } from "@/components/storefront/checkout/DynamicPromptPayQr";
import { BankTransferAccountList } from "@/components/storefront/checkout/BankTransferAccountList";

export type PaymentPageClientProps = {
  orderNumber: string;
  bankAccounts: ActiveBankAccount[];
  bankAccountsError: boolean;
  lineId: string | null;
  /** From `payment_settings.prompt_pay` — display only. */
  promptPayPayeeDisplayName: string;
  initialOrder: {
    total_amount: number;
    payment_method: string | null;
  } | null;
  orderUnavailable: boolean;
};

/** Payment evidence page is TH-primary; `DynamicPromptPayQr` still needs bilingual `t`. */
function tTh(th: string, _en: string) {
  return th;
}

export function PaymentPageClient({
  orderNumber,
  bankAccounts,
  bankAccountsError,
  lineId,
  promptPayPayeeDisplayName,
  initialOrder,
  orderUnavailable,
}: PaymentPageClientProps) {
  const router = useRouter();
  const order = initialOrder;
  const totalAmount = order ? Number(order.total_amount) : 0;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ppReloadNonce, setPpReloadNonce] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lineCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uploadSuccess || !orderNumber) return;
    const t = setTimeout(() => {
      router.push(`/order-success/${encodeURIComponent(orderNumber)}`);
    }, 2400);
    return () => clearTimeout(t);
  }, [uploadSuccess, orderNumber, router]);

  useEffect(() => {
    if (!uploadSuccess) return;
    lineCtaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [uploadSuccess]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
    setUploadError(null);
  };

  const handleConfirm = async () => {
    if (!selectedFile || !orderNumber) {
      setUploadError("กรุณาเลือกไฟล์หลักฐานการโอนเงิน");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("order_number", orderNumber);
      form.append("file", selectedFile);
      const res = await fetch("/api/storefront/orders/upload-slip", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(String(err).replace("Error: ", ""));
    } finally {
      setUploading(false);
    }
  };

  if (orderUnavailable || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4">
        <p className="text-zinc-600">ไม่พบออเดอร์</p>
        <Button asChild>
          <Link href="/">กลับหน้าแรก</Link>
        </Button>
      </div>
    );
  }

  if (order.payment_method !== "TRANSFER") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4">
        <p className="text-zinc-600">วิธีการชำระเงินไม่ใช่โอนเงิน</p>
        <Button asChild>
          <Link href="/">กลับหน้าแรก</Link>
        </Button>
      </div>
    );
  }

  const promptPayOn = PAYMENT_CONFIG.isPromptPayEnabled;

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-12">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/checkout" className="text-zinc-500 hover:text-primary">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-zinc-900">ชำระเงิน</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">เลขออเดอร์</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-900">#{orderNumber}</p>
              </div>
              <span className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                รอชำระเงิน
              </span>
            </div>
            <Separator className="my-4 bg-zinc-100" />
            <div className="flex items-end justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">ยอดสุทธิ</p>
              <p className="text-2xl font-bold tabular-nums text-primary">{formatPrice(totalAmount)}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-primary/25 bg-accent/50 p-5">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <CreditCard className="h-5 w-5" />
              ข้อมูลการโอนเงิน
            </div>

            {bankAccountsError && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                ไม่สามารถโหลดบัญชีจากระบบได้ — รีเฟรชหน้า หรือติดต่อร้านหากยังไม่เห็นข้อมูลโอน
              </p>
            )}

            {promptPayOn ? (
              <div className="flex w-full flex-col items-center gap-2">
                <p className="text-center text-[11px] font-medium text-zinc-600">
                  ยอดเงินรวมค่าจัดส่งแล้ว
                </p>
                <div className="w-full max-w-md">
                  <DynamicPromptPayQr
                    amountBaht={totalAmount}
                    resolution={{ mode: "order", orderNumber }}
                    reloadNonce={ppReloadNonce}
                    payeeDisplayName={promptPayPayeeDisplayName}
                    t={tTh}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 h-11 w-full gap-2 rounded-xl"
                    onClick={() => setPpReloadNonce((n) => n + 1)}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    สร้าง QR ใหม่
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <BankTransferAccountList
                accounts={bankAccounts}
                grandTotalBaht={totalAmount}
                t={tTh}
              />
              {!bankAccountsError && bankAccounts.length === 0 && (
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-center text-sm text-zinc-600">
                  ยังไม่มีบัญชีสำหรับแสดง — กรุณาติดต่อร้านเพื่อขอข้อมูลโอนเงิน
                </p>
              )}
            </div>
          </div>

          <div
            className={`rounded-2xl border bg-white p-5 shadow-md space-y-4 ${
              uploadSuccess
                ? "border-emerald-200 ring-1 ring-emerald-100"
                : "border-primary/35 ring-2 ring-primary/15"
            }`}
          >
            {!uploadSuccess ? (
              <>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">ขั้นตอนถัดไป</p>
                  <p className="mt-1 text-lg font-bold text-zinc-900">ส่งหลักฐานการโอนเงิน</p>
                  <p className="mt-1 text-xs text-zinc-500">อัปโหลดสลิปหรือ PDF เพื่อยืนยันการชำระเงิน</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.04] py-4 font-semibold text-primary transition-colors hover:bg-primary/[0.08]"
                >
                  <Upload className="h-5 w-5" />
                  {selectedFile ? selectedFile.name : "เลือกไฟล์สลิป"}
                </button>
                {uploadError && <p className="text-center text-xs text-red-500">{uploadError}</p>}

                <Button
                  onClick={() => void handleConfirm()}
                  disabled={!selectedFile || uploading}
                  className="h-12 w-full bg-primary text-base font-semibold text-white shadow-sm hover:bg-primary/90"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังอัปโหลด...
                    </>
                  ) : (
                    <>ยืนยันการชำระเงิน</>
                  )}
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-1 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" strokeWidth={2} />
                <p className="text-lg font-bold text-zinc-900">บันทึกหลักฐานเรียบร้อย</p>
                <p className="text-sm text-zinc-600">กำลังพาไปหน้าสถานะออเดอร์…</p>
              </div>
            )}
          </div>

          <div ref={lineCtaRef} className="pt-1">
            <p
              className={`mb-2 text-center text-[11px] font-medium ${
                uploadSuccess ? "text-emerald-800" : "text-zinc-400"
              }`}
            >
              {uploadSuccess ? "ถัดไป — ติดตามพัสดุเมื่อจัดส่งแล้ว" : "บริการเสริม — ไม่บังคับตอนนี้"}
            </p>
            <LineParcelTrackingCta
              href={lineOaPrefillUrlForOrderSuccess(orderNumber, lineId)}
              className={
                uploadSuccess
                  ? "border-[#06C755] bg-[#06C755]/10 py-3 text-base font-semibold shadow-md ring-2 ring-[#06C755]/30"
                  : "border-zinc-200/90 bg-zinc-50/90 py-2 text-xs font-normal text-zinc-600 hover:bg-zinc-100/90"
              }
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
