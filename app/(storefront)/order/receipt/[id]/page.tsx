import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getOrderReceiptCardByClaimToken } from "@/lib/services/order-service";
import {
  STOREFRONT_KBANK_TRANSFER_ACCOUNT_NO,
  STOREFRONT_KBANK_TRANSFER_QR_IMAGE,
  STOREFRONT_KBANK_TRANSFER_NAME_TH,
  STOREFRONT_KBANK_TRANSFER_NAME_EN,
} from "@/lib/storefront-payment-shared";
import { formatPrice, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusLabel(status: string, lang: "th" | "en"): string {
  const m: Record<string, { th: string; en: string }> = {
    PENDING_INFO: { th: "รอดำเนินการ", en: "Pending" },
    AWAITING_VERIFICATION: { th: "รอตรวจสอบการชำระ", en: "Awaiting verification" },
    PAID: { th: "ชำระแล้ว", en: "Paid" },
    COMPLETED: { th: "เสร็จสมบูรณ์", en: "Completed" },
    SHIPPED: { th: "จัดส่งแล้ว", en: "Shipped" },
    CANCELLED: { th: "ยกเลิก", en: "Cancelled" },
    VOIDED: { th: "ยกเลิก/คืน", en: "Voided" },
  };
  return m[status]?.[lang] ?? status;
}

export default async function OrderReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang: langQ } = await searchParams;
  const lang: "th" | "en" = langQ === "en" ? "en" : "th";
  let token = typeof id === "string" ? id.trim() : "";
  try {
    token = decodeURIComponent(token);
  } catch {
    /* keep raw */
  }

  const { data, error } = await getOrderReceiptCardByClaimToken(token);
  if (error || !data) notFound();

  const unpaidForQr = ["PENDING_INFO", "PENDING", "PENDING_PAYMENT"].includes(data.status);

  const claimHref = `/order/claim/${data.claim_token}${lang === "en" ? "?lang=en" : ""}`;
  const selfTh = `/order/receipt/${token}`;
  const selfEn = `/order/receipt/${token}?lang=en`;

  const t = {
    title: lang === "th" ? "ใบเสร็จดิจิทัล" : "Digital receipt",
    subtitle:
      lang === "th"
        ? "สแกน QR ธนาคารแล้วยืนยันที่อยู่ด้านล่าง"
        : "Scan the bank QR, then confirm your details below",
    order: lang === "th" ? "เลขที่" : "Order",
    orderId: lang === "th" ? "รหัส" : "ID",
    status: lang === "th" ? "สถานะ" : "Status",
    items: lang === "th" ? "รายการ" : "Items",
    total: lang === "th" ? "ยอดชำระ" : "Amount due",
    qrCaption: lang === "th" ? "สแกนเพื่อชำระเงิน" : "Scan to pay",
    cta: lang === "th" ? "ยืนยันที่อยู่และแนบสลิป" : "Confirm address & slip",
    langTh: lang === "th" ? "ไทย" : "TH",
    langEn: lang === "en" ? "EN" : "EN",
  };

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/40 px-4 py-10 pb-24">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex justify-end gap-1 text-sm">
          <Link
            href={selfTh}
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              lang === "th" ? "bg-emerald-800 text-white" : "text-emerald-800 hover:bg-emerald-100",
            )}
          >
            {t.langTh}
          </Link>
          <Link
            href={selfEn}
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              lang === "en" ? "bg-emerald-800 text-white" : "text-emerald-800 hover:bg-emerald-100",
            )}
          >
            {t.langEn}
          </Link>
        </div>

        <div
          className={cn(
            "overflow-hidden rounded-3xl border border-emerald-100/90 bg-white",
            "shadow-[0_25px_50px_-12px_rgba(6,78,59,0.18),0_0_0_1px_rgba(16,185,129,0.06)]",
            "ring-1 ring-emerald-900/5",
          )}
        >
          <div className="border-b border-emerald-600/20 bg-gradient-to-br from-emerald-800 via-emerald-800 to-emerald-900 px-6 py-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
              Smile Seed Bank
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">{t.title}</h1>
            <p className="mt-1 text-sm leading-relaxed text-emerald-100/95">{t.subtitle}</p>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 pb-3">
              <div>
                <p className="text-xs text-zinc-500">{t.order}</p>
                <p className="font-mono text-lg font-semibold text-emerald-900">
                  #{data.order_number}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">{t.status}</p>
                <p className="text-sm font-medium text-zinc-800">
                  {statusLabel(data.status, lang)}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              {t.orderId}: {data.order_id}
            </p>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {t.items}
              </p>
              <ul className="space-y-2">
                {data.items.map((row, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-3 border-b border-zinc-50 pb-2 text-sm last:border-0"
                  >
                    <span className="text-zinc-800">
                      {row.product_name}
                      {row.unit_label ? (
                        <span className="text-zinc-500"> ({row.unit_label})</span>
                      ) : null}{" "}
                      × {row.quantity}
                    </span>
                    <span className="shrink-0 font-medium text-emerald-900 tabular-nums">
                      {formatPrice(row.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-50 to-white px-4 py-3.5 ring-1 ring-emerald-100/80">
              <span className="text-sm font-semibold text-emerald-900">{t.total}</span>
              <span className="text-xl font-bold tracking-tight text-emerald-800 tabular-nums">
                {formatPrice(data.total_amount)}
              </span>
            </div>

            {unpaidForQr ? (
              <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-b from-white to-emerald-50/30 p-5 text-center shadow-inner shadow-emerald-900/5">
                <p className="mb-2 text-xs text-zinc-600">
                  {lang === "th" ? STOREFRONT_KBANK_TRANSFER_NAME_TH : STOREFRONT_KBANK_TRANSFER_NAME_EN} ·{" "}
                  <span className="font-mono font-medium text-zinc-900">{STOREFRONT_KBANK_TRANSFER_ACCOUNT_NO}</span>
                </p>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-emerald-800/90">
                  {t.qrCaption}
                </p>
                <div className="mx-auto flex w-full max-w-[320px] justify-center">
                  <Image
                    src={STOREFRONT_KBANK_TRANSFER_QR_IMAGE}
                    alt={lang === "th" ? "QR โอน K-Bank" : "K-Bank Thai QR"}
                    width={320}
                    height={320}
                    className="h-auto w-full rounded-2xl border border-white bg-white shadow-md object-contain"
                    sizes="(max-width: 480px) 100vw, 320px"
                    unoptimized
                  />
                </div>
              </div>
            ) : null}

            {data.status === "PENDING_INFO" ? (
              <Link
                href={claimHref}
                className="flex w-full items-center justify-center rounded-2xl bg-emerald-800 px-4 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-800/95 active:scale-[0.99]"
              >
                {t.cta}
              </Link>
            ) : (
              <p className="text-center text-xs text-zinc-500">
                {lang === "th"
                  ? "ลิงก์กรอกข้อมูลปิดเมื่อออเดอร์ดำเนินการแล้ว"
                  : "Claim link is no longer available for this order."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
