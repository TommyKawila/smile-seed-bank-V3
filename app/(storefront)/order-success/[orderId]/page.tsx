"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Home,
  ShoppingBag,
  CreditCard,
  Upload,
  AlertCircle,
  CircleX,
  Truck,
  Copy,
  Check,
  RotateCcw,
  FileText,
  MessageCircle,
} from "lucide-react";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { fetchStorefrontReceiptPdfSettings } from "@/lib/pdf-settings";
import { computeOrderReceiptFinancials } from "@/lib/order-receipt-math";
import { formatPaymentMethodForPdf, generateReceiptPDF, isReceiptEligibleStatus } from "@/lib/receipt-pdf";
import {
  lineOaPrefillUrlForOrderSuccess,
  lineOaPrefillUrlForParcelInquiry,
  lineOaPrefillUrlForCancelledOrder,
} from "@/lib/line-oa-url";
import type { OrderSuccessView, OrderSuccessItemRow } from "@/lib/services/order-service";
import { labelForFloweringTypeRaw } from "@/lib/seed-type-filter";
import {
  formatSeedsCountLabel,
  type OrderDisplayLocale,
} from "@/lib/order-receipt-line-format";
import { orderIsPaymentReceived, orderIsReadyToShip } from "@/lib/order-paid";
import { LineOaResponsiveCta } from "@/components/storefront/LineOaResponsiveCta";

/** Storefront payment-settings API: `lineId` = `payment_settings.line_id` (LINE OA @handle). */
type PaySettings = {
  bank: { name: string; accountNo: string; accountName: string } | null;
  promptPay: { identifier: string; qrUrl: string } | null;
  lineId?: string | null;
};

const CARRIER_LABELS: Record<string, string> = {
  THAILAND_POST: "ไปรษณีย์ไทย",
  KERRY_EXPRESS: "Kerry Express",
  FLASH_EXPRESS: "Flash Express",
  "J&T_EXPRESS": "J&T Express",
};

type TFn = (th: string, en: string) => string;

function orderSuccessItemSummaryLine(
  line: OrderSuccessItemRow,
  displayLocale: OrderDisplayLocale,
  t: TFn
): string {
  const breeder = (line.breeder_name ?? "").trim() || "—";
  const seeds = formatSeedsCountLabel(
    line.unit_label,
    line.variant_unit_label,
    displayLocale
  );
  const type = line.flowering_type?.trim()
    ? labelForFloweringTypeRaw(line.flowering_type, t)
    : "—";
  return `${breeder} | ${line.product_name} (${seeds}) (${type})`;
}

function pricingFromOrder(order: OrderSuccessView) {
  const itemsSubtotal = order.items.reduce((s, l) => s + l.line_total, 0);
  const shipping = Number(order.shipping_fee ?? 0);
  const fromDb =
    Number(order.discount_amount ?? 0) +
    Number(order.promotion_discount_amount ?? 0) +
    Number(order.points_discount_amount ?? 0);
  const implied = Math.max(0, Math.round((itemsSubtotal + shipping - order.total_amount) * 100) / 100);
  const discountTotal = fromDb > 0.005 ? fromDb : implied;
  const pct =
    itemsSubtotal > 0.005 && discountTotal > 0.005
      ? Math.min(100, Math.max(1, Math.round((discountTotal / itemsSubtotal) * 100)))
      : 0;
  return { itemsSubtotal, shipping, discountTotal, pct };
}

function OrderPriceBreakdown({ order, t }: { order: OrderSuccessView; t: TFn }) {
  const { itemsSubtotal, shipping, discountTotal, pct } = pricingFromOrder(order);
  const showDisc = discountTotal > 0.005;
  const discLabel =
    pct >= 1 && pct <= 99
      ? t(`ส่วนลด ${pct}%`, `${pct}% off`)
      : t("ส่วนลด", "Discount");
  return (
    <div className="space-y-2.5 rounded-lg border border-zinc-100 bg-white px-3.5 py-4 sm:px-4">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-zinc-500">{t("ยอดรวมสินค้า", "Subtotal")}</span>
        <span className="tabular-nums text-zinc-600">{formatPrice(itemsSubtotal)}</span>
      </div>
      {showDisc ? (
        <div className="flex justify-between gap-3 text-sm">
          <span className="font-medium text-orange-600">{discLabel}</span>
          <span className="tabular-nums font-semibold text-orange-600">−{formatPrice(discountTotal)}</span>
        </div>
      ) : null}
      {shipping > 0.005 ? (
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-zinc-500">{t("ค่าจัดส่ง", "Shipping")}</span>
          <span className="tabular-nums text-zinc-600">{formatPrice(shipping)}</span>
        </div>
      ) : null}
      <Separator className="bg-zinc-100" />
      <div className="flex items-end justify-between gap-3 pt-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {t("ยอดสุทธิ", "Total")}
        </span>
        <span className="text-xl font-extrabold tabular-nums text-primary sm:text-2xl">
          {formatPrice(order.total_amount)}
        </span>
      </div>
    </div>
  );
}

