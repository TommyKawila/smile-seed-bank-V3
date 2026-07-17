"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { ActiveBankAccount } from "@/lib/storefront-payment-shared";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

export function BankTransferAccountList({
  accounts,
  grandTotalBaht,
  t,
}: {
  accounts: ActiveBankAccount[];
  grandTotalBaht: number;
  t: (th: string, en: string) => string;
}) {
  return (
    <>
      {accounts.map((acc) => (
        <div
          key={`bank-${acc.id}`}
          className="rounded-xl border border-border/95 bg-card p-4 shadow-sm"
        >
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("ยอดที่ต้องโอน", "Amount to transfer")}
            </span>
            <span className="font-mono text-xl font-semibold tabular-nums text-primary">
              {formatPrice(grandTotalBaht)}
            </span>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">{t("ธนาคาร", "Bank")}</dt>
              <dd className="text-right font-medium text-foreground">{acc.bank_name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">{t("ชื่อบัญชี", "Account name")}</dt>
              <dd className="text-right font-medium text-foreground">
                {acc.account_name ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">{t("เลขบัญชี", "Account no.")}</dt>
              <dd className="font-mono font-medium tabular-nums text-foreground">
                {acc.account_number}
              </dd>
            </div>
          </dl>
          {acc.qr_code_url ? (
            <div className="mx-auto mt-3 flex w-[200px] max-w-full justify-center">
              <Image
                src={acc.qr_code_url}
                alt=""
                width={200}
                height={200}
                className="h-[200px] w-[200px] max-w-full rounded-lg border border-border object-contain"
                sizes="200px"
                unoptimized={shouldOffloadImageOptimization(acc.qr_code_url)}
              />
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}
