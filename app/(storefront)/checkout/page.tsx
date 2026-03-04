"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Loader2, ShoppingBag, ChevronLeft, ShieldCheck, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useCartContext } from "@/context/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { DiscountProgressBar } from "@/components/storefront/DiscountProgressBar";
import { LoginForPromoDialog } from "@/components/storefront/LoginForPromoDialog";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const CheckoutFormSchema = z.object({
  full_name: z.string().min(2, "กรุณาระบุชื่อ-นามสกุล"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(15),
  address: z.string().min(10, "กรุณาระบุที่อยู่จัดส่ง (อย่างน้อย 10 ตัวอักษร)"),
  line_user_id: z.string().optional().or(z.literal("")),
  payment_method: z.enum(["TRANSFER", "CRYPTO", "COD", "CASH"]),
});

type CheckoutForm = z.infer<typeof CheckoutFormSchema>;

const PAYMENT_METHODS = [
  { value: "TRANSFER", label: "โอนเงิน", desc: "ธนาคาร / PromptPay" },
  { value: "CRYPTO", label: "Crypto", desc: "USDT / BTC" },
  { value: "COD", label: "COD", desc: "เก็บเงินปลายทาง" },
];

// ─── Order Item Row ───────────────────────────────────────────────────────────

function OrderItemRow({ item }: { item: ReturnType<typeof useCartContext>["items"][number] }) {
  return (
    <div className="flex items-center gap-3">
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
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-zinc-800">{item.productName}</p>
        <p className="text-xs text-zinc-500">
          {item.unitLabel} × {item.quantity}
        </p>
      </div>
      <span className="text-sm font-semibold text-zinc-900">
        {item.isFreeGift ? "ฟรี" : formatPrice(item.price * item.quantity)}
      </span>
    </div>
  );
}

// ─── Checkout Page ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
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
    line_user_id: "",
    payment_method: "TRANSFER",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginPromoOpen, setLoginPromoOpen] = useState(false);
  const [loginPromoMessage, setLoginPromoMessage] = useState("");
  const [loginPromoCode, setLoginPromoCode] = useState("");
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);

  // Auto-fill from customer profile when auth loads
  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        full_name: customer.full_name ?? prev.full_name,
        phone: customer.phone ?? prev.phone,
        address: customer.address ?? prev.address,
        line_user_id: customer.line_user_id ?? prev.line_user_id,
      }));
    }
  }, [customer]);

  // Orders count for first-time coupon eligibility
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
    const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/checkout?promo=${encodeURIComponent(loginPromoCode)}`;
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

    // Zod validation
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
      setSubmitError("ตะกร้าสินค้าว่างเปล่า");
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
            line_user_id: parsed.data.line_user_id || null,
            email: user?.email ?? null,
          },
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
        throw new Error(body.error ?? "สร้างออเดอร์ไม่สำเร็จ กรุณาลองใหม่");
      }

      const { orderNumber } = await res.json();
      clearCart();
      if (parsed.data.payment_method === "TRANSFER") {
        router.push(`/payment/${orderNumber}`);
      } else {
        router.push(`/order-success?order=${orderNumber}`);
      }
    } catch (err) {
      setSubmitError(String(err).replace("Error: ", ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty cart redirect
  if (itemCount === 0 && !isSubmitting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-16 text-center px-4">
        <ShoppingBag className="h-12 w-12 text-zinc-200" />
        <p className="text-base font-semibold text-zinc-600">ตะกร้าสินค้าว่างเปล่า</p>
        <Button asChild className="bg-primary text-white hover:bg-primary/90">
          <Link href="/shop">เลือกซื้อสินค้า</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-20">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <Link href="/shop" className="text-zinc-500 hover:text-primary">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-zinc-900">ดำเนินการชำระเงิน</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 lg:grid-cols-5">
            {/* ── Left: Form ──────────────────────────────────────────────── */}
            <div className="space-y-4 lg:col-span-3">
              {/* Auto-fill notice */}
              {user && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Auto-fill จากบัญชีของคุณ
                </div>
              )}

              <Card>
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-sm font-bold text-zinc-700">ข้อมูลจัดส่ง</h2>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="full_name">ชื่อ-นามสกุล *</Label>
                      <Input
                        id="full_name"
                        value={form.full_name}
                        onChange={(e) => setField("full_name", e.target.value)}
                        placeholder="ชื่อผู้รับ"
                      />
                      {fieldErrors.full_name && (
                        <p className="text-xs text-red-500">{fieldErrors.full_name}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone">เบอร์โทร *</Label>
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
                    <Label htmlFor="address">ที่อยู่จัดส่ง *</Label>
                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                      rows={3}
                    />
                    {fieldErrors.address && (
                      <p className="text-xs text-red-500">{fieldErrors.address}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="line_user_id">Line ID (ไม่บังคับ)</Label>
                    <Input
                      id="line_user_id"
                      value={form.line_user_id}
                      onChange={(e) => setField("line_user_id", e.target.value)}
                      placeholder="@yourline"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-sm font-bold text-zinc-700">ช่องทางชำระเงิน</h2>
                  {fieldErrors.payment_method && (
                    <p className="text-xs text-red-500">{fieldErrors.payment_method}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => setField("payment_method", pm.value as CheckoutForm["payment_method"])}
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
                </CardContent>
              </Card>
            </div>

            {/* ── Right: Summary ──────────────────────────────────────────── */}
            <div className="space-y-4 lg:col-span-2">
              <Card className="sticky top-24">
                <CardContent className="p-5 space-y-4">
                  <h2 className="text-sm font-bold text-zinc-700">สรุปออเดอร์</h2>

                  {/* Items */}
                  <div className="space-y-3 max-h-52 overflow-y-auto">
                    {items.map((item) => (
                      <OrderItemRow key={item.variantId} item={item} />
                    ))}
                  </div>

                  <Separator />

                  {/* Tier Progress */}
                  <DiscountProgressBar
                    subtotal={summary.subtotal}
                    rules={tieredDiscountRules}
                    upsellMessage={summary.upsellMessage}
                  />

                  {/* Recommended coupon — first order only */}
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

                  {/* Promo input */}
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

                  {/* Promo Code applied */}
                  {promo.code && (
                    <div className="flex items-center justify-between gap-2 text-sm text-emerald-600">
                      <span>โค้ด: {promo.code.code} — {String(promo.code.discount_type || "").toUpperCase() === "PERCENTAGE" ? `ลด ${promo.code.discount_value}%` : `ลด ${formatPrice(promo.code.discount_value)}`}</span>
                      <span className="flex items-center gap-2">
                        -{formatPrice(summary.promoDiscount)}
                        <button type="button" onClick={() => clearPromoCode()} className="text-xs text-zinc-400 hover:text-red-500">
                          {t("ลบ", "Remove")}
                        </button>
                      </span>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-zinc-600">
                      <span>ยอดรวม</span>
                      <span>{formatPrice(summary.subtotal)}</span>
                    </div>
                    {summary.tierDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>ส่วนลดขั้นบันได ({summary.discountPercent}%)</span>
                        <span>-{formatPrice(summary.tierDiscount)}</span>
                      </div>
                    )}
                    {summary.promoDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>ส่วนลดโค้ด ({promo.code?.code ?? ""})</span>
                        <span>-{formatPrice(summary.promoDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-600">
                      <span>ค่าส่ง</span>
                      <span>{summary.shipping === 0 ? "ฟรี 🎉" : formatPrice(summary.shipping)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold text-zinc-900">
                      <span>ยอดสุทธิ</span>
                      <span className="text-primary">{formatPrice(summary.total)}</span>
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
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังสร้างออเดอร์...</>
                    ) : form.payment_method === "TRANSFER" ? (
                      `ดำเนินการชำระเงิน · ${formatPrice(summary.total)}`
                    ) : (
                      `ยืนยันชำระเงิน · ${formatPrice(summary.total)}`
                    )}
                  </Button>

                  <p className="text-center text-xs text-zinc-400">
                    🔒 ข้อมูลของคุณปลอดภัยและถูกเข้ารหัส
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
