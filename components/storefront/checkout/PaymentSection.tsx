"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PaymentSetting } from "@/lib/payment-settings-public";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

const QR_IMAGE_SIZE = 220;

export function PaymentSection({
  paymentSettings,
  paymentSettingsError,
  promptPayQrDataUrl,
  t,
  serif,
}: {
  paymentSettings: PaymentSetting[];
  paymentSettingsError: boolean;
  promptPayQrDataUrl: string | null;
  t: (th: string, en: string) => string;
  serif: string;
}) {
  return (
    <Card className="rounded-sm border-zinc-200 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <h2 className={cn(serif, "text-sm font-medium text-zinc-800")}>
          {t("ชำระเงินด้วยการโอนเงิน", "Bank transfer")}
        </h2>
        <p className="text-xs text-zinc-500">
          {t("ธนาคาร / PromptPay — ใช้ยอดสุทธิด้านบนเมื่อโอน", "Bank / PromptPay — use the net total above when transferring.")}
        </p>

        <div className="space-y-3 border-t border-zinc-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("รายละเอียดการโอน (สาธารณะ)", "Transfer details")}
          </p>
          {paymentSettingsError && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("ไม่สามารถโหลดข้อมูลบัญชีได้ กรุณาลองใหม่หรือดูหน้าชำระเงินหลังสั่งซื้อ", "Could not load bank details. You can still place the order and see instructions on the next page.")}
            </p>
          )}
          {!paymentSettingsError && paymentSettings.length === 0 && (
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">
              {t("ยังไม่มีช่องทางโอนที่เปิดใช้งาน — ทีมงานจะติดต่อกลับ", "No active transfer methods — our team will follow up.")}
            </p>
          )}
          {paymentSettings.map((pm) => (
            <Card key={`${pm.source}-${pm.id}`} className="rounded-sm border-zinc-200 bg-white shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base text-primary">
                  {pm.source === "promptpay"
                    ? t("พร้อมเพย์", "PromptPay")
                    : pm.bank_name ?? t("โอนเงินผ่านธนาคาร", "Bank transfer")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0 text-sm">
                {pm.source === "bank" && pm.bank_name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-500">{t("ธนาคาร", "Bank")}</span>
                    <span className="font-medium text-zinc-900">{pm.bank_name}</span>
                  </div>
                )}
                {pm.account_number && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-500">
                      {pm.source === "promptpay" ? t("หมายเลขพร้อมเพย์", "PromptPay ID") : t("เลขบัญชี", "Account number")}
                    </span>
                    <span className="font-mono font-medium text-zinc-900">{pm.account_number}</span>
                  </div>
                )}
                {pm.account_name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-500">{t("ชื่อบัญชี", "Account name")}</span>
                    <span className="font-medium text-zinc-900">{pm.account_name}</span>
                  </div>
                )}
                {pm.source === "promptpay" && promptPayQrDataUrl ? (
                  <div className="mx-auto mt-2 flex w-[220px] max-w-full justify-center">
                    <Image
                      src={promptPayQrDataUrl}
                      alt={t("QR พร้อมเพย์ตามยอดออเดอร์", "PromptPay QR with order amount")}
                      width={QR_IMAGE_SIZE}
                      height={QR_IMAGE_SIZE}
                      className="h-[220px] w-[220px] max-w-full rounded-lg border border-zinc-200 object-contain"
                      unoptimized
                    />
                  </div>
                ) : pm.qr_code_url ? (
                  <div className="mx-auto mt-2 flex w-[220px] max-w-full justify-center">
                    <Image
                      src={pm.qr_code_url}
                      alt={
                        pm.source === "promptpay"
                          ? t("QR Code พร้อมเพย์สำหรับชำระเงิน", "PromptPay QR code for payment")
                          : t("QR Code โอนเงินผ่านธนาคารสำหรับชำระเงิน", "Bank transfer QR code for payment")
                      }
                      width={QR_IMAGE_SIZE}
                      height={QR_IMAGE_SIZE}
                      className="h-[220px] w-[220px] max-w-full object-contain"
                      sizes="220px"
                      unoptimized={shouldOffloadImageOptimization(pm.qr_code_url)}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
