"use client";

import { BACKUP_BANK_DETAILS } from "@/lib/storefront-payment-shared";
import { cn, formatPrice } from "@/lib/utils";

export function ManualBankBackupCard({
  amountBaht,
  t,
  className,
  variant = "secondary",
}: {
  amountBaht: number;
  t: (th: string, en: string) => string;
  className?: string;
  /** `primary` = main checkout method; `secondary` = optional alongside PromptPay. */
  variant?: "primary" | "secondary";
}) {
  const primary = variant === "primary";
  return (
    <div
      className={cn(
        "rounded-sm border bg-white p-4 shadow-sm",
        primary ? "border-primary/25 ring-1 ring-primary/10" : "border-zinc-200/90",
        className,
      )}
    >
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {primary
          ? t("โอนเงินผ่านธนาคาร", "Bank transfer")
          : t("ช่องทางโอนเงินผ่านธนาคาร", "Alternative payment method")}
      </p>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 pb-3">
        <span className="text-xs text-zinc-500">
          {t("ยอดที่ต้องโอน", "Amount to transfer")}
        </span>
        <span className="font-mono text-lg font-semibold tabular-nums text-primary">
          {formatPrice(amountBaht)}
        </span>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-zinc-500">{t("ธนาคาร", "Bank")}</dt>
          <dd className="text-right font-medium text-zinc-900">
            {BACKUP_BANK_DETAILS.bankNameTh}
            <span className="text-zinc-400"> · </span>
            <span className="text-zinc-700">{BACKUP_BANK_DETAILS.bankNameEn}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-zinc-500">{t("ชื่อบัญชี", "Account name")}</dt>
          <dd className="text-right font-medium text-zinc-900">{BACKUP_BANK_DETAILS.accountName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-zinc-500">{t("เลขบัญชี", "Account no.")}</dt>
          <dd className="text-right font-mono font-medium tabular-nums text-zinc-900">
            {BACKUP_BANK_DETAILS.accountNumberDisplay}
          </dd>
        </div>
      </dl>
    </div>
  );
}
