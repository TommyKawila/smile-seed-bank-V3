"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Loader2, ShoppingBag, ChevronLeft, ShieldCheck, Tag, Sparkles } from "lucide-react";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartContext } from "@/context/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { DiscountProgressBar } from "@/components/storefront/DiscountProgressBar";
import { LoginForPromoDialog } from "@/components/storefront/LoginForPromoDialog";
import { useLanguage, type Locale } from "@/context/LanguageContext";
import { cartItemPackDescription } from "@/lib/cart-pack-display";
import { createClient } from "@/lib/supabase/client";
import { getURL } from "@/lib/get-url";
import { cn, formatPrice } from "@/lib/utils";
import type { PaymentSetting } from "@/lib/payment-settings-public";
import { toast } from "sonner";

const QR_IMAGE_SIZE = 220;

/** Use Next.js optimization for Supabase Storage; unoptimize unknown hosts / data URLs. */
function qrSrcNeedsUnoptimized(src: string): boolean {
  try {
    const u = new URL(src);
    if (u.protocol === "data:") return true;
    return !u.hostname.endsWith("supabase.co");
  } catch {
    return true;
  }
}

const CheckoutFormSchema = z.object({
  full_name: z.string().min(2, "กรุณาระบุชื่อ-นามสกุล"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(15),
  address: z.string().min(10, "กรุณาระบุที่อยู่จัดส่ง (อย่างน้อย 10 ตัวอักษร)"),
  order_note: z.string().max(2000).optional().default(""),
  payment_method: z.enum(["TRANSFER", "CRYPTO", "COD", "CASH"]),
});

type CheckoutForm = z.infer<typeof CheckoutFormSchema>;

function OrderItemRow({
  item,
  locale,
}: {
  item: ReturnType<typeof useCartContext>["items"][number];
  locale: Locale;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
        {item.productImage ? (
          <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-zinc-300" />
          </div>
        )}
        {item.isFreeGift && (
          <span className="absolute -right-1 -top-1 text-[10px]">🎁</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="min-w-0 break-words text-sm font-medium text-zinc-800">{item.productName}</p>
          {item.breederLogoUrl ? (
            <span className="inline-flex h-5 shrink-0 items-center self-center">
              <Image
                src={item.breederLogoUrl}
                alt=""
                width={96}
                height={20}
                className="h-5 w-auto max-w-[7rem] object-contain object-left"
              />
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {cartItemPackDescription(item, locale, { includeLineQuantity: true })}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">
        {item.isFreeGift ? "ฟรี" : formatPrice(item.price * item.quantity)}
      </span>
    </div>
  );
}

export type CheckoutPageClientProps = {
  paymentSettings: PaymentSetting[];
  paymentSettingsError: boolean;
  storefrontCryptoEnabled: boolean;
  storefrontCodEnabled: boolean;
};

export function CheckoutPageClient({
  paymentSettings,
  paymentSettingsError,
  storefrontCryptoEnabled,
  storefrontCodEnabled,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { items, summary, promo, tieredDiscountRules, applyPromoCode, clearPromoCode, isValidatingPromo, clearCart, itemCount } = useCartContext();
  const { user, customer } = useAuth();
  const { locale, t } = useLanguage();

  const allowedPaymentOptions = useMemo(
    () =>
      [
        {
          value: "TRANSFER" as const,
          label: t("โอนเงิน", "Bank Transfer"),
          desc: t("ธนาคาร / PromptPay", "Bank / PromptPay"),
        },
        ...(storefrontCryptoEnabled
          ? [
              {
                value: "CRYPTO" as const,
                label: t("คริปโต", "Crypto"),
                desc: t("USDT / BTC", "USDT / BTC"),
              },
            ]
          : []),
        ...(storefrontCodEnabled
          ? [
              {
                value: "COD" as const,
                label: "COD",
                desc: t("เก็บเงินปลายทาง", "Cash on delivery"),
              },
            ]
          : []),
      ],
    [storefrontCryptoEnabled, storefrontCodEnabled, t]
  );

  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const showWelcomeCoupon = user && ordersCount === 0;

  const [form, setForm] = useState<CheckoutForm>({
    full_name: "",
    phone: "",
    address: "",
    order_note: "",
    payment_method: "TRANSFER",
  });
  const [promptPayQrDataUrl, setPromptPayQrDataUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginPromoOpen, setLoginPromoOpen] = useState(false);
  const [loginPromoMessage, setLoginPromoMessage] = useState("");
  const [loginPromoCode, setLoginPromoCode] = useState("");
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        full_name: customer.full_name ?? prev.full_name,
        phone: customer.phone ?? prev.phone,
        address: customer.address ?? prev.address,
      }));
    }
  }, [customer]);

  useEffect(() => {
    setForm((prev) => {
      const allowed = new Set<CheckoutForm["payment_method"]>(["TRANSFER"]);
      if (storefrontCryptoEnabled) allowed.add("CRYPTO");
      if (storefrontCodEnabled) allowed.add("COD");
      if (allowed.has(prev.payment_method)) return prev;
      return { ...prev, payment_method: "TRANSFER" };
    });
  }, [storefrontCryptoEnabled, storefrontCodEnabled]);

  useEffect(() => {
    const pp = paymentSettings.find((p) => p.source === "promptpay");
    const id = pp?.account_number?.trim();
    if (form.payment_method !== "TRANSFER" || !id || paymentSettingsError) {
      setPromptPayQrDataUrl(null);
      return;
    }
    const amount = summary.total;
    if (!Number.isFinite(amount) || amount <= 0) {
      setPromptPayQrDataUrl(null);
      return;
    }
    let cancelled = false;
    try {
      const payload = generatePayload(id, { amount });
      void QRCode.toDataURL(payload, {
        width: 280,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then((url) => {
          if (!cancelled) setPromptPayQrDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setPromptPayQrDataUrl(null);
        });
    } catch {
      setPromptPayQrDataUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [form.payment_method, paymentSettings, paymentSettingsError, summary.total]);

  useEffect(() => {
    if (!user) {
      setOrdersCount(null);
      return;
    }
    let cancelled = false;
    fetch("/api/storefront/profile/orders")
      .then((r) => r.ok ? r.json() : { orders: [] })
      .then((data: { orders?: unknown[] }) => {
        if (!cancelled) setOrdersCount(data.orders?.length ?? 0);
      })
      .catch(() => { if (!cancelled) setOrdersCount(0); });
    return () => { cancelled = true; };
  }, [user]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    const result = await applyPromoCode(promoInput.trim(), user?.email ?? null, customer?.phone ?? null, user?.id ?? null);
    if (result.success) setPromoInput("");
    else if (result.requireLogin && result.attemptedCode) {
      setLoginPromoMessage(result.message ?? "กรุณาเข้าสู่ระบบเพื่อใช้โค้ด WELCOME10 และรับส่วนลดสมาชิกใหม่ 10%");
      setLoginPromoCode(result.attemptedCode);
      setLoginPromoOpen(true);
    }
  };

  const handleApplyWelcome10 = async () => {
    setPromoInput("WELCOME10");
    const result = await applyPromoCode("WELCOME10", user?.email ?? null, customer?.phone ?? null, user?.id ?? null);
    if (result.requireLogin && result.attemptedCode) {
      setLoginPromoMessage(result.message ?? "กรุณาเข้าสู่ระบบเพื่อใช้โค้ด WELCOME10 และรับส่วนลดสมาชิกใหม่ 10%");
      setLoginPromoCode(result.attemptedCode);
      setLoginPromoOpen(true);
    }
  };

  const handleLoginForPromo = async () => {
    setGoogleLoginLoading(true);
    const supabase = createClient();
    const redirectTo = `${getURL()}checkout?promo=${encodeURIComponent(loginPromoCode)}`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    setGoogleLoginLoading(false);
  };

  const setField = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const parsed = CheckoutFormSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<keyof CheckoutForm, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof CheckoutForm;
        if (key) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    if (items.length === 0) {
      setSubmitError(locale === "en" ? "Your cart is empty" : "ตะกร้าสินค้าว่างเปล่า");
      return;
    }

    const allowedIds = new Set(allowedPaymentOptions.map((p) => p.value));
    if (!allowedIds.has(parsed.data.payment_method)) {
      setSubmitError(
        t("ช่องทางชำระเงินนี้ไม่เปิดใช้งาน", "This payment method is not available.")
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/storefront/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            full_name: parsed.data.full_name,
            phone: parsed.data.phone,
            address: parsed.data.address,
            email: user?.email ?? null,
          },
          order_note: parsed.data.order_note?.trim() || null,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.price,
            isFreeGift: i.isFreeGift ?? false,
            productName: i.productName,
          })),
          summary: {
            subtotal: summary.subtotal,
            discount: summary.discount,
            shipping: summary.shipping,
            total: summary.total,
          },
          payment_method: parsed.data.payment_method,
          customer_id: user?.id ?? null,
          promo_code_id: promo.code?.id ?? null,
          locale,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409 && body.code === "INSUFFICIENT_STOCK") {
          const msg = t(
            "ขออภัย สินค้าบางรายการในตะกร้าหมดสต็อกแล้ว",
            "Sorry, some items in your cart are out of stock."
          );
          toast.error(msg);
          setSubmitError(msg);
          return;
        }
        throw new Error(body.error ?? (locale === "en" ? "Could not create order" : "สร้างออเดอร์ไม่สำเร็จ กรุณาลองใหม่"));
      }

      const { orderNumber } = await res.json();
      clearCart();
      if (parsed.data.payment_method === "TRANSFER") {
        router.push(`/payment/${orderNumber}`);
      } else {
        router.push(`/order-success/${encodeURIComponent(orderNumber)}`);
      }
    } catch (err) {
      setSubmitError(String(err).replace("Error: ", ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (itemCount === 0 && !isSubmitting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-16 text-center px-4">
        <ShoppingBag className="h-12 w-12 text-zinc-200" />
        <p className="text-base font-semibold text-zinc-600">{t("ตะกร้าสินค้าว่างเปล่า", "Your cart is empty")}</p>
        <Button asChild className="bg-primary text-white hover:bg-primary/90">
          <Link href="/shop">{t("เลือกซื้อสินค้า", "Continue shopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-20">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/shop" className="text-zinc-500 hover:text-primary">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-zinc-900">{t("ดำเนินการชำระเงิน", "Checkout")}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              {user && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {t("Auto-fill จากบัญชีของคุณ", "Auto-filled from your account")}
                </div>
              )}

              <Card>
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-sm font-bold text-zinc-700">{t("ข้อมูลจัดส่ง", "Shipping details")}</h2>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="full_name">{t("ชื่อ-นามสกุล *", "Full name *")}</Label>
                      <Input
                        id="full_name"
                        value={form.full_name}
                        onChange={(e) => setField("full_name", e.target.value)}
                        placeholder={t("ชื่อผู้รับ", "Recipient name")}
                      />
                      {fieldErrors.full_name && (
                        <p className="text-xs text-red-500">{fieldErrors.full_name}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">{t("เบอร์โทร *", "Phone *")}</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        placeholder="08x-xxx-xxxx"
                        type="tel"
                      />
                      {fieldErrors.phone && (
                        <p className="text-xs text-red-500">{fieldErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="address">{t("ที่อยู่จัดส่ง *", "Shipping address *")}</Label>
                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      placeholder={t("บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์", "Street, district, province, postal code")}
                      rows={3}
                    />
                    {fieldErrors.address && (
                      <p className="text-xs text-red-500">{fieldErrors.address}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="order_note">
                      {t("หมายเหตุถึงผู้ขาย (ไม่บังคับ)", "Order note (optional)")}
                    </Label>
                    <Textarea
                      id="order_note"
                      value={form.order_note}
                      onChange={(e) => setField("order_note", e.target.value)}
                      placeholder={t("เช่น วันเวลาที่สะดวกรับ", "e.g. preferred delivery time")}
                      rows={3}
                      className="resize-none"
                    />
                    {fieldErrors.order_note && (
                      <p className="text-xs text-red-500">{fieldErrors.order_note}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-sm font-bold text-zinc-700">{t("ช่องทางชำระเงิน", "Payment method")}</h2>
                  {fieldErrors.payment_method && (
                    <p className="text-xs text-red-500">{fieldErrors.payment_method}</p>
                  )}
                  <div
                    className={cn(
                      "grid gap-2",
                      allowedPaymentOptions.length === 1 && "grid-cols-1",
                      allowedPaymentOptions.length === 2 && "grid-cols-2",
                      allowedPaymentOptions.length >= 3 && "grid-cols-3"
                    )}
                  >
                    {allowedPaymentOptions.map((pm) => (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => setField("payment_method", pm.value)}
                        className={`rounded-xl border-2 p-3 text-center transition-all ${
                          form.payment_method === pm.value
                            ? "border-primary bg-primary/5"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${form.payment_method === pm.value ? "text-primary" : "text-zinc-700"}`}>
                          {pm.label}
                        </p>
                        <p className="text-xs text-zinc-400">{pm.desc}</p>
                      </button>
                    ))}
                  </div>

                  {form.payment_method === "TRANSFER" && (
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
                        <Card key={`${pm.source}-${pm.id}`} className="border-primary/15 bg-white shadow-sm">
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
                                  {pm.source === "promptpay"
                                    ? t("หมายเลขพร้อมเพย์", "PromptPay ID")
                                    : t("เลขบัญชี", "Account number")}
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
                                  alt={t(
                                    "QR พร้อมเพย์ตามยอดออเดอร์",
                                    "PromptPay QR with order amount"
                                  )}
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
                                      ? t(
                                          "QR Code พร้อมเพย์สำหรับชำระเงิน",
                                          "PromptPay QR code for payment"
                                        )
                                      : t(
                                          "QR Code โอนเงินผ่านธนาคารสำหรับชำระเงิน",
                                          "Bank transfer QR code for payment"
                                        )
                                  }
                                  width={QR_IMAGE_SIZE}
                                  height={QR_IMAGE_SIZE}
                                  className="h-[220px] w-[220px] max-w-full object-contain"
                                  sizes="220px"
                                  unoptimized={qrSrcNeedsUnoptimized(pm.qr_code_url)}
                                />
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <Card className="sticky top-24 border-zinc-200/80 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {t("สรุปรายการ", "Order summary")}
                    </h2>
                    <span className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                      {t("รอชำระเงิน", "Pending")}
                    </span>
                  </div>

                  <div className="max-h-52 space-y-3 overflow-y-auto">
                    {items.map((item) => (
                      <OrderItemRow key={item.variantId} item={item} locale={locale} />
                    ))}
                  </div>

                  <Separator />

                  <DiscountProgressBar
                    subtotal={summary.subtotal}
                    rules={tieredDiscountRules}
                    upsellMessage={summary.upsellMessage}
                  />

                  {showWelcomeCoupon && !promo.code && (
                    <button
                      type="button"
                      onClick={handleApplyWelcome10}
                      disabled={isValidatingPromo}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/10"
                    >
                      <span className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm font-bold text-primary">WELCOME10</span>
                      </span>
                      <span className="text-xs font-medium text-zinc-600">
                        {t("ส่วนลด 10% ลูกค้าใหม่", "Apply 10% New Customer Discount")}
                      </span>
                    </button>
                  )}

                  {!promo.code ? (
                    <div className="flex gap-2">
                      <Input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder={t("รหัสส่วนลด", "Promo code")}
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleApplyPromo()}
                        disabled={isValidatingPromo || !promoInput.trim()}
                      >
                        {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ใช้", "Apply")}
                      </Button>
                    </div>
                  ) : null}
                  {promo.error && (
                    <p className="text-xs text-red-500">{promo.error}</p>
                  )}

                  {promo.code && (
                    <div className="flex items-center justify-between gap-2 text-sm text-primary">
                      <span>โค้ด: {promo.code.code} — {String(promo.code.discount_type || "").toUpperCase() === "PERCENTAGE" ? `ลด ${promo.code.discount_value}%` : `ลด ${formatPrice(promo.code.discount_value)}`}</span>
                      <span className="flex items-center gap-2">
                        -{formatPrice(summary.promoDiscount)}
                        <button type="button" onClick={() => clearPromoCode()} className="text-xs text-zinc-400 hover:text-red-500">
                          {t("ลบ", "Remove")}
                        </button>
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3 text-zinc-600">
                      <span className="text-xs text-zinc-500">{t("ยอดสินค้า", "Subtotal")}</span>
                      <span className="tabular-nums text-zinc-800">{formatPrice(summary.subtotal)}</span>
                    </div>
                    {summary.tierDiscount > 0 && (
                      <div className="flex justify-between gap-3 text-primary">
                        <span className="text-xs">
                          {t(`ส่วนลดขั้นบันได (${summary.discountPercent}%)`, `Tier (${summary.discountPercent}%)`)}
                        </span>
                        <span className="tabular-nums">-{formatPrice(summary.tierDiscount)}</span>
                      </div>
                    )}
                    {summary.promoDiscount > 0 && (
                      <div className="flex justify-between gap-3 text-primary">
                        <span className="text-xs">
                          {t(`ส่วนลดโค้ด (${promo.code?.code ?? ""})`, `Promo (${promo.code?.code ?? ""})`)}
                        </span>
                        <span className="tabular-nums">-{formatPrice(summary.promoDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-3 text-zinc-600">
                      <span className="text-xs text-zinc-500">{t("ค่าจัดส่ง", "Shipping")}</span>
                      <span className="tabular-nums text-zinc-800">
                        {summary.shipping === 0 ? t("ฟรี", "Free") : formatPrice(summary.shipping)}
                      </span>
                    </div>
                    <Separator className="my-1 bg-zinc-100" />
                    <div className="flex justify-between gap-3 pt-0.5 text-zinc-900">
                      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {t("ยอดสุทธิ", "Total")}
                      </span>
                      <span className="text-lg font-semibold tabular-nums text-primary">{formatPrice(summary.total)}</span>
                    </div>
                  </div>

                  {summary.tierDiscount + summary.promoDiscount > 0 && (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <span>
                        {t("คุณประหยัดเงินไปได้ทั้งหมด", "You've saved a total of")}{" "}
                        <strong>{formatPrice(summary.tierDiscount + summary.promoDiscount)}</strong>
                      </span>
                    </div>
                  )}

                  {submitError && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitError}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-primary text-base font-semibold text-white hover:bg-primary/90 active:scale-[0.98] transition-transform"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("กำลังสร้างออเดอร์...", "Placing order...")}</>
                    ) : form.payment_method === "TRANSFER" ? (
                      `${t("ดำเนินการชำระเงิน", "Continue")} · ${formatPrice(summary.total)}`
                    ) : (
                      `${t("ยืนยันชำระเงิน", "Confirm")} · ${formatPrice(summary.total)}`
                    )}
                  </Button>

                  <p className="text-center text-xs text-zinc-400">
                    {t("🔒 ข้อมูลของคุณปลอดภัยและถูกเข้ารหัส", "🔒 Your data is encrypted")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      <LoginForPromoDialog
        open={loginPromoOpen}
        onOpenChange={setLoginPromoOpen}
        message={loginPromoMessage}
        promoCode={loginPromoCode}
        onLogin={handleLoginForPromo}
        isLoading={googleLoginLoading}
        t={t}
      />
    </div>
  );
}
