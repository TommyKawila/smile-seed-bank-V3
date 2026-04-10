"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Upload,
  Home,
  ShoppingBag,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { lineOaUrlWithOrderHint } from "@/lib/line-oa-url";
import type { OrderSuccessView } from "@/lib/services/order-service";

type PaySettings = {
  bank: { name: string; accountNo: string; accountName: string } | null;
  promptPay: { identifier: string; qrUrl: string } | null;
};

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
  const [paySettings, setPaySettings] = useState<PaySettings>({ bank: null, promptPay: null });
  const [paySettingsReady, setPaySettingsReady] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadOrder = useCallback(async () => {
    if (!orderNumber) {
      setLoadError("not_found");
      setLoading(false);
      return;
    }
    setLoading(true);
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
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!orderNumber) return;
    setPaySettingsReady(false);
    void fetch("/api/storefront/payment-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { bank: null, promptPay: null }))
      .then((ps) => setPaySettings(ps as PaySettings))
      .catch(() => setPaySettings({ bank: null, promptPay: null }))
      .finally(() => setPaySettingsReady(true));
  }, [orderNumber]);

  useEffect(() => {
    const promptId = paySettings.promptPay?.identifier;
    if (
      !order?.total_amount ||
      order.payment_method !== "TRANSFER" ||
      !promptId
    ) {
      setQrDataUrl(null);
      return;
    }
    const amount = Number(order.total_amount);
    const payload = generatePayload(promptId, { amount });
    let cancelled = false;
    void QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [order?.total_amount, order?.payment_method, paySettings.promptPay?.identifier]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
  };

  const handleSubmitSlip = async () => {
    if (!selectedFile || !orderNumber) {
      toast.error(
        t("กรุณาเลือกไฟล์หลักฐานการโอนเงิน", "Please select a payment slip file.")
      );
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("order_number", orderNumber);
      form.append("file", selectedFile);
      const res = await fetch("/api/storefront/orders/upload-slip", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { error?: string; slip_url?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast.success(
        t("ส่งหลักฐานการชำระเงินแล้ว", "Payment slip submitted successfully.")
      );
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              slip_url: data.slip_url ?? prev.slip_url,
              status: "AWAITING_VERIFICATION",
            }
          : prev
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      toast.error(String(e).replace("Error: ", ""));
    } finally {
      setUploading(false);
    }
  };

  const lineHref = orderNumber ? lineOaUrlWithOrderHint(orderNumber) : "#";
  const showTransferBlock = order?.payment_method === "TRANSFER";
  const slipDone =
    Boolean(order?.slip_url) || order?.status === "AWAITING_VERIFICATION";
  const needsSlip = showTransferBlock && order && !slipDone;

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

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-14">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <Card className="overflow-hidden border-zinc-200/80 shadow-sm">
          <div className="bg-primary px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {t("สั่งซื้อสำเร็จ!", "Order placed successfully!")}
            </h1>
            <p className="mt-1 text-sm text-white/85">
              {t("ขอบคุณที่ไว้วางใจ Smile Seed Bank", "Thank you for shopping with Smile Seed Bank.")}
            </p>
          </div>
          <CardContent className="space-y-6 p-6">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                {t("เลขออเดอร์", "Order ID")}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums tracking-wide text-zinc-900">
                #{order.order_number}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("สรุปรายการ", "Order summary")}
              </h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3 text-zinc-600">
                  <span>{t("ยอดสุทธิ", "Total")}</span>
                  <span className="font-semibold tabular-nums text-zinc-900">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
                <Separator className="bg-zinc-100" />
                <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
                  {order.items.map((line, idx) => (
                    <li
                      key={`${line.product_name}-${idx}`}
                      className="flex justify-between gap-2 text-zinc-700"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {line.product_name}{" "}
                        <span className="tabular-nums text-zinc-500">×{line.quantity}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-zinc-800">
                        {formatPrice(line.line_total)}
                      </span>
                    </li>
                  ))}
                </ul>
                {order.shipping_address ? (
                  <>
                    <Separator className="bg-zinc-100" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {t("ที่อยู่จัดส่ง", "Shipping address")}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-zinc-700 leading-relaxed">
                        {order.shipping_address}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {showTransferBlock ? (
              <div className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("ชำระเงิน", "Payment")}
                </h2>

                {!paySettingsReady ? (
                  <p className="text-sm text-zinc-500">
                    {t("กำลังโหลดข้อมูลการชำระเงิน…", "Loading payment details…")}
                  </p>
                ) : paySettings.bank || paySettings.promptPay ? (
                  <Card className="border-primary/20 bg-white">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <CreditCard className="h-4 w-4" />
                        {t("โอนเงิน", "Bank transfer")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      {paySettings.bank ? (
                        <div className="grid gap-1.5 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-zinc-500">{t("ธนาคาร", "Bank")}</span>
                            <span className="font-medium text-zinc-900">{paySettings.bank.name}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-zinc-500">{t("เลขบัญชี", "Account no.")}</span>
                            <span className="font-mono font-semibold tabular-nums text-zinc-900">
                              {paySettings.bank.accountNo}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-zinc-500">{t("ชื่อบัญชี", "Account name")}</span>
                            <span className="text-right font-medium text-zinc-900">
                              {paySettings.bank.accountName}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {paySettings.promptPay ? (
                        <div className="border-t border-zinc-100 pt-4">
                          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                            {t("สแกน PromptPay", "Scan PromptPay")}
                            {paySettings.promptPay.identifier
                              ? ` · ${paySettings.promptPay.identifier}`
                              : ""}
                          </p>
                          <div className="flex justify-center">
                            <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                              {qrDataUrl ? (
                                <Image
                                  src={qrDataUrl}
                                  alt="PromptPay QR"
                                  width={220}
                                  height={220}
                                  className="size-[220px] rounded-lg"
                                  unoptimized
                                />
                              ) : paySettings.promptPay.qrUrl ? (
                                <Image
                                  src={paySettings.promptPay.qrUrl}
                                  alt="PromptPay QR"
                                  width={220}
                                  height={220}
                                  className="size-[220px] rounded-lg object-contain"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex size-[220px] items-center justify-center text-xs text-zinc-400">
                                  QR
                                </div>
                              )}
                              <p className="mt-2 text-center text-sm font-semibold tabular-nums text-primary">
                                {formatPrice(order.total_amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {t(
                      "ยังไม่มีข้อมูลบัญชีในระบบ — โปรดติดต่อร้าน",
                      "No bank details on file — please contact the store."
                    )}
                  </div>
                )}

                {slipDone ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold">
                        {t("ส่งหลักฐานแล้ว", "Payment submitted")}
                      </p>
                      <p className="mt-0.5 text-xs text-emerald-800/90">
                        {t(
                          "ทีมงานจะตรวจสอบและยืนยันโดยเร็ว",
                          "Our team will verify your payment shortly."
                        )}
                      </p>
                    </div>
                  </div>
                ) : needsSlip ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <p className="mb-3 text-sm font-medium text-zinc-800">
                      {t("อัปโหลดสลิปโอนเงิน", "Upload payment slip")}
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/25 py-4 text-sm font-medium text-primary transition-colors hover:bg-zinc-50"
                    >
                      <Upload className="h-4 w-4" />
                      {selectedFile
                        ? selectedFile.name
                        : t("เลือกไฟล์ (JPG, PNG, PDF)", "Choose file (JPG, PNG, PDF)")}
                    </button>
                    <Button
                      type="button"
                      className="mt-4 w-full h-11 bg-primary font-semibold text-white hover:bg-primary/90"
                      disabled={!selectedFile || uploading}
                      onClick={() => void handleSubmitSlip()}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("กำลังส่ง…", "Submitting…")}
                        </>
                      ) : (
                        t("ส่งหลักฐานการโอนเงิน", "Submit payment slip")
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Separator className="bg-zinc-100" />

            <div className="space-y-3">
              <a
                href={lineHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95"
              >
                {t("ติดตามออเดอร์ผ่าน LINE", "Track your order via LINE")}
              </a>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="h-10">
                  <Link href="/">
                    <Home className="mr-1.5 h-4 w-4" />
                    {t("หน้าแรก", "Home")}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-10">
                  <Link href="/shop">
                    <ShoppingBag className="mr-1.5 h-4 w-4" />
                    {t("ช้อปต่อ", "Continue shopping")}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-[11px] text-zinc-400">
          {locale === "en"
            ? "Save your order number for your records."
            : "เก็บเลขออเดอร์ไว้เพื่ออ้างอิง"}
        </p>
      </div>
    </div>
  );
}
