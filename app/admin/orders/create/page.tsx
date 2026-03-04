"use client";

import { useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

// ─── Customer Info Form ───────────────────────────────────────────────────────

interface CustomerInfo {
  full_name: string;
  phone: string;
  address: string;
  payment_method: string;
  note: string;
}

export default function CreateOrderPage() {
  const { products, isLoading: loadingProducts } = useProducts({ includeVariants: true });
  const {
    items,
    summary,
    promo,
    isValidatingPromo,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyPromoCode,
    clearPromoCode,
    clearCart,
    itemCount,
  } = useCart();

  const [search, setSearch] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [customer, setCustomer] = useState<CustomerInfo>({
    full_name: "",
    phone: "",
    address: "",
    payment_method: "CASH",
    note: "",
  });

  const setCustomerField = (field: keyof CustomerInfo, value: string) =>
    setCustomer((prev) => ({ ...prev, [field]: value }));

  // Filter products + expand variants for search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Submit Manual Order ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items,
          summary,
          promoCode: promo.code?.code ?? null,
          orderOrigin: "MANUAL",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "สร้างออเดอร์ไม่สำเร็จ");
      }

      const result = await res.json();
      setSubmitSuccess(`✅ สร้างออเดอร์ #${result.orderNumber} สำเร็จ`);
      clearCart();
      setCustomer({ full_name: "", phone: "", address: "", payment_method: "CASH", note: "" });
    } catch (err) {
      setSubmitError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">สร้างออเดอร์ Manual (POS)</h1>
        <p className="text-sm text-zinc-500">สำหรับลูกค้าที่สั่งซื้อนอกเว็บไซต์</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* LEFT — Product Selector */}
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">เลือกสินค้า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="ค้นหาสินค้า..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-72 space-y-1 overflow-y-auto">
                {loadingProducts ? (
                  <p className="py-4 text-center text-sm text-zinc-400">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </p>
                ) : filteredProducts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-zinc-400">ไม่พบสินค้า</p>
                ) : (
                  filteredProducts.map((product) =>
                    product.product_variants
                      ?.filter((v) => v.is_active && v.stock > 0)
                      .map((variant) => (
                        <button
                          key={`${product.id}-${variant.id}`}
                          type="button"
                          onClick={() =>
                            addToCart({
                              variantId: variant.id,
                              productId: product.id,
                              productName: product.name,
                              productImage: product.image_url,
                              unitLabel: variant.unit_label,
                              price: variant.price,
                              quantity: 1,
                              masterSku: (product as { master_sku?: string | null }).master_sku ?? null,
                            })
                          }
                          className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5"
                        >
                          <div>
                            <p className="text-sm font-medium text-zinc-800">{product.name}</p>
                            <p className="text-xs text-zinc-500">{variant.unit_label} · เหลือ {variant.stock}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary">
                              {formatPrice(variant.price)}
                            </span>
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                        </button>
                      ))
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ข้อมูลลูกค้า</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>ชื่อ-นามสกุล</Label>
                <Input
                  value={customer.full_name}
                  onChange={(e) => setCustomerField("full_name", e.target.value)}
                  placeholder="ชื่อลูกค้า"
                />
              </div>
              <div className="space-y-1">
                <Label>เบอร์โทรศัพท์</Label>
                <Input
                  value={customer.phone}
                  onChange={(e) => setCustomerField("phone", e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  type="tel"
                />
              </div>
              <div className="col-span-full space-y-1">
                <Label>ที่อยู่จัดส่ง</Label>
                <Textarea
                  value={customer.address}
                  onChange={(e) => setCustomerField("address", e.target.value)}
                  placeholder="บ้านเลขที่, ถนน, แขวง, เขต, จังหวัด, รหัสไปรษณีย์"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>ช่องทางชำระเงิน</Label>
                <select
                  value={customer.payment_method}
                  onChange={(e) => setCustomerField("payment_method", e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="CASH">เงินสด</option>
                  <option value="TRANSFER">โอนเงิน</option>
                  <option value="CRYPTO">Crypto</option>
                  <option value="COD">COD</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>หมายเหตุ</Label>
                <Input
                  value={customer.note}
                  onChange={(e) => setCustomerField("note", e.target.value)}
                  placeholder="หมายเหตุพิเศษ (ถ้ามี)"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Cart & Summary */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4 text-primary" />
                รายการสินค้า
                {itemCount > 0 && (
                  <Badge className="ml-auto bg-primary text-white">{itemCount}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-400">
                  เลือกสินค้าจากรายการด้านซ้าย
                </p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-800">
                          {item.productName}
                          {item.isFreeGift && (
                            <span className="ml-1 text-xs text-amber-600">🎁 FREE</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">{item.unitLabel}</p>
                      </div>
                      {!item.isFreeGift && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="rounded p-0.5 hover:bg-zinc-100"
                          >
                            <Minus className="h-3.5 w-3.5 text-zinc-500" />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="rounded p-0.5 hover:bg-zinc-100"
                          >
                            <Plus className="h-3.5 w-3.5 text-zinc-500" />
                          </button>
                        </div>
                      )}
                      <span className="w-20 text-right text-sm font-medium">
                        {item.isFreeGift ? "ฟรี" : formatPrice(item.price * item.quantity)}
                      </span>
                      {!item.isFreeGift && (
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Promo Code */}
              <div className="flex gap-2">
                <Input
                  placeholder="โค้ดส่วนลด"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="text-sm"
                  disabled={!!promo.code}
                />
                {promo.code ? (
                  <Button variant="outline" size="sm" onClick={() => { clearPromoCode(); setPromoInput(""); }}>
                    ลบ
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPromoCode(promoInput, null, customer.phone)}
                    disabled={isValidatingPromo || !promoInput}
                  >
                    {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "ใช้"}
                  </Button>
                )}
              </div>
              {promo.code && (
                <p className="text-xs text-emerald-600">✅ {promo.code.code} — ลด {formatPrice(promo.discountAmount)}</p>
              )}
              {promo.error && <p className="text-xs text-red-500">{promo.error}</p>}

              {/* Upsell Message */}
              {summary.upsellMessage && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  💡 {summary.upsellMessage}
                </p>
              )}

              <Separator />

              {/* Summary Rows */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>ยอดรวม</span>
                  <span>{formatPrice(summary.subtotal)}</span>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>ส่วนลด {summary.discountPercent > 0 ? `(${summary.discountPercent}%)` : ""}</span>
                    <span>-{formatPrice(summary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <span>ค่าส่ง</span>
                  <span>{summary.shipping === 0 ? "ฟรี" : formatPrice(summary.shipping)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold text-zinc-900">
                  <span>ยอดสุทธิ</span>
                  <span className="text-primary">{formatPrice(summary.total)}</span>
                </div>
              </div>

              {/* Submit */}
              {submitSuccess && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{submitSuccess}</p>
              )}
              {submitError && (
                <p className="text-sm text-red-500">{submitError}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={items.filter((i) => !i.isFreeGift).length === 0 || isSubmitting}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> กำลังสร้างออเดอร์...</>
                ) : (
                  <>ยืนยันออเดอร์ · {formatPrice(summary.total)}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
