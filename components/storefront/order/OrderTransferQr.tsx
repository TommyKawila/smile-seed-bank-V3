"use client";

import { DynamicPromptPayQr } from "@/components/storefront/checkout/DynamicPromptPayQr";
import { PAYMENT_CONFIG } from "@/lib/storefront-payment-shared";

export function OrderTransferQr({
  orderNumber,
  amountBaht,
  payeeDisplayName,
  lang,
}: {
  orderNumber: string;
  amountBaht: number;
  payeeDisplayName?: string;
  lang: "th" | "en";
}) {
  const t = (th: string, en: string) => (lang === "th" ? th : en);

  if (!PAYMENT_CONFIG.isPromptPayEnabled) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        {t("โอนตามเลขบัญชีด้านบน", "Transfer using the account number above.")}
      </p>
    );
  }

  return (
    <DynamicPromptPayQr
      embedded
      amountBaht={amountBaht}
      resolution={{ mode: "order", orderNumber }}
      payeeDisplayName={payeeDisplayName}
      t={t}
    />
  );
}
