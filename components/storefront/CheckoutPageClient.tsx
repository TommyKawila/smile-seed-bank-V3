"use client";

import { useState, useEffect } from "react";
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
import {
  readSavedPromotionsFromLocal,
  type SavedPromotionPayload,
} from "@/lib/saved-promotion-local";

type ApiSavedCoupon = {
  campaign_id: string;
  name: string;
  promo_code: string;
  discount_type: string;
  discount_value: string;
};

function mergeSavedCoupons(
  server: ApiSavedCoupon[],
  local: SavedPromotionPayload[]
): ApiSavedCoupon[] {
  const seen = new Set<string>();
  const out: ApiSavedCoupon[] = [];
  for (const s of server) {
    const k = s.promo_code.trim().toUpperCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  for (const l of local) {
    const k = l.promo_code.trim().toUpperCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      campaign_id: l.campaignId,
      name: l.name,
      promo_code: l.promo_code,
      discount_type: l.discount_type,
      discount_value: l.discount_value,
    });
  }
  return out;
}

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
};

export function CheckoutPageClient({
  paymentSettings,
  paymentSettingsError,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { items, summary, promo, tieredDiscountRules, applyPromoCode, clearPromoCode, isValidatingPromo, clearCart, itemCount } = useCartContext();
  const { user, customer } = useAuth();
  const { locale, t } = useLanguage();

  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const showWelcomeCoupon = user && ordersCount === 0;

  const [form, setForm] = useState<CheckoutForm>({
    full_name: "",
    phone: "",
    address: "",
    order_note: "",
  });
  const [promptPayQrDataUrl, setPromptPayQrDataUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginPromoOpen, setLoginPromoOpen] = useState(false);
  const [loginPromoMessage, setLoginPromoMessage] = useState("");
  const [loginPromoCode, setLoginPromoCode] = useState("");
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);
  const [savedCoupons, setSavedCoupons] = useState<ApiSavedCoupon[]>([]);

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
    const pp = paymentSettings.find((p) => p.source === "promptpay");
    const id = pp?.account_number?.trim();
    if (!id || paymentSettingsError) {
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
  }, [paymentSettings, paymentSettingsError, summary.total]);

  useEffect(() => {
    let cancelled = false;
    const local = readSavedPromotionsFromLocal();
    if (!user) {
      setSavedCoupons(mergeSavedCoupons([], local));
      return () => {
        cancelled = true;
      };
    }
    void fetch("/api/storefront/saved-promotions")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: ApiSavedCoupon[] }) => {
        if (cancelled) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setSavedCoupons(mergeSavedCoupons(items, local));
      })
      .catch(() => {
        if (!cancelled) setSavedCoupons(mergeSavedCoupons([], local));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
          payment_method: "TRANSFER" as const,
          customer_id: user?.id ?? null,
          promo_code_id: summary.usePromoForOrder ? promo.code?.id ?? null : null,
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
      router.push(`/payment/${orderNumber}`);
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
          <div className="mx-auto max-w-3xl space-y-4">
              {user && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {t("Auto-fill จากบัญชีของคุณ", "Auto-filled from your account")}
                </div>
              )}

              <Card className="border-zinc-200/80 shadow-sm">
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

              <Card className="border-zinc-200/80 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {t("สรุปรายการ", "Order summary")}
                    </h2>
                    <span className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                      {t("รอชำระเงิน", "Pending")}
                    </span>
                  </div>

                  <div className="max-h-52 space-y-3 overflow-y-auto sm:max-h-60">
                    {items.map((item) => (
                      <OrderItemRow key={item.variantId} item={item} locale={locale} />
                    ))}
                  </div>

                  <Separator />

                  <DiscountProgressBar subtotal={summary.subtotal} rules={tieredDiscountRules} />

                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    {t(
                      "ส่วนลดขั้นบันไดกับโค้ดใช้ทีละอย่าง — ระบบเลือกข้อเสนอที่ยอดสุทธิต่ำสุดให้อัตโนมัติ",
                      "Tier and promo discounts are exclusive — we apply whichever gives you the lower total."
                    )}
                  </p>

                  {savedCoupons.length > 0 && (
                    <div className="space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/80">
                        {t("คูปองที่เก็บไว้", "Available coupons")}
                      </p>
                      <div className="flex flex-col gap-2">
                        {savedCoupons.map((c) => {
                          const applied =
                            promo.code?.code?.toUpperCase() === c.promo_code.toUpperCase();
                          return (
                            <button
                              key={`${c.campaign_id}-${c.promo_code}`}
                              type="button"
                              disabled={applied || isValidatingPromo}
                              onClick={() =>
                                void applyPromoCode(
                                  c.promo_code,
                                  user?.email ?? null,
                                  customer?.phone ?? null,
                                  user?.id ?? null
                                )
                              }
                              className={cn(
                                "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                                applied
                                  ? "border-zinc-200 bg-zinc-100 text-zinc-500"
                                  : "border-emerald-300/60 bg-white hover:border-emerald-400"
                              )}
                            >
                              <span className="min-w-0 font-mono font-semibold text-emerald-900">
                                {c.promo_code}
                              </span>
                              <span className="shrink-0 text-xs text-zinc-600">
                                {applied
                                  ? t("ใช้แล้ว", "Applied")
                                  : t("แตะเพื่อใช้", "Tap to apply")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm text-primary">
                        <span>
                          โค้ด: {promo.code.code} —{" "}
                          {String(promo.code.discount_type || "").toUpperCase() === "PERCENTAGE"
                            ? `ลด ${promo.code.discount_value}%`
                            : `ลด ${formatPrice(promo.code.discount_value)}`}
                        </span>
                        <span className="flex items-center gap-2">
                          {summary.promoDiscount > 0 ? (
                            <>-{formatPrice(summary.promoDiscount)}</>
                          ) : summary.promoSupersededByTier ? (
                            <span className="text-xs font-normal text-zinc-500">
                              {t("ไม่ใช้กับยอดนี้", "Not applied")}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => clearPromoCode()}
                            className="text-xs text-zinc-400 hover:text-red-500"
                          >
                            {t("ลบ", "Remove")}
                          </button>
                        </span>
                      </div>
                      {summary.promoSupersededByTier ? (
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                          {t(
                            "ส่วนลดอัตโนมัติจากยอดซื้อดีกว่าโค้ดนี้ — ใช้ส่วนลดขั้นบันไดแทน",
                            "Your spend-based discount beats this code — the tier discount is used instead."
                          )}
                        </p>
                      ) : null}
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
                          {t(
                            `ส่วนลดอัตโนมัติ (${summary.discountPercent}%)`,
                            `Auto discount (${summary.discountPercent}%)`
                          )}
                        </span>
                        <span className="tabular-nums">-{formatPrice(summary.tierDiscount)}</span>
                      </div>
                    )}
                    {summary.promoDiscount > 0 && (
                      <div className="flex justify-between gap-3 text-primary">
                        <span className="text-xs">
                          {t(`ส่วนลดโค้ด (${promo.code?.code ?? ""})`, `Coupon (${promo.code?.code ?? ""})`)}
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
                    {summary.tierDiscount + summary.promoDiscount > 0 && (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                        <Sparkles className="h-4 w-4 shrink-0" />
                        <span>
                          {t("คุณประหยัดเงินไปได้ทั้งหมด", "You've saved a total of")}{" "}
                          <strong>{formatPrice(summary.tierDiscount + summary.promoDiscount)}</strong>
                        </span>
                      </div>
                    )}
                    <Separator className="my-1 bg-zinc-100" />
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <div className="flex items-center justify-between gap-3 text-zinc-900">
                        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          {t("ยอดสุทธิ", "Net total")}
                        </span>
                        <span className="text-xl font-bold tabular-nums text-primary">{formatPrice(summary.total)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {t("ยอดที่ต้องชำระ (โอน / พร้อมเพย์)", "Amount to pay (transfer / PromptPay)")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-200/80 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-sm font-bold text-zinc-700">
                    {t("ชำระเงินด้วยการโอนเงิน", "Bank transfer")}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {t("ธนาคาร / PromptPay — ใช้ยอดสุทธิด้านบนเมื่อโอน", "Bank / PromptPay — use the net total above when transferring.")}
                  </p>

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
                </CardContent>
              </Card>

              {submitError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitError}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full bg-primary text-base font-bold text-white hover:bg-primary/90 active:scale-[0.98] transition-transform"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("กำลังสร้างออเดอร์...", "Placing order...")}</>
                ) : (
                  `${t("ยืนยันการโอนเงิน", "Confirm transfer")} · ${formatPrice(summary.total)}`
                )}
              </Button>

              <p className="text-center text-xs text-zinc-400">
                {t("🔒 ข้อมูลของคุณปลอดภัยและถูกเข้ารหัส", "🔒 Your data is encrypted")}
              </p>
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
