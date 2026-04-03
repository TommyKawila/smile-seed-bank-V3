"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, CreditCard, Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

type PaySettings = {
  bank: { name: string; accountNo: string; accountName: string } | null;
  promptPay: { identifier: string; qrUrl: string } | null;
};

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = (params.orderNumber as string) ?? "";
  const [order, setOrder] = useState<{ total_amount: number; payment_method: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paySettings, setPaySettings] = useState<PaySettings>({ bank: null, promptPay: null });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch order + payment settings in parallel
  useEffect(() => {
    if (!orderNumber) return;
    Promise.all([
      fetch(`/api/storefront/orders/by-number?order=${encodeURIComponent(orderNumber)}`)
        .then((r) => (r.ok ? r.json() : null)),
      fetch("/api/storefront/payment-settings", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { bank: null, promptPay: null })),
    ]).then(([orderData, ps]) => {
      if (orderData) setOrder({ total_amount: orderData.total_amount, payment_method: orderData.payment_method });
      setPaySettings(ps as PaySettings);
    }).finally(() => setLoading(false));
  }, [orderNumber]);

  // Generate dynamic PromptPay QR with order amount (primary); admin-uploaded QR is fallback
  useEffect(() => {
    const promptId = paySettings.promptPay?.identifier;
    if (!order?.total_amount || order.payment_method !== "TRANSFER" || !promptId) {
      setQrDataUrl(null);
      return;
    }
    const amount = Number(order.total_amount);
    const payload = generatePayload(promptId, { amount });
    QRCode.toDataURL(payload, { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [order?.total_amount, order?.payment_method, paySettings.promptPay?.identifier]);

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
      router.push(`/order-success?order=${orderNumber}`);
    } catch (err) {
      setUploadError(String(err).replace("Error: ", ""));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order || order.payment_method !== "TRANSFER") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4">
        <p className="text-zinc-600">ไม่พบออเดอร์หรือวิธีการชำระเงินไม่ใช่โอนเงิน</p>
        <Button asChild>
          <Link href="/">กลับหน้าแรก</Link>
        </Button>
      </div>
    );
  }

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
          {/* Order Summary */}
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">ยอดที่ต้องชำระ</p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{formatPrice(order.total_amount)}</p>
            <p className="mt-1 text-sm text-zinc-500">เลขออเดอร์ #{orderNumber}</p>
          </div>

          {/* Bank Details */}
          <div className="rounded-2xl border border-primary/25 bg-accent/50 p-5 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <CreditCard className="h-5 w-5" />
              ข้อมูลการโอนเงิน
            </div>

            {/* No settings configured fallback */}
            {!paySettings.bank && !paySettings.promptPay && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                ยังไม่มีข้อมูลบัญชีรับโอน — กรุณาติดต่อทางร้านค้า
              </div>
            )}

            {/* Bank account */}
            {paySettings.bank && (
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">ธนาคาร</span>
                  <span className="font-medium text-zinc-800">{paySettings.bank.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">เลขบัญชี</span>
                  <span className="font-mono font-semibold text-zinc-900">{paySettings.bank.accountNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">ชื่อบัญชี</span>
                  <span className="font-medium text-zinc-800">{paySettings.bank.accountName}</span>
                </div>
              </div>
            )}

            {/* PromptPay QR — dynamic (order amount) primary; admin-uploaded fallback if generation fails */}
            {paySettings.promptPay && (
              <div className="flex flex-col items-center py-3">
                <p className="text-xs text-zinc-500 mb-3">
                  สแกน QR PromptPay
                  {paySettings.promptPay.identifier ? ` (${paySettings.promptPay.identifier})` : ""}
                </p>
                <div className="rounded-xl bg-white p-3 shadow-md ring-1 ring-zinc-200/80">
                  {qrDataUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="PromptPay QR"
                        width={256}
                        height={256}
                        className="size-[256px] rounded-lg"
                      />
                      <p className="mt-3 text-center text-sm font-semibold text-primary">
                        ยอดเงินรวมใน QR: {formatPrice(order.total_amount)}
                      </p>
                    </>
                  ) : paySettings.promptPay.qrUrl ? (
                    <>
                      <Image
                        src={paySettings.promptPay.qrUrl}
                        alt="PromptPay QR"
                        width={256}
                        height={256}
                        className="size-[256px] rounded-lg object-contain"
                        unoptimized
                      />
                      <p className="mt-3 text-center text-sm font-semibold text-zinc-600">
                        ยอดเงินรวมใน QR: {formatPrice(order.total_amount)}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Slip Upload */}
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm space-y-4">
            <p className="font-semibold text-zinc-800">ส่งหลักฐานการโอนเงิน</p>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 py-4 text-primary font-medium hover:bg-accent transition-colors"
            >
              <Upload className="h-5 w-5" />
              {selectedFile ? selectedFile.name : "เลือกไฟล์สลิป"}
            </button>
            {uploadError && <p className="text-xs text-red-500 text-center">{uploadError}</p>}

            <Button
              onClick={handleConfirm}
              disabled={!selectedFile || uploading}
              className="w-full h-12 bg-primary text-base font-semibold text-white hover:bg-primary/90"
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังอัปโหลด...</>
              ) : (
                <>ยืนยันการชำระเงิน</>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
