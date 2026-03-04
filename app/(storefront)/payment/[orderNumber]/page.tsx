"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, CreditCard, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

const BANK = {
  name: "ธนาคารกรุงไทย",
  accountNo: "123-4-56789-0",
  accountName: "Smile Seed Bank Co., Ltd.",
};
const PROMPTPAY_ID = "0812345678"; // ← เปลี่ยนเป็นเลข PromptPay จริง

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = (params.orderNumber as string) ?? "";
  const [order, setOrder] = useState<{ total_amount: number; payment_method: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/storefront/orders/by-number?order=${encodeURIComponent(orderNumber)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setOrder({ total_amount: data.total_amount, payment_method: data.payment_method });
      })
      .finally(() => setLoading(false));
  }, [orderNumber]);

  useEffect(() => {
    if (!order?.total_amount || order.payment_method !== "TRANSFER") return;
    const amount = Number(order.total_amount);
    const payload = generatePayload(PROMPTPAY_ID, { amount });
    QRCode.toDataURL(payload, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [order?.total_amount, order?.payment_method]);

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
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CreditCard className="h-5 w-5" />
              ข้อมูลการโอนเงิน
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">ธนาคาร</span>
                <span className="font-medium text-zinc-800">{BANK.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">เลขบัญชี</span>
                <span className="font-mono font-semibold text-zinc-900">{BANK.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ชื่อบัญชี</span>
                <span className="font-medium text-zinc-800">{BANK.accountName}</span>
              </div>
            </div>

            {/* Dynamic QR Code */}
            {qrDataUrl && (
              <div className="flex flex-col items-center py-4">
                <p className="text-xs text-zinc-500 mb-2">สแกน QR เพื่อโอนเงิน</p>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="PromptPay QR" width={200} height={200} className="size-[200px]" />
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 py-4 text-emerald-700 font-medium hover:bg-emerald-50 transition-colors"
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
