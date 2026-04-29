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
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
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
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { CouponSection } from "@/components/storefront/checkout/CouponSection";
import { OrderSummary } from "@/components/storefront/checkout/OrderSummary";
import { PaymentSection } from "@/components/storefront/checkout/PaymentSection";
import { ShippingSection } from "@/components/storefront/checkout/ShippingSection";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

const serif = "font-sans";
const mono = "font-[family-name:var(--font-journal-product-mono)] tabular-nums";

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

const CheckoutFormSchema = z.object({
  full_name: z.string().min(2, "กรุณาระบุชื่อ-นามสกุล"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(15),
  address: z.string().min(10, "กรุณาระบุที่อยู่จัดส่ง (อย่างน้อย 10 ตัวอักษร)"),
  guest_email: z.string().optional().default(""),
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
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
        {item.productImage ? (
          <Image
            src={item.productImage}
            alt={item.productName}
            fill
            className="object-cover"
            unoptimized={shouldOffloadImageOptimization(item.productImage)}
          />
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
          <p className={cn(serif, "min-w-0 break-words text-sm font-medium text-zinc-800")}>
            {item.productName}
          </p>
          {item.breederLogoUrl ? (
            <span className="inline-flex h-5 shrink-0 items-center self-center">
              <Image
                src={item.breederLogoUrl}
                alt=""
                width={96}
                height={20}
                className="h-5 w-auto max-w-[7rem] object-contain object-left"
                unoptimized={shouldOffloadImageOptimization(item.breederLogoUrl)}
              />
            </span>
          ) : null}
        </div>
        <p className={cn(mono, "mt-0.5 text-[11px] text-zinc-500")}>
          {cartItemPackDescription(item, locale, { includeLineQuantity: true })}
        </p>
      </div>
      <span className={cn(mono, "shrink-0 text-sm font-medium text-zinc-900")}>
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
  const { user, customer, isLoading: authLoading } = useAuth();
  const { locale, t } = useLanguage();

  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const showWelcomeCoupon = user && ordersCount === 0;

  const [form, setForm] = useState<CheckoutForm>({
    full_name: "",
    phone: "",
    address: "",
    guest_email: "",
    order_note: "",
  });
  const [promptPayQrDataUrl, setPromptPayQrDataUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginPromoOpen, setLoginPromoOpen] = useState(false);
  const [loginPromoMessage, setLoginPromoMessage] = useState("");
  const [loginPromoCode, setLoginPromoCode] = useState("");
  const [promoOauthLoading, setPromoOauthLoading] = useState<null | "google" | "line">(null);
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
    if (authLoading) return;
    if (!user) clearPromoCode();
  }, [authLoading, user, clearPromoCode]);

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
    const phoneForPromo = (form.phone || customer?.phone || "").trim();
    if (!phoneForPromo || phoneForPromo.replace(/\D/g, "").length < 9) {
      setFieldErrors((p) => ({ ...p, phone: "กรุณาระบุเบอร์โทรศัพท์เพื่อใช้โค้ดส่วนลด" }));
      toast.error("กรุณาระบุเบอร์โทรศัพท์เพื่อใช้โค้ดส่วนลด");
      return;
    }
    const result = await applyPromoCode(promoInput.trim(), user?.email ?? null, phoneForPromo, user?.id ?? null);
    if (result.success) setPromoInput("");
    else if (result.requireLogin && result.attemptedCode) {
      setLoginPromoMessage(result.message ?? "กรุณาเข้าสู่ระบบเพื่อใช้โค้ด WELCOME10 และรับส่วนลดสมาชิกใหม่ 10%");
      setLoginPromoCode(result.attemptedCode);
      setLoginPromoOpen(true);
    }
  };

  const handleApplyWelcome10 = async () => {
    const phoneForPromo = (form.phone || customer?.phone || "").trim();
    if (!phoneForPromo || phoneForPromo.replace(/\D/g, "").length < 9) {
      setFieldErrors((p) => ({ ...p, phone: "กรุณาระบุเบอร์โทรศัพท์เพื่อใช้โค้ดส่วนลด" }));
      toast.error("กรุณาระบุเบอร์โทรศัพท์เพื่อใช้โค้ดส่วนลด");
      return;
    }
    setPromoInput("WELCOME10");
    const result = await applyPromoCode("WELCOME10", user?.email ?? null, phoneForPromo, user?.id ?? null);
    if (result.requireLogin && result.attemptedCode) {
      setLoginPromoMessage(result.message ?? "กรุณาเข้าสู่ระบบเพื่อใช้โค้ด WELCOME10 และรับส่วนลดสมาชิกใหม่ 10%");
      setLoginPromoCode(result.attemptedCode);
      setLoginPromoOpen(true);
    }
  };

  const runCheckoutPromoOAuth = async (provider: "google" | "line") => {
    setPromoOauthLoading(provider);
    try {
      if (provider === "line") {
        const next = `/checkout?promo=${encodeURIComponent(loginPromoCode)}`;
        const { signIn: nextAuthSignIn } = await import("next-auth/react");
        await nextAuthSignIn("line", {
          callbackUrl: `/auth/line-bridge?next=${encodeURIComponent(next)}`,
        });
        return;
      }
      const supabase = createClient();
      const redirectTo = `${getURL()}checkout?promo=${encodeURIComponent(loginPromoCode)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) toast.error(error.message);
    } finally {
      setPromoOauthLoading(null);
    }
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

    let orderEmail: string | null = user?.email ?? null;
    if (!user) {
      const ge = parsed.data.guest_email?.trim() ?? "";
      const ok = z.string().email().safeParse(ge);
      if (!ok.success) {
        setFieldErrors({
          guest_email: t("กรุณากรอกอีเมลให้ถูกต้อง", "Please enter a valid email address"),
        });
        return;
      }
      orderEmail = ge;
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
            email: orderEmail,
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
          promo_code_id:
            user && summary.usePromoForOrder ? promo.code?.id ?? null : null,
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
      <div
        className={`flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 pt-16 text-center ${JOURNAL_PRODUCT_FONT_VARS}`}
      >
        <ShoppingBag className="h-10 w-10 text-zinc-200" strokeWidth={1} />
        <p className={cn(serif, "text-lg font-medium text-zinc-800")}>
          {t("ตะกร้าสินค้าว่างเปล่า", "Your cart is empty")}
        </p>
        <Button asChild variant="outline" className="rounded-sm border-zinc-200 tracking-wide">
          <Link href="/shop">{t("สำรวจสายพันธุ์", "Explore genetics")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white pt-20 ${JOURNAL_PRODUCT_FONT_VARS}`}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/shop" className="text-zinc-500 hover:text-emerald-800">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
          </Link>
          <h1 className={cn(serif, "text-2xl font-medium tracking-tight text-zinc-900")}>
            {t("ดำเนินการชำระเงิน", "Checkout")}
          </h1>
        </div>

        {!user && !authLoading && (
          <div className="mx-auto mb-4 max-w-3xl rounded-lg border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-[12px] leading-relaxed text-amber-950 shadow-sm">
            <p>
              {t(
                "การสั่งซื้อในฐานะบุคคลทั่วไปจะไม่สามารถใช้โค้ดส่วนลดสมาชิก (เช่น 420DAY) ได้",
                "Guest checkout cannot use member promo codes (e.g. 420DAY).",
              )}
            </p>
            <p className="mt-2 text-[11px] text-amber-900/90">
              {t(
                "สมัครหรือเข้าสู่ระบบเพื่อใช้โค้ดและสะสมสิทธิประโยชน์",
                "Sign up or log in to apply codes and unlock member benefits.",
              )}{" "}
              <Link
                href="/login?next=/checkout"
                className="font-semibold text-amber-950 underline underline-offset-2 hover:text-amber-900"
              >
                {t("เข้าสู่ระบบ / สมัครสมาชิก", "Log in / Register")}
              </Link>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mx-auto max-w-3xl space-y-4">
              {user && (
                <div className="flex items-center gap-2 rounded-sm border border-zinc-100 bg-zinc-50/80 px-4 py-2.5 text-sm text-zinc-700">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.25} />
                  {t("Auto-fill จากบัญชีของคุณ", "Auto-filled from your account")}
                </div>
              )}

              <ShippingSection
                user={user}
                form={form}
                fieldErrors={fieldErrors}
                setField={setField}
                t={t}
                serif={serif}
              />

              <OrderSummary>
              <Card className="rounded-sm border-zinc-200 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                    <h2 className={cn(serif, "text-xs font-medium text-zinc-700")}>
                      {t("สรุปรายการ", "Order summary")}
                    </h2>
                    <span
                      className={cn(
                        mono,
                        "shrink-0 rounded-sm border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600"
                      )}
                    >
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

                  <CouponSection>
                  {user && savedCoupons.length > 0 && (
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
                              onClick={() => {
                                const phoneForPromo = (form.phone || customer?.phone || "").trim();
                                if (!phoneForPromo || phoneForPromo.replace(/\D/g, "").length < 9) {
                                  setFieldErrors((p) => ({ ...p, phone: "กรุณาระบุเบอร์โทรศัพท์เพื่อใช้โค้ดส่วนลด" }));
                                  toast.error("กรุณาระบุเบอร์โทรศัพท์เพื่อใช้โค้ดส่วนลด");
                                  return;
                                }
                                void applyPromoCode(
                                  c.promo_code,
                                  user?.email ?? null,
                                  phoneForPromo,
                                  user?.id ?? null
                                );
                              }}
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

                  {!user && (
                    <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-600">
                      {t(
                        "โค้ดส่วนลดใช้ได้เมื่อเข้าสู่ระบบเท่านั้น — Google, อีเมล หรือ LINE",
                        "Promo codes require an account — Google, Email, or LINE.",
                      )}
                    </p>
                  )}

                  {user && showWelcomeCoupon && !promo.code && (
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

                  {user && !promo.code ? (
                    <div className="flex gap-2">
                      <Input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder={t("รหัสส่วนลด", "Promo code")}
                        className={cn(mono, "rounded-sm border-zinc-200 bg-white text-sm")}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleApplyPromo()}
                        disabled={isValidatingPromo || !promoInput.trim()}
                        className="rounded-sm border-zinc-200"
                      >
                        {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ใช้", "Apply")}
                      </Button>
                    </div>
                  ) : null}
                  {user && promo.error && (
                    <p className="text-xs text-red-500">{promo.error}</p>
                  )}

                  {user && promo.code && (
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

                  </CouponSection>

                  <div className="space-y-2 rounded-sm border border-zinc-100 bg-zinc-50/40 p-3 text-sm">
                    <div className="flex justify-between gap-3 text-zinc-600">
                      <span className={cn(serif, "text-xs font-medium text-zinc-600")}>
                        {t("ยอดสินค้า", "Subtotal")}
                      </span>
                      <span className={cn(mono, "font-medium text-zinc-900")}>{formatPrice(summary.subtotal)}</span>
                    </div>
                    {summary.tierDiscount > 0 && (
                      <div className="flex justify-between gap-3 text-emerald-800">
                        <span className={cn(serif, "text-xs font-medium")}>
                          {t(
                            `ส่วนลดอัตโนมัติ (${summary.discountPercent}%)`,
                            `Auto discount (${summary.discountPercent}%)`
                          )}
                        </span>
                        <span className={cn(mono, "font-medium")}>-{formatPrice(summary.tierDiscount)}</span>
                      </div>
                    )}
                    {summary.promoDiscount > 0 && (
                      <div className="flex justify-between gap-3 text-emerald-800">
                        <span className={cn(serif, "text-xs font-medium")}>
                          {t(`ส่วนลดโค้ด (${promo.code?.code ?? ""})`, `Coupon (${promo.code?.code ?? ""})`)}
                        </span>
                        <span className={cn(mono, "font-medium")}>-{formatPrice(summary.promoDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-3 text-zinc-600">
                      <span className={cn(serif, "text-xs font-medium text-zinc-600")}>
                        {t("ค่าจัดส่ง", "Shipping")}
                      </span>
                      <span className={cn(mono, "font-medium text-zinc-900")}>
                        {summary.shipping === 0 ? t("ฟรี", "Free") : formatPrice(summary.shipping)}
                      </span>
                    </div>
                    {summary.tierDiscount + summary.promoDiscount > 0 && (
                      <div className="flex items-center justify-center gap-2 rounded-sm border border-zinc-100 bg-white px-3 py-2.5 text-xs text-zinc-700">
                        <Sparkles className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1} />
                        <span>
                          {t("คุณประหยัดเงินไปได้ทั้งหมด", "You've saved a total of")}{" "}
                          <strong className={cn(mono, "font-semibold")}>
                            {formatPrice(summary.tierDiscount + summary.promoDiscount)}
                          </strong>
                        </span>
                      </div>
                    )}
                    <Separator className="my-1 bg-zinc-100" />
                    <div className="rounded-sm border border-zinc-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3 text-zinc-900">
                        <span className={cn(serif, "text-xs font-medium text-zinc-600")}>
                          {t("ยอดสุทธิ", "Net total")}
                        </span>
                        <span className={cn(mono, "text-xl font-semibold text-emerald-900")}>
                          {formatPrice(summary.total)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {t("ยอดที่ต้องชำระ (โอน / พร้อมเพย์)", "Amount to pay (transfer / PromptPay)")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </OrderSummary>

              <PaymentSection
                paymentSettings={paymentSettings}
                paymentSettingsError={paymentSettingsError}
                promptPayQrDataUrl={promptPayQrDataUrl}
                t={t}
                serif={serif}
              />

              {submitError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitError}</p>
              )}

              <a
                href={process.env.NEXT_PUBLIC_LINE_OA_URL ?? "https://page.line.me/smileseedsbank"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-[#06C755]/30 bg-[#06C755]/10 px-3 py-2.5 text-[11px] font-medium text-[#06C755] hover:bg-[#06C755]/15"
              >
                <span className="text-base leading-none">💬</span>
                {t(
                  "อย่าลืมเพิ่มเพื่อน @smileseedsbank เพื่อรับเลขพัสดุอัตโนมัติทาง LINE",
                  "Add @smileseedsbank as a friend to receive tracking updates on LINE",
                )}
              </a>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-sm bg-emerald-800 text-base font-semibold tracking-wide text-white shadow-none hover:bg-emerald-900 active:scale-[0.98]"
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
        onGoogleLogin={() => runCheckoutPromoOAuth("google")}
        onLineLogin={() => runCheckoutPromoOAuth("line")}
        emailLoginHref={`/login?next=${encodeURIComponent(`/checkout?promo=${encodeURIComponent(loginPromoCode)}`)}`}
        oauthLoading={promoOauthLoading}
        t={t}
      />
    </div>
  );
}
