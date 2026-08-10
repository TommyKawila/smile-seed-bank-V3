"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveBankAccount, StorefrontPromptPayPublic } from "@/lib/storefront-payment-shared";
import { PAYMENT_CONFIG } from "@/lib/storefront-payment-shared";
import {
  DynamicPromptPayQr,
  type PromptPayResolution,
} from "@/components/storefront/checkout/DynamicPromptPayQr";
import { BankTransferAccountList } from "@/components/storefront/checkout/BankTransferAccountList";

export function PaymentSection({
  bankAccounts,
  bankAccountsError,
  grandTotalBaht,
  promptPayResolution,
  promptPaySettings,
  shippingIncluded,
  deferPromptPayFetch = false,
  t,
  serif,
}: {
  bankAccounts: ActiveBankAccount[];
  bankAccountsError: boolean;
  grandTotalBaht: number;
  promptPayResolution: PromptPayResolution;
  promptPaySettings: StorefrontPromptPayPublic;
  shippingIncluded: boolean;
  deferPromptPayFetch?: boolean;
  t: (th: string, en: string) => string;
  serif: string;
}) {
  const promptPayOn = PAYMENT_CONFIG.isPromptPayEnabled;
  const [promptPayReloadNonce, setPromptPayReloadNonce] = useState(0);
  const deferFetch =
    deferPromptPayFetch && promptPayResolution.mode === "checkout";

  return (
    <Card className="rounded-xl border-border/60 bg-zinc-950/40 shadow-none">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <h2 className={cn(serif, "text-base font-semibold tracking-tight text-zinc-100")}>
          {t("ชำระเงิน", "Payment")}
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {promptPayOn
            ? t(
                "สแกน QR พร้อมเพย์ตามยอดสุทธิที่ระบบยืนยัน — และ/หรือโอนผ่านธนาคารด้านล่าง",
                "Scan PromptPay for the server-confirmed net total and/or bank transfer below.",
              )
            : t(
                "โอนเงินตามยอดสุทธิเข้าบัญชีด้านล่าง จากนั้นดำเนินการสั่งซื้อและอัปโหลดหลักฐานตามลิงก์ที่ได้รับ",
                "Transfer the net total to an account below, then complete your order and upload proof when prompted.",
              )}
        </p>

        {promptPayOn ? (
          <div className="space-y-2">
            {shippingIncluded ? (
              <p className="text-center text-[11px] font-medium text-muted-foreground">
                {t("ยอดเงินรวมค่าจัดส่งแล้ว", "Total includes shipping")}
              </p>
            ) : null}
            <div className="flex w-full justify-center">
              <div className="w-full max-w-md space-y-2">
                <DynamicPromptPayQr
                  amountBaht={grandTotalBaht}
                  resolution={promptPayResolution}
                  deferPromptPayFetch={deferFetch}
                  reloadNonce={promptPayReloadNonce}
                  payeeDisplayName={promptPaySettings.payeeDisplayName}
                  t={t}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-11 min-h-[44px] w-full gap-2 rounded-lg border-zinc-700 bg-zinc-900/50 text-zinc-300 shadow-none hover:border-zinc-600 hover:bg-zinc-900/70"
                  onClick={() => setPromptPayReloadNonce((n) => n + 1)}
                >
                  <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                  {t("สร้าง QR ใหม่", "Refetch QR")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3 border-t border-border/60 pt-4">
          <p className="text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {t("รายละเอียดการโอน (สาธารณะ)", "Transfer details")}
          </p>

          {bankAccountsError && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t(
                "ไม่สามารถโหลดบัญชีจากระบบได้ — รีเฟรชหน้า หรือติดต่อร้านหากยังไม่เห็นข้อมูลโอน",
                "Bank details could not be loaded. Refresh the page, or contact the shop if instructions are missing.",
              )}
            </p>
          )}

          <div className="space-y-3">
            <BankTransferAccountList
              accounts={bankAccounts}
              grandTotalBaht={grandTotalBaht}
              t={t}
            />

            {!bankAccountsError && bankAccounts.length === 0 && (
              <p className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center text-sm text-zinc-500">
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