function ShippingRecipientBlock({ order, t }: { order: OrderSuccessView; t: TFn }) {
  if (!order.shipping_address && !order.customer_name?.trim() && !order.customer_phone?.trim()) {
    return null;
  }
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {t("ที่อยู่จัดส่ง", "Shipping address")}
      </p>
      {order.customer_name?.trim() ? (
        <p className="mt-2 text-sm font-bold text-zinc-900">{order.customer_name.trim()}</p>
      ) : null}
      {order.customer_phone?.trim() ? (
        <p className="mt-1 font-mono text-sm tabular-nums text-zinc-700">{order.customer_phone.trim()}</p>
      ) : null}
      {order.shipping_address ? (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700">{order.shipping_address}</p>
      ) : null}
    </div>
  );
}

function LineOrderUpdatesPromo({
  t,
  href,
  lineId,
  orderNo,
}: {
  t: TFn;
  href: string;
  lineId: string | null;
  orderNo: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-[#06C755] bg-gradient-to-br from-[#ecfdf5] from-40% via-white to-white p-4 shadow-md ring-1 ring-[#06C755]/15">
      <div className="mb-1.5 flex items-center justify-center gap-2">
        <MessageCircle className="h-7 w-7 shrink-0 text-[#06C755]" aria-hidden />
        <span className="text-center text-base font-extrabold leading-tight text-[#047857] sm:text-lg">
          {t("รับอัปเดตออเดอร์ทาง LINE", "Get order updates on LINE")}
        </span>
      </div>
      <p className="text-center text-[11px] leading-relaxed text-zinc-600">
        {t(
          "ยืนยันชำระ / เลขพัสดุ — แอด LINE แล้วส่งเลขออเดอร์ (รองรับอีเมลหากยังไม่เชื่อม)",
          "Payment & shipping alerts — add LINE and send your order #. Email is used if LINE is not linked.",
        )}
      </p>
      <div className="mt-3">
        <LineOaResponsiveCta
          href={href}
          orderNumber={orderNo}
          lineId={lineId}
          desktopAddFriend
          className="h-12 gap-2 py-0 text-base font-extrabold"
        >
          {t("รับอัปเดตออเดอร์บน LINE", "Get updates on LINE")}
        </LineOaResponsiveCta>
      </div>
    </div>
  );
}

export default function OrderSuccessDynamicPage() {
  const params = useParams();
  const rawId = typeof params.orderId === "string" ? params.orderId : "";
  const orderNumber = decodeURIComponent(rawId).replace(/^#/, "").trim();
  const { t, locale } = useLanguage();

  const [order, setOrder] = useState<OrderSuccessView | null>(null);
  const [loadError, setLoadError] = useState<"not_found" | "auth" | "forbidden" | "server" | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const [paySettings, setPaySettings] = useState<PaySettings>({ bank: null, promptPay: null, lineId: null });
  const [shopLineId, setShopLineId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const loadOrder = useCallback(async (opts?: { silent?: boolean }) => {
    if (!orderNumber) {
      setLoadError("not_found");
      setLoading(false);
      return;
    }
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/storefront/orders/success-view?order=${encodeURIComponent(orderNumber)}`,
        { credentials: "include", cache: "no-store" }
      );
      if (res.status === 404) {
        setLoadError("not_found");
        setOrder(null);
        return;
      }
      if (res.status === 401) {
        setLoadError("auth");
        setOrder(null);
        return;
      }
      if (res.status === 403) {
        setLoadError("forbidden");
        setOrder(null);
        return;
      }
      if (!res.ok) {
        setLoadError("server");
        setOrder(null);
        return;
      }
      const data = (await res.json()) as OrderSuccessView;
      setOrder(data);
    } catch {
      setLoadError("server");
      setOrder(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    fetch("/api/storefront/payment-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : {}))
      .then(
        (data: {
          bank?: PaySettings["bank"];
          promptPay?: PaySettings["promptPay"];
          lineId?: string | null;
        }) => {
          if (cancelled) return;
          const lid = data.lineId?.trim();
          setPaySettings({
            bank: data.bank ?? null,
            promptPay: data.promptPay ?? null,
            lineId: lid && lid.length > 0 ? lid : null,
          });
          setShopLineId(lid && lid.length > 0 ? lid : null);
        }
      );
    return () => {
      cancelled = true;
    };
  }, [order]);

  useEffect(() => {
    if (!order || order.payment_method !== "TRANSFER" || order.status !== "PENDING" || order.slip_url) {
      setQrDataUrl(null);
      return;
    }
    const promptId = paySettings.promptPay?.identifier;
    if (!order.total_amount || !promptId) {
      setQrDataUrl(null);
      return;
    }
    const amount = Number(order.total_amount);
    const payload = generatePayload(promptId, { amount });
    QRCode.toDataURL(payload, { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [order, paySettings.promptPay?.identifier]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
    setUploadError(null);
  };

  const handleSlipConfirm = async () => {
    if (!selectedFile || !orderNumber) {
      setUploadError(t("กรุณาเลือกไฟล์หลักฐานการโอนเงิน", "Please choose a payment slip file."));
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
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadOrder({ silent: true });
    } catch (err) {
      setUploadError(String(err).replace("Error: ", ""));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError === "not_found" || !orderNumber) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-zinc-50 px-4 pt-20 pb-12 text-center">
        <p className="text-zinc-600">
          {t("ไม่พบออเดอร์", "Order not found.")}
        </p>
        <Button asChild variant="outline">
          <Link href="/shop">{t("กลับไปเลือกสินค้า", "Continue shopping")}</Link>
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    const next = `/order-success/${encodeURIComponent(orderNumber)}`;
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-zinc-50 px-4 pt-20 pb-12 text-center">
        <p className="text-zinc-600">
          {t(
            "กรุณาเข้าสู่ระบบเพื่อดูออเดอร์นี้",
            "Please sign in to view this order."
          )}
        </p>
        <Button asChild className="bg-primary">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            {t("เข้าสู่ระบบ", "Sign in")}
          </Link>
        </Button>
      </div>
    );
  }

  if (loadError === "forbidden") {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-zinc-50 px-4 pt-20 pb-12 text-center">
        <p className="text-zinc-600">
          {t("คุณไม่มีสิทธิ์ดูออเดอร์นี้", "You do not have access to this order.")}
        </p>
        <Button asChild variant="outline">
          <Link href="/profile">{t("ออเดอร์ของฉัน", "My orders")}</Link>
        </Button>
      </div>
    );
  }

  if (loadError === "server" || !order) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-zinc-50 px-4 pt-20 pb-12 text-center">
        <p className="text-zinc-600">{t("โหลดข้อมูลไม่สำเร็จ", "Could not load order.")}</p>
        <Button type="button" variant="outline" onClick={() => void loadOrder()}>
          {t("ลองอีกครั้ง", "Try again")}
        </Button>
      </div>
    );
  }

  const displayNo = order.order_number;
  const lineLinked = order.line_linked === true;
  const isGuestOrder = order.is_guest === true;
  const isCancelled = order.status === "CANCELLED";
  const isVoided = order.status === "VOIDED";
  const isShipped = order.status === "SHIPPED";
  const showLineConversionHook = !lineLinked && !isVoided;

  const showTransferPayFlow =
    order.status === "PENDING" &&
    (order.payment_status ?? "").toLowerCase() !== "paid" &&
    order.payment_method === "TRANSFER" &&
    !order.slip_url;

  const lineOaId = shopLineId ?? paySettings.lineId ?? null;
  const lineHrefDefault = lineOaPrefillUrlForOrderSuccess(displayNo, lineOaId);
  const lineHrefCancelled = lineOaPrefillUrlForCancelledOrder(displayNo, lineOaId);
  const lineHrefParcel = lineOaPrefillUrlForParcelInquiry(displayNo, order.tracking_number, lineOaId);

  const copyTracking = () => {
    if (!order.tracking_number) return;
    void navigator.clipboard.writeText(order.tracking_number);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const copyOrderNumber = () => {
    void navigator.clipboard.writeText(displayNo);
    setCopiedOrderNo(true);
    setTimeout(() => setCopiedOrderNo(false), 2000);
  };

  const handleDownloadReceipt = async () => {
    if (!order || !isReceiptEligibleStatus(order.status, order.payment_status)) return;
    setReceiptLoading(true);
    try {
      const pdfSettings = await fetchStorefrontReceiptPdfSettings();
      const discountAmount =
        Number(order.discount_amount ?? 0) +
        Number(order.promotion_discount_amount ?? 0) +
        Number(order.points_discount_amount ?? 0);
      const { receiptItems, discountForPdf } = computeOrderReceiptFinancials({
        totalAmount: order.total_amount,
        shippingFee: Number(order.shipping_fee ?? 0),
        discountAmount,
        items: order.items.map((i) => ({
          productName: i.product_name,
          unitLabel: i.unit_label ?? "",
          variantUnitLabel: i.variant_unit_label ?? null,
          breederName: i.breeder_name,
          floweringType: i.flowering_type,
          quantity: i.quantity,
          totalPrice: i.line_total,
        })),
      });
      const doc = await generateReceiptPDF({
        docType: "receipt",
        orderNumber: order.order_number,
        orderDate: order.order_date,
        customerName: order.customer_name?.trim() ?? "",
        customerEmail: null,
        customerPhone: order.customer_phone ?? null,
        customerAddress: order.shipping_address ?? null,
        customerNote: null,
        items: receiptItems,
        grandTotal: order.total_amount,
        logoDataUrl: pdfSettings.logoDataUrl,
        companyName: pdfSettings.companyName,
        companyAddress: pdfSettings.companyAddress,
        companyEmail: pdfSettings.companyEmail,
        companyPhone: pdfSettings.companyPhone,
        companyLineId: pdfSettings.companyLineId,
        bankName: pdfSettings.bankName,
        bankAccountName: pdfSettings.bankAccountName,
        bankAccountNo: pdfSettings.bankAccountNo,
        socialLinks: pdfSettings.socialLinks ?? [],
        legalSeedLicenseNumber: pdfSettings.legalSeedLicenseNumber ?? null,
        legalBusinessRegistrationNumber: pdfSettings.legalBusinessRegistrationNumber ?? null,
        orderFinancials: {
          shippingFee: Number(order.shipping_fee ?? 0),
          discountAmount: discountForPdf,
        },
        paymentDate: order.order_date,
        paymentMethod: formatPaymentMethodForPdf(order.payment_method),
        receiptLocale: locale === "en" ? "en" : "th",
      });
      doc.save(`receipt-${order.order_number}.pdf`);
    } finally {
      setReceiptLoading(false);
    }
  };

  const paymentReceived = orderIsPaymentReceived(
    order.status,
    order.payment_status
  );
  const showSlipLineHelp =
    !isCancelled &&
    !isVoided &&
    !isShipped &&
    (order.status === "AWAITING_VERIFICATION" ||
      (!!order.slip_url &&
        !paymentReceived &&
        order.status !== "COMPLETED" &&
        order.status !== "DELIVERED"));

  let defaultHeroTitle: string;
  let defaultHeroTitleEn: string;
  let defaultHeroDesc: string;
  let defaultHeroDescEn: string;
  if (order.status === "VOIDED") {
    defaultHeroTitle = "ยกเลิกและคืนสินค้า";
    defaultHeroTitleEn = "Order voided — stock restored";
    defaultHeroDesc = "ออเดอร์นี้ถูกยกเลิกแล้ว";
    defaultHeroDescEn = "This order has been cancelled.";
  } else if (order.status === "CANCELLED") {
    defaultHeroTitle = "ยกเลิกแล้ว";
    defaultHeroTitleEn = "Cancelled";
    defaultHeroDesc = "ออเดอร์นี้ถูกยกเลิกแล้ว";
    defaultHeroDescEn = "This order has been cancelled.";
  } else if (orderIsReadyToShip(order.status, order.payment_status)) {
    defaultHeroTitle = "ชำระเงินเรียบร้อย";
    defaultHeroTitleEn = "Payment confirmed";
    defaultHeroDesc = "เรากำลังเตรียมและจัดส่งให้เร็วที่สุด";
    defaultHeroDescEn = "We are preparing your order for shipment.";
  } else if (order.status === "COMPLETED") {
    defaultHeroTitle = "คำสั่งซื้อเสร็จสมบูรณ์";
    defaultHeroTitleEn = "Order completed";
    defaultHeroDesc = "ขอบคุณที่ไว้วางใจเรา";
    defaultHeroDescEn = "Thank you for your trust.";
  } else if (order.status === "DELIVERED") {
    defaultHeroTitle = "ส่งถึงแล้ว";
    defaultHeroTitleEn = "Delivered";
    defaultHeroDesc = "หวังว่าคุณจะพึงพอใจกับสินค้า";
    defaultHeroDescEn = "We hope you enjoy your purchase.";
  } else if (order.status === "PROCESSING") {
    defaultHeroTitle = "กำลังดำเนินการ";
    defaultHeroTitleEn = "Processing";
    defaultHeroDesc = "เราจะอัปเดตสถานะให้เร็วที่สุด";
    defaultHeroDescEn = "We will update your order status soon.";
  } else if (
    order.status === "AWAITING_VERIFICATION" ||
    (!!order.slip_url && !orderIsReadyToShip(order.status, order.payment_status) && order.status !== "COMPLETED")
  ) {
    defaultHeroTitle = "ได้รับหลักฐานการโอนเงินเรียบร้อยแล้ว!";
    defaultHeroTitleEn = "Payment slip received!";
    defaultHeroDesc =
      "ขอบคุณที่ร่วมเป็นส่วนหนึ่งกับเรา แอดมินจะรีบตรวจสอบยอดโอนและดำเนินการจัดส่งให้เร็วที่สุด";
    defaultHeroDescEn =
      "Thank you for being part of our community. Our team will verify your payment and ship your order as soon as possible.";
  } else {
    defaultHeroTitle = "สถานะออเดอร์อัปเดต";
    defaultHeroTitleEn = "Order status updated";
    defaultHeroDesc = "ขอบคุณที่ร่วมเป็นส่วนหนึ่งกับเรา หากมีข้อสงสัยติดต่อแอดมินได้ทาง LINE";
    defaultHeroDescEn = "Thank you for your order. Contact us on LINE if you have questions.";
  }

  if (showTransferPayFlow) {
    return (
      <div className="min-h-screen bg-zinc-50 pt-20 pb-14">
        <div className="mx-auto max-w-lg space-y-5 px-4 sm:px-6">
          {showLineConversionHook ? (
            <LineOrderUpdatesPromo
              t={t}
              href={lineHrefDefault}
              lineId={lineOaId}
              orderNo={displayNo}
            />
          ) : null}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {t("เลขออเดอร์", "Order no.")}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <p className="min-w-0 truncate font-mono text-lg font-bold tabular-nums text-zinc-900 sm:text-xl">
                    #{displayNo}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyOrderNumber()}
                    className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-primary"
                    aria-label={t("คัดลอกเลขออเดอร์", "Copy order number")}
                  >
                    {copiedOrderNo ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                {t("รอชำระเงิน", "Awaiting payment")}
              </span>
            </div>
            <Separator className="my-4 bg-zinc-100" />
            <OrderPriceBreakdown order={order} t={t} />
          </div>

          <div className="space-y-4 rounded-2xl border border-primary/25 bg-accent/50 p-5">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <CreditCard className="h-5 w-5" />
              {t("ข้อมูลการโอนเงิน", "Transfer details")}
            </div>

            {!paySettings.bank && !paySettings.promptPay && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {t(
                  "ยังไม่มีข้อมูลบัญชีรับโอน — กรุณาติดต่อทางร้านค้า",
                  "Payment details are not configured — please contact the shop."
                )}
              </div>
            )}

            {paySettings.bank && (
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t("ธนาคาร", "Bank")}</span>
                  <span className="font-medium text-zinc-800">{paySettings.bank.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t("เลขบัญชี", "Account no.")}</span>
                  <span className="font-mono font-semibold text-zinc-900">{paySettings.bank.accountNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t("ชื่อบัญชี", "Account name")}</span>
                  <span className="font-medium text-zinc-800">{paySettings.bank.accountName}</span>
                </div>
              </div>
            )}

            {paySettings.promptPay && (
              <div className="flex flex-col items-center py-3">
                <p className="mb-3 text-xs text-zinc-500">
                  {t("สแกน QR PromptPay", "Scan PromptPay QR")}
                  {paySettings.promptPay.identifier ? ` (${paySettings.promptPay.identifier})` : ""}
                </p>
                <div className="rounded-xl bg-white p-3 shadow-md ring-1 ring-zinc-200/80">
                  {qrDataUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="PromptPay QR"
                        width={256}
                        height={256}
                        className="size-[256px] rounded-lg"
                      />
                      <p className="mt-3 text-center text-sm font-semibold text-primary">
                        {t("ยอดเงินรวมใน QR", "Amount in QR")}: {formatPrice(order.total_amount)}
                      </p>
                    </>
                  ) : paySettings.promptPay.qrUrl ? (
                    <>
                      <Image
                        src={paySettings.promptPay.qrUrl}
                        alt="PromptPay QR"
                        width={256}
                        height={256}
                        className="size-[256px] rounded-lg object-contain"
                        unoptimized
                      />
                      <p className="mt-3 text-center text-sm font-semibold text-zinc-600">
                        {t("ยอดเงินรวมใน QR", "Amount in QR")}: {formatPrice(order.total_amount)}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <p className="font-semibold text-zinc-800">
              {t("ส่งหลักฐานการโอนเงิน", "Upload payment slip")}
            </p>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 py-4 font-medium text-primary transition-colors hover:bg-accent"
            >
              <Upload className="h-5 w-5" />
              {selectedFile ? selectedFile.name : t("เลือกไฟล์สลิป", "Choose slip file")}
            </button>
            {uploadError && <p className="text-center text-xs text-red-500">{uploadError}</p>}

            <Button
              type="button"
              onClick={() => void handleSlipConfirm()}
              disabled={!selectedFile || uploading}
              className="h-12 w-full bg-primary text-base font-semibold text-white hover:bg-primary/90"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("กำลังอัปโหลด...", "Uploading...")}
                </>
              ) : (
                t("ยืนยันการชำระเงิน", "Confirm payment")
              )}
            </Button>
          </div>

          {isGuestOrder && !lineLinked ? (
            <div className="space-y-2">
              <p className="text-center text-[11px] text-zinc-500">
                {t(
                  "แอด LINE แล้วส่งเลขออเดอร์ในแชท — ระบบจะเชื่อมเพื่อแจ้งเตือนสถานะ",
                  "Add LINE and send your order number in chat to enable status alerts.",
                )}
              </p>
              <LineOaResponsiveCta
                href={lineHrefDefault}
                orderNumber={displayNo}
                lineId={lineOaId}
                desktopAddFriend
                className="gap-2 px-3 py-3.5 text-sm leading-snug"
              >
                {t(
                  "รับแจ้งเตือนสถานะผ่าน LINE (คลิกเพื่อแอดไลน์แล้วส่งเลขที่ออเดอร์มาให้เรา)",
                  "LINE updates: add us and send your order number in chat",
                )}
              </LineOaResponsiveCta>
            </div>
          ) : null}

          <div className="flex justify-center pb-4">
            <Button asChild variant="outline" className="h-10">
              <Link href="/">
                <Home className="mr-1.5 h-4 w-4" />
                {t("หน้าแรก", "Home")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-14">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <Card className="overflow-hidden border-zinc-200/80 shadow-sm">
          {isCancelled ? (
            <div className="bg-red-900 px-5 py-7 text-center sm:px-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                <CircleX className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
                {t("ยกเลิกแล้ว", "Cancelled")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                {t("ออเดอร์นี้ถูกยกเลิกแล้ว", "This order has been cancelled.")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                {t(
                  "ออเดอร์นี้ไม่สามารถดำเนินการต่อได้ หากมีข้อสงสัยหรือต้องการสั่งซื้อใหม่ กรุณาติดต่อแอดมินผ่าน LINE",
                  "This order cannot proceed. For questions or to place a new order, please contact us on LINE."
                )}
              </p>
            </div>
          ) : isVoided ? (
            <div className="bg-zinc-700 px-5 py-7 text-center sm:px-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <RotateCcw className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
                {t("ยกเลิกและคืนสินค้า", "Cancelled — stock restored")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                {t("ออเดอร์นี้ถูกยกเลิกแล้ว", "This order has been cancelled.")}
              </p>
            </div>
          ) : isShipped ? (
            <div className="bg-primary px-5 py-7 text-center sm:px-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
                {t("จัดส่งแล้ว", "Shipped")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                {t(
                  "พัสดุของคุณอยู่ระหว่างจัดส่ง — ใช้เลขพัสดุด้านล่างเพื่อติดตาม",
                  "Your parcel is on the way — use the tracking number below."
                )}
              </p>
            </div>
          ) : (
            <div className="bg-primary px-5 py-7 text-center sm:px-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
                {t(defaultHeroTitle, defaultHeroTitleEn)}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                {t(defaultHeroDesc, defaultHeroDescEn)}
              </p>
            </div>
          )}

          <CardContent className="space-y-5 p-5 sm:p-6">
            {showLineConversionHook ? (
              <LineOrderUpdatesPromo
                t={t}
                href={lineHrefDefault}
                lineId={lineOaId}
                orderNo={displayNo}
              />
            ) : null}
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/90 px-3 py-2.5">
              <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                {t("เลขออเดอร์", "Order no.")}
              </p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="font-mono text-xl font-semibold tabular-nums tracking-wide text-zinc-900 sm:text-2xl">
                  #{displayNo}
                </p>
                <button
                  type="button"
                  onClick={() => copyOrderNumber()}
                  className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/80 hover:text-primary"
                  aria-label={t("คัดลอกเลขออเดอร์", "Copy order number")}
                >
                  {copiedOrderNo ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {t("สรุปรายการ", "Order summary")}
              </h2>
              <OrderPriceBreakdown order={order} t={t} />
              <ul className="max-h-40 space-y-2.5 overflow-y-auto py-0.5 text-sm">
                {order.items.map((line, idx) => (
                  <li
                    key={`${line.product_name}-${idx}`}
                    className="flex justify-between gap-3 border-b border-zinc-100/80 pb-2.5 last:border-0 last:pb-0 text-zinc-800"
                  >
                    <span className="min-w-0 flex-1 break-words font-sans leading-snug">
                      {orderSuccessItemSummaryLine(
                        line,
                        locale === "en" ? "en" : "th",
                        t
                      )}{" "}
                      <span className="tabular-nums text-zinc-500">×{line.quantity}</span>
                    </span>
                    <span className="shrink-0 tabular-nums font-medium text-zinc-900">
                      {formatPrice(line.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
              <ShippingRecipientBlock order={order} t={t} />
              {isReceiptEligibleStatus(order.status, order.payment_status) ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={receiptLoading}
                  onClick={() => void handleDownloadReceipt()}
                  className="h-11 w-full border-primary/25 bg-white text-zinc-800 hover:bg-emerald-50/50"
                >
                  {receiptLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4 text-primary" />
                  )}
                  {t("ดาวน์โหลดใบเสร็จ PDF / Download Receipt", "Download receipt (PDF)")}
                </Button>
              ) : null}
            </div>

            {isShipped ? (
              <>
                <Separator className="bg-zinc-100" />
                <div className="rounded-xl border border-primary/25 bg-accent/40 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                    <Truck className="h-4 w-4" />
                    {t("ข้อมูลการจัดส่ง", "Tracking")}
                  </div>
                  {order.shipping_provider ? (
                    <p className="text-sm text-zinc-700">
                      <span className="text-zinc-500">{t("ขนส่ง", "Carrier")}: </span>
                      <span className="font-medium text-zinc-900">
                        {CARRIER_LABELS[order.shipping_provider] ?? order.shipping_provider}
                      </span>
                    </p>
                  ) : null}
                  {order.tracking_number ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="break-all font-mono text-lg font-bold tabular-nums tracking-wide text-zinc-900 sm:text-xl">
                        {order.tracking_number}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-primary/30"
                        onClick={() => copyTracking()}
                      >
                        {copiedTracking ? (
                          <>
                            <Check className="mr-1.5 h-4 w-4" />
                            {t("คัดลอกแล้ว", "Copied")}
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-4 w-4" />
                            {t("คัดลอกเลขพัสดุ", "Copy tracking")}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500">
                      {t("กำลังอัปเดตเลขพัสดุ", "Tracking number will appear here when available.")}
                    </p>
                  )}
                </div>
              </>
            ) : null}

            <Separator className="bg-zinc-100" />

            {isCancelled ? (
              <div className="space-y-3">
                {lineLinked ? (
                  <p className="text-center">
                    <span className="inline-flex items-center rounded-full border border-[#06C755]/30 bg-[#06C755]/8 px-2.5 py-1 text-[11px] font-semibold text-[#047857]">
                      {t("แจ้งเตือน LINE เปิดใช้งาน", "LINE notifications active")} ✓
                    </span>
                  </p>
                ) : null}
                <LineOaResponsiveCta href={lineHrefCancelled} orderNumber={displayNo} className="gap-2.5 py-4 text-base">
                  {lineLinked
                    ? t("สอบถามสถานะผ่าน LINE", "Get updates via LINE (Active ✓)")
                    : t("ติดต่อแอดมินผ่าน LINE", "Contact us on LINE")}
                </LineOaResponsiveCta>
              </div>
            ) : isShipped ? (
              <div className="space-y-3">
                {lineLinked ? (
                  <p className="text-center">
                    <span className="inline-flex items-center rounded-full border border-[#06C755]/30 bg-[#06C755]/8 px-2.5 py-1 text-[11px] font-semibold text-[#047857]">
                      {t("แจ้งเตือน LINE เปิดใช้งาน", "LINE notifications active")} ✓
                    </span>
                  </p>
                ) : null}
                <LineOaResponsiveCta href={lineHrefParcel} orderNumber={displayNo} className="gap-2.5 py-4 text-base">
                  {lineLinked
                    ? t("สอบถามสถานะผ่าน LINE", "Get updates via LINE (Active ✓)")
                    : t("สอบถามสถานะพัสดุผ่าน LINE", "Ask about parcel status on LINE")}
                </LineOaResponsiveCta>
                <p className="text-center text-[11px] leading-relaxed text-zinc-500">
                  {t(
                    "ข้อความจะรวมเลขออเดอร์และเลขพัสดุให้อัตโนมัติ (ถ้ามี)",
                    "Your message will include the order number and tracking number when available."
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lineLinked ? (
                  <p className="text-center">
                    <span className="inline-flex items-center rounded-full border border-[#06C755]/30 bg-[#06C755]/8 px-2.5 py-1 text-[11px] font-semibold text-[#047857]">
                      {t("แจ้งเตือน LINE เปิดใช้งาน", "LINE notifications active")} ✓
                    </span>
                  </p>
                ) : null}
                <LineOaResponsiveCta
                  href={lineHrefDefault}
                  orderNumber={displayNo}
                  lineId={lineOaId}
                  desktopAddFriend
                  className="gap-2 px-3 py-3.5 text-sm leading-snug sm:gap-2.5 sm:py-4 sm:text-base"
                >
                  {lineLinked
                    ? t("สอบถามสถานะผ่าน LINE", "Get updates via LINE (Active ✓)")
                    : isGuestOrder
                      ? t(
                          "รับแจ้งเตือนสถานะผ่าน LINE (คลิกเพื่อแอดไลน์แล้วส่งเลขที่ออเดอร์มาให้เรา)",
                          "LINE updates: add us and send your order number in chat",
                        )
                      : t(
                          "รับแจ้งเลขพัสดุผ่าน LINE (อัตโนมัติ)",
                          "Track Order on LINE"
                        )}
                </LineOaResponsiveCta>
                <p className="text-center text-[11px] leading-relaxed text-zinc-500">
                  {lineLinked
                    ? t(
                        "บัญชี LINE เชื่อมแล้ว — แจ้งเตือนสถานะอัตโนมัติ",
                        "Your LINE is already linked for automated tracking."
                      )
                    : t(
                        "เพิ่ม LINE OA ของร้าน — ระบบใส่เลขออเดอร์ในข้อความให้อัตโนมัติ",
                        "Add our LINE — your order number is prefilled when you open the chat."
                      )}
                </p>
                {showSlipLineHelp ? (
                  <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-zinc-600 marker:text-primary">
                    <li>
                      {t(
                        "แจ้งเตือนสถานะการจัดส่งและเลขพัสดุแบบเรียลไทม์เมื่อพัสดุออกจากร้าน",
                        "Real-time shipping status and tracking alerts when your parcel ships."
                      )}
                    </li>
                    <li>
                      {t(
                        `เชื่อมต่อกับออเดอร์ #${displayNo} อัตโนมัติ — ไม่ต้องพิมพ์เลขซ้ำ`,
                        `Tied to order #${displayNo} automatically — no need to retype your order ID.`
                      )}
                    </li>
                    <li>
                      {t(
                        "สอบถามหรือแก้ไขออเดอร์กับแอดมินได้โดยตรงในแชท",
                        "Message our team anytime for order questions or changes."
                      )}
                    </li>
                  </ul>
                ) : (
                  <p className="text-center text-xs leading-relaxed text-zinc-600">
                    {t(
                      "เพิ่ม LINE เพื่อรับอัปเดตการจัดส่งและเลขพัสดุทันทีที่มีการอัปเดต",
                      "Use LINE to get shipping updates and tracking as soon as they are available."
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button asChild variant="outline" className="h-10">
                <Link href="/">
                  <Home className="mr-1.5 h-4 w-4" />
                  {t("หน้าแรก", "Home")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10">
                <Link href="/shop">
                  <ShoppingBag className="mr-1.5 h-4 w-4" />
                  {t("ช้อปต่อ", "Shop")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-[11px] tabular-nums text-zinc-400">
          {locale === "en"
            ? "Keep your order number for your records."
            : "เก็บเลขออเดอร์ไว้เพื่ออ้างอิง"}
        </p>
      </div>
    </div>
  );
}
