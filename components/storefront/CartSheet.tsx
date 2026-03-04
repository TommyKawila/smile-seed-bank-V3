"use client";

import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { DiscountProgressBar } from "./DiscountProgressBar";
import { LoginForPromoDialog } from "./LoginForPromoDialog";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

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

  const { t } = useLanguage();
  const { user, customer } = useAuth();
  const [couponInput, setCouponInput] = useState("");
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<{ code: string; discount_type: string; discount_value: number }[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [loginPromoOpen, setLoginPromoOpen] = useState(false);
  const [loginPromoMessage, setLoginPromoMessage] = useState("");
  const [loginPromoCode, setLoginPromoCode] = useState("");
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);

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

  const handleLoginForPromo = async () => {
    setGoogleLoginLoading(true);
    const supabase = createClient();
    const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/?promo=${encodeURIComponent(loginPromoCode)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    setGoogleLoginLoading(false);
  };

  const handleClearPromo = () => {
    clearPromoCode();
    setCouponInput("");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        {/* Header */}
        <SheetHeader className="border-b border-zinc-200 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {t("ตะกร้าสินค้า", "Your Cart")}
            {itemCount > 0 && (
              <Badge className="ml-1 bg-primary text-white">{itemCount}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-zinc-200" />
              <p className="text-sm font-medium text-zinc-500">
                {t("ยังไม่มีสินค้าในตะกร้า", "Your cart is empty")}
              </p>
              <Button variant="outline" size="sm" onClick={onClose} asChild className="mt-1">
                <Link href="/shop">{t("เลือกซื้อสินค้า", "Browse Products")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  {/* Product Image */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-zinc-300" />
                      </div>
                    )}
                    {item.isFreeGift && (
                      <span className="absolute bottom-0 left-0 right-0 bg-amber-400 py-0.5 text-center text-[9px] font-bold text-white">
                        🎁 FREE
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium leading-tight text-zinc-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-zinc-500">{item.unitLabel}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      {item.isFreeGift ? (
                        <span className="text-sm font-semibold text-amber-600">{t("ฟรี!", "Free!")}</span>
                      ) : (
                        <>
                          {/* Qty Controls */}
                          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-zinc-100"
                              aria-label="ลดจำนวน"
                            >
                              <Minus className="h-3 w-3 text-zinc-600" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-zinc-100"
                              aria-label="เพิ่มจำนวน"
                            >
                              <Plus className="h-3 w-3 text-zinc-600" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-zinc-900">
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
          <div className="border-t border-zinc-200 px-5 py-4 space-y-3">
            {/* Tier Progress */}
            <DiscountProgressBar
              subtotal={summary.subtotal}
              rules={tieredDiscountRules}
              upsellMessage={summary.upsellMessage}
            />
            {summary.upsellMessage && (
              <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-primary">
                💡 {summary.upsellMessage}
              </div>
            )}

            {/* Promo Code */}
            <div className="space-y-1.5">
              {promo.code ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <Tag className="h-3.5 w-3.5" />
                    {promo.code.code} — {t("ลด", "Off")}{" "}
                    {String(promo.code.discount_type || "").toUpperCase() === "PERCENTAGE"
                      ? `${promo.code.discount_value}%`
                      : formatPrice(promo.code.discount_value ?? promo.discountAmount)}
                  </span>
                  <button onClick={handleClearPromo} className="text-xs text-emerald-600 underline">
                    {t("ลบ", "Remove")}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder={t("โค้ดส่วนลด", "Promo code")}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="h-9 text-sm uppercase"
                    onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleApplyPromo()}
                    disabled={isValidatingPromo || !couponInput.trim()}
                    className="h-9 shrink-0"
                  >
                    {isValidatingPromo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("ใช้", "Apply")
                    )}
                  </Button>
                </div>
              )}
              {promo.error && (
                <p className="text-xs text-red-500">{promo.error}</p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenCoupons}
                disabled={loadingCoupons}
                className="w-full gap-2 text-xs text-primary hover:bg-primary/5"
              >
                <Ticket className="h-3.5 w-3.5" />
                {loadingCoupons ? t("กำลังโหลด...", "Loading...") : t("ดูโค้ดส่วนลดของฉัน", "View my available coupons")}
              </Button>
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

            <Dialog open={couponsOpen} onOpenChange={setCouponsOpen}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>{t("โค้ดส่วนลดที่ใช้ได้", "Available Coupons")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableCoupons.length === 0 && !loadingCoupons ? (
                    <p className="text-sm text-zinc-500 py-4 text-center">{t("ไม่มีโค้ดที่ใช้ได้ในขณะนี้", "No coupons available at the moment")}</p>
                  ) : (
                    availableCoupons.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => void handleSelectCoupon(c.code)}
                        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5 text-left text-sm hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <span className="font-mono font-semibold">{c.code}</span>
                        <span className="text-emerald-600">
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
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>{t("ยอดรวม", "Subtotal")}</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              {summary.tierDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>{t("ส่วนลดขั้นบันได", "Tier discount")} ({summary.discountPercent}%)</span>
                  <span>-{formatPrice(summary.tierDiscount)}</span>
                </div>
              )}
              {summary.promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>{t("ส่วนลดโค้ด", "Promo code")} ({promo.code?.code ?? ""})</span>
                  <span>-{formatPrice(summary.promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <span>{t("ค่าส่ง", "Shipping")}</span>
                <span>{summary.shipping === 0 ? t("ฟรี 🎉", "Free 🎉") : formatPrice(summary.shipping)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-zinc-900">
                <span>{t("ยอดสุทธิ", "Total")}</span>
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

            {/* Checkout Button */}
            <Button
              asChild
              onClick={onClose}
              className="w-full bg-primary py-5 text-base font-semibold text-white hover:bg-primary/90 active:scale-[0.98] transition-transform"
            >
              <Link href="/checkout">
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
