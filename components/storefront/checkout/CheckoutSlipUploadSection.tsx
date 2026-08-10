"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineParcelTrackingCta } from "@/components/storefront/LineParcelTrackingCta";
import { clearCheckoutPersistence } from "@/lib/checkout-persist";
import { orderSuccessPathWithAccess } from "@/lib/order-access-url";
import { lineOaPrefillUrlForOrderSuccess } from "@/lib/line-oa-url";
import { cn } from "@/lib/utils";

export function CheckoutSlipUploadSection({
  orderNumber,
  access,
  lineId,
  t,
  serif,
}: {
  orderNumber: string;
  access: { t: string; e: string };
  lineId: string | null;
  t: (th: string, en: string) => string;
  serif: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
    setUploadError(null);
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      setUploadError(t("กรุณาเลือกไฟล์หลักฐานการโอนเงิน", "Please select a proof of payment file"));
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("order_number", orderNumber);
      form.append("t", access.t);
      form.append("e", access.e);
      form.append("file", selectedFile);
      const res = await fetch("/api/storefront/orders/upload-slip", { method: "POST", body: form });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      clearCheckoutPersistence();
      router.push(orderSuccessPathWithAccess(orderNumber, access.t, access.e));
    } catch (err) {
      setUploadError(String(err).replace("Error: ", ""));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-xl border border-border/60 bg-zinc-950/40 p-5 space-y-4",
        )}
      >
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {t("ขั้นตอนถัดไป", "Next step")}
          </p>
          <p className={cn(serif, "mt-1 text-lg font-semibold text-zinc-100")}>
            {t("ส่งหลักฐานการโอนเงิน", "Upload payment proof")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {t("อัปโหลดสลิปหรือ PDF เพื่อยืนยันการชำระเงิน", "Upload a slip or PDF to confirm payment")}
          </p>
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 py-4 font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-900/70"
        >
          <Upload className="h-5 w-5 shrink-0" aria-hidden />
          {selectedFile ? selectedFile.name : t("เลือกไฟล์สลิป", "Choose slip file")}
        </button>
        {uploadError ? <p className="text-center text-xs text-red-500">{uploadError}</p> : null}

        <Button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={!selectedFile || uploading}
          className="h-12 w-full bg-primary text-base font-semibold text-white shadow-sm hover:bg-primary/90"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {t("กำลังอัปโหลด...", "Uploading...")}
            </>
          ) : (
            t("ยืนยันการชำระเงิน", "Confirm payment")
          )}
        </Button>
      </div>

      <div className="pt-1">
        <p className="mb-2 text-center text-[11px] font-medium text-muted-foreground">
          {t(
            "เพิ่มเพื่อน LINE เพื่อรับเลขพัสดุอัตโนมัติ (ไม่บังคับ)",
            "Add LINE friend for parcel updates (optional)",
          )}
        </p>
        <LineParcelTrackingCta
          href={lineOaPrefillUrlForOrderSuccess(orderNumber, lineId)}
          className="border-zinc-800 bg-zinc-900/50 py-2 text-xs font-normal text-zinc-500 hover:bg-zinc-900/70"
        />
      </div>
    </div>
  );
}
