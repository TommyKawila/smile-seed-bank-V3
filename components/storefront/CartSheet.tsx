"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, Tag, ChevronRight, Sparkles, Ticket } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCartContext } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { getURL } from "@/lib/get-url";
import { DiscountProgressBar } from "./DiscountProgressBar";
import { LoginForPromoDialog } from "./LoginForPromoDialog";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cartItemPackDescription } from "@/lib/cart-pack-display";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";

const sans = "font-sans";
const sansTab = "font-sans tabular-nums";

function CartLineQuantityInput({
  variantId,
  quantity,
  stockMax,
  outOfStock,
  ariaQuantity,
  updateQuantity,
  onCappedToStock,
}: {
  variantId: number;
  quantity: number;
  stockMax: number | undefined;
  outOfStock: boolean;
  ariaQuantity: string;
  updateQuantity: (variantId: number, q: number) => { ok: boolean; maxStock?: number };
  onCappedToStock: () => void;
}) {
  const [text, setText] = useState(String(quantity));

  useEffect(() => {
    setText(String(quantity));
  }, [quantity, variantId]);

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={outOfStock}
      aria-label={ariaQuantity}
      className={cn(
        "h-7 w-11 border-0 bg-transparent p-0 text-center text-sm font-medium shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        sansTab,
        outOfStock && "cursor-not-allowed opacity-50"
      )}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") {
          setText("");
          return;
        }
        if (/^0+$/.test(raw)) {
          setText(raw);
          return;
        }
        const parsed = parseInt(raw, 10);
        if (Number.isNaN(parsed)) return;

        let v = Math.max(1, parsed);
        if (stockMax !== undefined) {
          if (v > stockMax) onCappedToStock();
          v = Math.min(v, stockMax);
        }
        setText(String(v));
        const r = updateQuantity(variantId, v);
        if (!r.ok && r.maxStock !== undefined) {
          setText(String(r.maxStock));
        }
      }}
      onBlur={() => {
        if (text.trim() === "") {
          setText("1");
          updateQuantity(variantId, 1);
          return;
        }
        const parsed = parseInt(text, 10);
        if (Number.isNaN(parsed)) {
          setText(String(quantity));
          return;
        }
        let v = Math.max(1, parsed);
        if (stockMax !== undefined) {
          if (v > stockMax) onCappedToStock();
          v = Math.min(v, stockMax);
        }
        setText(String(v));
        updateQuantity(variantId, v);
      }}
    />
  );
}

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CartSheet({ open, onClose }: CartSheetProps) {
  const {
    items,
    summary,
    promo,
    tieredDiscountRules,
    isValidatingPromo,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyPromoCode,
    clearPromoCode,
    itemCount,
  } = useCartContext();

  const { t, locale } = useLanguage();
  const { user, customer } = useAuth();
  const [couponInput, setCouponInput] = useState("");
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<{ code: string; discount_type: string; discount_value: number }[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [loginPromoOpen, setLoginPromoOpen] = useState(false);
  const [loginPromoMessage, setLoginPromoMessage] = useState("");
  const [loginPromoCode, setLoginPromoCode] = useState("");
  const [promoOauthLoading, setPromoOauthLoading] = useState<null | "google" | "line">(null);

  const fetchAvailableCoupons = useCallback(async () => {
    setLoadingCoupons(true);
    try {
      const params = new URLSearchParams({ subtotal: String(summary.subtotal) });
      if (user?.email) params.set("email", user.email);
      const res = await fetch(`/api/storefront/coupons/available?${params}`);
      const data = await res.json().catch(() => []);
      setAvailableCoupons(Array.isArray(data) ? data : []);
    } finally {
      setLoadingCoupons(false);
    }
  }, [summary.subtotal, user?.email]);

  const handleOpenCoupons = () => {
    if (!user) {
      setLoginPromoMessage(
        t(
          "สมัครสมาชิกหรือเข้าสู่ระบบเพื่อดูและใช้โค้ดส่วนลด",
          "Sign up or log in to view and apply promo codes.",
        ),
      );
      setLoginPromoCode("");
      setLoginPromoOpen(true);
      return;
    }
    setCouponsOpen(true);
    void fetchAvailableCoupons();
  };

  const handleSelectCoupon = async (code: string) => {
    setCouponInput(code);
    const result = await applyPromoCode(code, user?.email ?? null, customer?.phone ?? null, user?.id ?? null);
    if (result.success) {
      setCouponInput("");
      setCouponsOpen(false);
    } else if (result.requireLogin && result.attemptedCode) {
      setLoginPromoMessage(result.message ?? "กรุณาเข้าสู่ระบบเพื่อใช้โค้ด WELCOME10 และรับส่วนลดสมาชิกใหม่ 10%");
      setLoginPromoCode(result.attemptedCode);
      setLoginPromoOpen(true);
      setCouponsOpen(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!couponInput.trim()) return;
    const result = await applyPromoCode(
      couponInput.trim(),
      user?.email ?? null,
      customer?.phone ?? null,
      user?.id ?? null
    );
    if (result.success) setCouponInput("");
    else if (result.requireLogin && result.attemptedCode) {
      setLoginPromoMessage(result.message ?? "กรุณาเข้าสู่ระบบเพื่อใช้โค้ด WELCOME10 และรับส่วนลดสมาชิกใหม่ 10%");
      setLoginPromoCode(result.attemptedCode);
      setLoginPromoOpen(true);
    }
  };

  const runCartPromoOAuth = async (provider: "google" | "line") => {
    setPromoOauthLoading(provider);
    try {
      if (provider === "line") {
        const next = loginPromoCode
          ? `/?promo=${encodeURIComponent(loginPromoCode)}`
          : "/";
        const { signIn: nextAuthSignIn } = await import("next-auth/react");
        await nextAuthSignIn("line", {
          callbackUrl: `/auth/line-bridge?next=${encodeURIComponent(next)}`,
        });
        return;
      }
      const supabase = createClient();
      const redirectTo = loginPromoCode
        ? `${getURL()}?promo=${encodeURIComponent(loginPromoCode)}`
        : getURL();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) toast.error(error.message);
    } finally {
      setPromoOauthLoading(null);
    }
  };

  const handleClearPromo = () => {
    clearPromoCode();
    setCouponInput("");
  };

  const stockToast = (n: number) =>
    t(
      `ขออภัย สินค้าชิ้นนี้มีสต็อกเพียง ${n} ชิ้นเท่านั้น`,
      `Sorry, only ${n} items available`
    );

  const notifyQtyCappedToStock = useCallback(() => {
    toast.warning(
      t("จำกัดจำนวนตามสต็อกที่มีอยู่", "Limited to available stock")
    );
  }, [t]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-zinc-100 bg-white p-0 font-sans sm:max-w-md"
      >
        {/* Header */}
        <SheetHeader className="border-b border-zinc-100 px-5 py-4">
          <SheetTitle
            className={cn(
              sans,
              "flex items-center gap-2 text-lg font-medium tracking-tight text-zinc-900"
            )}
          >
            {t("ตะกร้าสินค้าของคุณ", "Your cart")}
            {itemCount > 0 && (
              <span
                className={cn(
                  sansTab,
                  "ml-1 rounded-sm border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                )}
              >
                {itemCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingBag className="h-10 w-10 text-zinc-200" strokeWidth={1} />
              <p className={cn(sans, "text-lg font-medium text-zinc-800")}>
                {t("ยังไม่มีสินค้าในตะกร้า", "Your cart is empty")}
              </p>
              <Button variant="outline" size="sm" onClick={onClose} asChild className="mt-1 rounded-sm border-zinc-200 font-sans tracking-wide">
                <Link href="/shop">{t("สำรวจสายพันธุ์", "Explore genetics")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  {/* Product Image */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
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
                        <ShoppingBag className="h-6 w-6 text-zinc-300" />
                      </div>
                    )}
                    {item.isFreeGift && (
                      <span className="absolute bottom-0 left-0 right-0 bg-amber-400 py-0.5 text-center font-sans text-[9px] font-bold text-white">
                        🎁 FREE
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p
                          className={cn(
                            sans,
                            "min-w-0 text-sm font-medium leading-tight text-zinc-900 break-words"
                          )}
                        >
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
                      <p className={cn(sans, "mt-0.5 text-[11px] font-normal text-zinc-500")}>
                        {cartItemPackDescription(item, locale)}
                      </p>
                      {item.stock_quantity === 0 && (
                        <p className="font-sans text-xs font-medium text-red-600">
                          {t("หมดสต็อก", "Out of stock")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {item.isFreeGift ? (
                        <span className={cn(sans, "text-sm font-medium text-amber-700")}>
                          {t("ฟรี!", "Free!")}
                        </span>
                      ) : (
                        <>
                          {/* Qty Controls */}
                          {(() => {
                            const max = item.stock_quantity;
                            const outOfStock = max === 0;
                            const atMax =
                              max !== undefined && item.quantity >= max;
                            return (
                          <div className="flex items-center gap-1 rounded-sm border border-zinc-200 bg-white p-0.5 font-sans">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.variantId, item.quantity - 1)
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-md font-sans hover:bg-zinc-100"
                              aria-label="ลดจำนวน"
                            >
                              <Minus className="h-3 w-3 text-zinc-600" />
                            </button>
                            <CartLineQuantityInput
                              variantId={item.variantId}
                              quantity={item.quantity}
                              stockMax={max}
                              outOfStock={outOfStock}
                              ariaQuantity={t("จำนวน", "Quantity")}
                              updateQuantity={updateQuantity}
                              onCappedToStock={notifyQtyCappedToStock}
                            />
                            <button
                              type="button"
                              disabled={outOfStock || atMax}
                              onClick={() => {
                                if (outOfStock || atMax) return;
                                const r = updateQuantity(
                                  item.variantId,
                                  item.quantity + 1
                                );
                                if (
                                  !r.ok &&
                                  r.maxStock !== undefined
                                ) {
                                  toast.error(stockToast(r.maxStock));
                                }
                              }}
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-md font-sans hover:bg-zinc-100",
                                (outOfStock || atMax) &&
                                  "cursor-not-allowed opacity-40 hover:bg-transparent"
                              )}
                              aria-label="เพิ่มจำนวน"
                            >
                              <Plus className="h-3 w-3 text-zinc-600" />
                            </button>
                          </div>
                            );
                          })()}
                          <span className={cn(sansTab, "text-sm font-medium text-zinc-900")}>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Remove */}
                  {!item.isFreeGift && (
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="self-start pt-0.5 text-zinc-300 transition-colors hover:text-red-500"
                      aria-label="ลบสินค้า"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — only show when cart has items */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-zinc-100 px-5 py-4">
            {/* Tier Progress */}
            <DiscountProgressBar subtotal={summary.subtotal} rules={tieredDiscountRules} />

            {/* Promo Code */}
            <div className="space-y-1.5">
              {!user && (
                <p className="font-sans rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] leading-relaxed text-zinc-600">
                  {t(
                    "สมัครสมาชิกเพื่อรับส่วนลดโปรโมชั่น (Google, Email หรือ LINE)",
                    "Sign up or log in to use promo codes (Google, Email, or LINE).",
                  )}
                </p>
              )}
              {user && promo.code ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between rounded-sm border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                    <span className={cn(sansTab, "flex items-center gap-1.5 text-[11px] font-medium text-zinc-700")}>
                      <Tag className="h-3.5 w-3.5" />
                      {promo.code.code} — {t("ลด", "Off")}{" "}
                      {String(promo.code.discount_type || "").toUpperCase() === "PERCENTAGE"
                        ? `${promo.code.discount_value}%`
                        : formatPrice(promo.code.discount_value ?? promo.discountAmount)}
                    </span>
                    <button
                      onClick={handleClearPromo}
                      className="font-sans text-[11px] text-zinc-500 underline underline-offset-2"
                    >
                      {t("ลบ", "Remove")}
                    </button>
                  </div>
                  {summary.promoSupersededByTier ? (
                    <p className="font-sans text-[10px] leading-snug text-amber-800">
                      {t(
                        "ใช้ส่วนลดขั้นบันไดแทนโค้ด (ข้อเสนอดีกว่า)",
                        "Tier discount applies instead (better deal)."
                      )}
                    </p>
                  ) : null}
                </div>
              ) : user ? (
                <div className="flex gap-2">
                  <Input
                    placeholder={t("โค้ดส่วนลด", "Promo code")}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className={cn(sans, "h-9 rounded-sm border-zinc-200 bg-white text-sm uppercase tabular-nums")}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleApplyPromo()}
                    disabled={isValidatingPromo || !couponInput.trim()}
                    className="h-9 shrink-0 rounded-sm border-zinc-200 font-sans"
                  >
                    {isValidatingPromo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("ใช้", "Apply")
                    )}
                  </Button>
                </div>
              ) : null}
              {user && promo.error && (
                <p className="font-sans text-xs text-red-500">{promo.error}</p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenCoupons}
                disabled={loadingCoupons}
                className="w-full gap-2 font-sans text-xs text-primary hover:bg-primary/5"
              >
                <Ticket className="h-3.5 w-3.5" />
                {loadingCoupons ? t("กำลังโหลด...", "Loading...") : t("ดูโค้ดส่วนลดของฉัน", "View my available coupons")}
              </Button>
            </div>

            <LoginForPromoDialog
              open={loginPromoOpen}
              onOpenChange={setLoginPromoOpen}
              message={loginPromoMessage}
              onGoogleLogin={() => runCartPromoOAuth("google")}
              onLineLogin={() => runCartPromoOAuth("line")}
              emailLoginHref={`/login?next=${encodeURIComponent(loginPromoCode ? `/?promo=${encodeURIComponent(loginPromoCode)}` : "/")}`}
              oauthLoading={promoOauthLoading}
              t={t}
            />

            <Dialog open={couponsOpen} onOpenChange={setCouponsOpen}>
              <DialogContent className="font-sans sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-sans">
                    {t("โค้ดส่วนลดที่ใช้ได้", "Available Coupons")}
                  </DialogTitle>
                </DialogHeader>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {availableCoupons.length === 0 && !loadingCoupons ? (
                    <p className="py-4 text-center font-sans text-sm text-zinc-500">
                      {t("ไม่มีโค้ดที่ใช้ได้ในขณะนี้", "No coupons available at the moment")}
                    </p>
                  ) : (
                    availableCoupons.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => void handleSelectCoupon(c.code)}
                        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5 text-left font-sans text-sm transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <span className="font-sans font-semibold tracking-wide">{c.code}</span>
                        <span className="font-sans text-primary">
                          {String(c.discount_type || "").toUpperCase() === "PERCENTAGE"
                            ? `ลด ${c.discount_value}%`
                            : `ลด ${formatPrice(c.discount_value)}`}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Separator />

            {/* Totals */}
            <div className="space-y-2 rounded-sm border border-zinc-100 bg-zinc-50/40 p-3 font-sans text-sm">
              <div className="flex justify-between gap-3 text-zinc-600">
                <span className={cn(sans, "text-xs font-medium")}>{t("ยอดรวม", "Subtotal")}</span>
                <span className={cn(sansTab, "font-medium text-zinc-900")}>{formatPrice(summary.subtotal)}</span>
              </div>
              {summary.tierDiscount > 0 && (
                <div className="flex justify-between gap-3 text-emerald-800">
                  <span className={cn(sans, "text-xs font-medium")}>
                    {t("ส่วนลดอัตโนมัติ", "Auto discount")} ({summary.discountPercent}%)
                  </span>
                  <span className={cn(sansTab, "font-medium")}>-{formatPrice(summary.tierDiscount)}</span>
                </div>
              )}
              {summary.promoDiscount > 0 && (
                <div className="flex justify-between gap-3 text-emerald-800">
                  <span className={cn(sans, "text-xs font-medium")}>
                    {t("ส่วนลดโค้ด", "Coupon")} ({promo.code?.code ?? ""})
                  </span>
                  <span className={cn(sansTab, "font-medium")}>-{formatPrice(summary.promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between gap-3 text-zinc-600">
                <span className={cn(sans, "text-xs font-medium")}>{t("ค่าส่ง", "Shipping")}</span>
                <span className={cn(sansTab, "font-medium text-zinc-900")}>
                  {summary.shipping === 0 ? t("ฟรี", "Free") : formatPrice(summary.shipping)}
                </span>
              </div>
              <Separator className="bg-zinc-100" />
              <div className="flex justify-between gap-3 text-zinc-900">
                <span className={cn(sans, "text-sm font-medium")}>{t("ยอดสุทธิ", "Total")}</span>
                <span className={cn(sansTab, "text-base font-semibold text-emerald-900")}>
                  {formatPrice(summary.total)}
                </span>
              </div>
            </div>

            {summary.tierDiscount + summary.promoDiscount > 0 && (
              <div className="flex items-center justify-center gap-2 rounded-sm border border-zinc-100 bg-zinc-50 px-4 py-3 font-sans text-sm text-zinc-700">
                <Sparkles className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1} />
                <span className="text-xs leading-relaxed">
                  {t("คุณประหยัดเงินไปได้ทั้งหมด", "You've saved a total of")}{" "}
                  <strong className={cn(sansTab, "font-semibold")}>
                    {formatPrice(summary.tierDiscount + summary.promoDiscount)}
                  </strong>
                </span>
              </div>
            )}

            {/* Checkout Button */}
            <Button
              asChild
              onClick={onClose}
              className="w-full rounded-sm bg-emerald-800 py-5 font-sans text-base font-semibold tracking-wide text-white shadow-none hover:bg-emerald-900 active:scale-[0.98]"
            >
              <Link href="/checkout" className="font-sans">
                {t("ดำเนินการชำระเงิน", "Proceed to Checkout")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
