"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PaymentSetting } from "@/lib/storefront-payment-shared";
import { isPrimaryKbankCheckoutAccount } from "@/lib/storefront-payment-shared";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { DynamicPromptPayQr, type PromptPayCheckoutBody } from "@/components/storefront/checkout/DynamicPromptPayQr";

export function PaymentSection({
  paymentSettings,
  paymentSettingsError,
  grandTotalBaht,
  promptPayCheckout,
  deferPromptPayFetch = false,
  t,
  serif,
}: {
  paymentSettings: PaymentSetting[];
  paymentSettingsError: boolean;
  grandTotalBaht: number;
  promptPayCheckout: PromptPayCheckoutBody;
  deferPromptPayFetch?: boolean;
  t: (th: string, en: string) => string;
  serif: string;
}) {
  const extraBanks = paymentSettings.filter(
    (p) => !isPrimaryKbankCheckoutAccount(p.account_number),
  );

  return (
    <Card className="rounded-sm border-zinc-200 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <h2 className={cn(serif, "text-sm font-medium text-zinc-800")}>
          {t("ชำระเงิน", "Payment")}
        </h2>
        <p className="text-xs text-zinc-500">
          {t(
            "สแกน QR พร้อมเพย์ด้านล่างตามยอดสุทธิด้านบน — มีบัญชีธนาคารเสริมด้านล่างหากต้องการโอนธรรมดา",
            "Scan the PromptPay QR below for your net total. Optional bank transfers are listed underneath.",
          )}
        </p>

        <div className="space-y-3 border-t border-zinc-100 pt-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("รายละเอียดการโอน (สาธารณะ)", "Transfer details")}
          </p>

          {paymentSettingsError && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t(
                "ไม่สามารถโหลดบัญชีธนาคารจากระบบได้ — พร้อมเพย์ด้านล่างยังใช้ได้",
                "Could not load bank accounts from the server — PromptPay below still works.",
              )}
            </p>
          )}

          <div className="flex w-full justify-center">
            <div className="w-full max-w-md">
              <DynamicPromptPayQr
                amountBaht={grandTotalBaht}
                resolution={{ mode: "checkout", checkout: promptPayCheckout }}
                deferPromptPayFetch={deferPromptPayFetch}
                t={t}
              />
            </div>
          </div>

          {extraBanks.map((pm) => (
            <Card key={`bank-${pm.id}`} className="rounded-sm border-zinc-200 bg-white shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base text-primary">
                  {pm.bank_name ?? t("โอนเงินผ่านธนาคาร", "Bank transfer")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0 text-sm">
                {pm.bank_name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-500">{t("ธนาคาร", "Bank")}</span>
                    <span className="font-medium text-zinc-900">{pm.bank_name}</span>
                  </div>
                )}
                {pm.account_number && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-500">{t("เลขบัญชี", "Account number")}</span>
                    <span className="font-mono font-medium text-zinc-900">{pm.account_number}</span>
                  </div>
                )}
                {pm.account_name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-500">{t("ชื่อบัญชี", "Account name")}</span>
                    <span className="font-medium text-zinc-900">{pm.account_name}</span>
                  </div>
                )}
                {pm.qr_code_url ? (
                  <div className="mx-auto mt-2 flex w-[220px] max-w-full justify-center">
                    <Image
                      src={pm.qr_code_url}
                      alt={t("QR Code โอนเงินผ่านธนาคารสำหรับชำระเงิน", "Bank transfer QR code for payment")}
                      width={220}
                      height={220}
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
