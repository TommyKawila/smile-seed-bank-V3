"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActiveBankAccount } from "@/lib/storefront-payment-shared";
import { PAYMENT_CONFIG } from "@/lib/storefront-payment-shared";
import { DynamicPromptPayQr, type PromptPayCheckoutBody } from "@/components/storefront/checkout/DynamicPromptPayQr";
import { BankTransferAccountList } from "@/components/storefront/checkout/BankTransferAccountList";

export function PaymentSection({
  bankAccounts,
  bankAccountsError,
  grandTotalBaht,
  promptPayCheckout,
  deferPromptPayFetch = false,
  t,
  serif,
}: {
  bankAccounts: ActiveBankAccount[];
  bankAccountsError: boolean;
  grandTotalBaht: number;
  promptPayCheckout: PromptPayCheckoutBody;
  deferPromptPayFetch?: boolean;
  t: (th: string, en: string) => string;
  serif: string;
}) {
  const promptPayOn = PAYMENT_CONFIG.isPromptPayEnabled;

  return (
    <Card className="rounded-sm border-zinc-200 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <h2 className={cn(serif, "text-sm font-medium text-zinc-800")}>
          {t("ชำระเงิน", "Payment")}
        </h2>
        <p className="text-xs text-zinc-500">
          {promptPayOn
            ? t(
                "สแกน QR พร้อมเพย์ด้านล่างตามยอดสุทธิ — และ/หรือโอนผ่านธนาคารตามบัญชีที่เปิดใช้งานด้านล่าง",
                "Use PromptPay below for your net total and/or transfer to an active bank account listed below.",
              )
            : t(
                "โอนเงินตามยอดสุทธิเข้าบัญชีด้านล่าง จากนั้นดำเนินการสั่งซื้อและอัปโหลดหลักฐานตามลิงก์ที่ได้รับ",
                "Transfer the net total to an account below, then complete your order and upload proof when prompted.",
              )}
        </p>

        <div className="space-y-3 border-t border-zinc-100 pt-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("รายละเอียดการโอน (สาธารณะ)", "Transfer details")}
          </p>

          {bankAccountsError && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t(
                "ไม่สามารถโหลดบัญชีจากระบบได้ — รีเฟรชหน้า หรือติดต่อร้านหากยังไม่เห็นข้อมูลโอน",
                "Bank details could not be loaded. Refresh the page, or contact the shop if instructions are missing.",
              )}
            </p>
          )}

          {promptPayOn ? (
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
          ) : null}

          <div className="space-y-3">
            <BankTransferAccountList
              accounts={bankAccounts}
              grandTotalBaht={grandTotalBaht}
              t={t}
            />

            {!bankAccountsError && bankAccounts.length === 0 && (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-center text-sm text-zinc-600">
                {t(
                  "ยังไม่มีบัญชีสำหรับแสดง — กรุณาติดต่อร้านเพื่อขอข้อมูลโอนเงิน",
                  "No active bank accounts are listed. Please contact the shop for transfer details.",
                )}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
