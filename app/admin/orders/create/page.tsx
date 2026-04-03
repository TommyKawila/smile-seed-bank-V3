"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Search, Plus, Minus, Trash2, ShoppingBag, Loader2, UserPlus, X, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { formatPrice, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { toastErrorMessage } from "@/lib/admin-toast";
import { applyPromotions, type PromotionRule } from "@/lib/promotion-utils";
import { applyWholesalePrice } from "@/lib/wholesale-utils";
import type { ProductWithBreeder, ProductWithBreederMaybeVariants } from "@/types/supabase";

type PosCustomer = {
  id: string;
  name: string;
  phone: string;
  tier: "Retail" | "Wholesale" | "VIP";
  wholesale_discount_percent?: number;
  address?: string | null;
  points?: number;
};

interface CustomerInfo {
  full_name: string;
  phone: string;
  address: string;
  payment_method: string;
  note: string;
}

export default function CreateOrderPage() {
  const { toast } = useToast();
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
    applyWholesaleToItems,
    itemCount,
  } = useCart();

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<PosCustomer[]>([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: "", phone: "" });
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);
  const [breederFilter, setBreederFilter] = useState<string>("all");
  const [seedTypeFilter, setSeedTypeFilter] = useState<string>("all");
  const [dominanceFilter, setDominanceFilter] = useState<string>("all");
  const [promoInput, setPromoInput] = useState("");
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
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

  const wholesaleDiscount = selectedCustomer?.tier === "Wholesale"
    ? (selectedCustomer.wholesale_discount_percent ?? 20)
    : 0;

  const availablePoints = selectedCustomer?.points ?? 0;
  const maxRedeemable = Math.min(availablePoints, Math.floor(summary.total));
  const effectivePointsRedeemed = Math.min(pointsToRedeem, maxRedeemable, Math.floor(summary.total));
  const pointsDiscountAmount = effectivePointsRedeemed;
  const grandTotal = Math.max(0, summary.total - pointsDiscountAmount);
  const pointsToAdd = Math.floor(grandTotal / 100);
  const balanceAfterPurchase = availablePoints - effectivePointsRedeemed + pointsToAdd;

  const fetchCustomers = useCallback(async () => {
    const q = customerSearch.trim();
    if (!q || q.length < 2) {
      setCustomerResults([]);
      return;
    }
    setCustomerSearching(true);
    try {
      const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCustomerResults(Array.isArray(data) ? data : []);
    } catch {
      setCustomerResults([]);
    } finally {
      setCustomerSearching(false);
    }
  }, [customerSearch]);

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(), 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  useEffect(() => {
    fetch("/api/admin/promotions?status=active")
      .then((r) => r.ok ? r.json() : [])
      .then((list: unknown[]) => {
        setPromotions(
          (Array.isArray(list) ? list : []).map((p) => ({
            id: typeof p.id === "string" ? parseInt(p.id, 10) : Number(p.id ?? 0),
            name: String(p.name ?? ""),
            type: (p.type ?? "DISCOUNT") as PromotionRule["type"],
            description: p.description ?? null,
            conditions: (p.conditions ?? null) as PromotionRule["conditions"],
            discount_value: p.discount_value != null ? Number(p.discount_value) : null,
          }))
        );
      })
      .catch(() => setPromotions([]));
  }, []);

  const productIdToBreeder = useMemo(() => {
    const m = new Map<number, number>();
    products.forEach((p) => {
      const bid = (p as ProductWithBreeder).breeder_id;
      if (bid != null) m.set(p.id, bid);
    });
    return m;
  }, [products]);

  const promoResult = useMemo(
    () => applyPromotions(items, promotions, productIdToBreeder),
    [items, promotions, productIdToBreeder]
  );
  const { promotionDiscount, activePromotion, buyXGetYAlert, freebieAlert } = promoResult;
  const hasPromotionDiscount = summary.tierDiscount > 0;

  useEffect(() => {
    if (hasPromotionDiscount && promo.code) clearPromoCode();
  }, [hasPromotionDiscount, promo.code, clearPromoCode]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setCustomerSearchOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const selectCustomer = (c: PosCustomer | null) => {
    setPointsToRedeem(0);
    const prevTier = selectedCustomer?.tier;
    const prevDiscount = selectedCustomer?.wholesale_discount_percent ?? 0;
    const newTier = c?.tier;
    const newDiscount = c?.wholesale_discount_percent ?? 0;
    const wasWholesale = prevTier === "Wholesale";
    const isWholesale = newTier === "Wholesale";
    const mustClear = wasWholesale && (!isWholesale || prevDiscount !== newDiscount);
    setSelectedCustomer(c);
    setCustomerSearchOpen(false);
    setCustomerSearch("");
    setCustomerResults([]);
    if (c) {
      if (mustClear && items.length > 0) clearCart();
      setCustomer((prev) => ({ ...prev, full_name: c.name, phone: c.phone, address: c.address ?? "" }));
      if (isWholesale && newDiscount > 0) {
        applyWholesaleToItems(newDiscount);
      }
    } else {
      clearCart();
      setCustomer((prev) => ({ ...prev, full_name: "", phone: "", address: "" }));
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddForm.name.trim() || !quickAddForm.phone.trim()) return;
    setQuickAddSaving(true);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickAddForm.name.trim(),
          phone: quickAddForm.phone.trim(),
          tier: "Retail",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "สร้างไม่สำเร็จ");
      selectCustomer({
        id: String(j.id),
        name: j.name,
        phone: j.phone,
        tier: "Retail",
        points: 0,
      });
      setQuickAddOpen(false);
      setQuickAddForm({ name: "", phone: "" });
    } catch (e) {
      console.error(e);
      toast({
        title: "เกิดข้อผิดพลาด (Error)",
        description: toastErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setQuickAddSaving(false);
    }
  };

  // Breeders from products (unique, sorted)
  const breeders = useMemo(() => {
    const map = new Map<number, string>();
    products.forEach((p) => {
      const b = (p as ProductWithBreeder).breeders;
      if (b?.id && b?.name) map.set(b.id, b.name);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ id, name }));
  }, [products]);


  // Client-side filtering: search (strain_name, master_sku, breeder_name), breeder, seed type (case-insensitive)
  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const prod = p as ProductWithBreeder;
      const breederName = prod.breeders?.name ?? "";
      const masterSku = (prod as { master_sku?: string | null }).master_sku ?? "";
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        masterSku.toLowerCase().includes(q) ||
        breederName.toLowerCase().includes(q);
      const matchesBreeder =
        breederFilter === "all" || String(prod.breeder_id) === breederFilter;
      const ft = (prod.flowering_type ?? "").toLowerCase();
      const cat = ((prod as { category?: string | null }).category ?? "").toLowerCase();
      const matchesSeedType =
        seedTypeFilter === "all" ||
        (seedTypeFilter === "auto" && (ft.includes("auto") || cat.includes("auto"))) ||
        (seedTypeFilter === "photo" && (ft.includes("photo") || cat.includes("photo")));
      const sd = ((prod as { strain_dominance?: string | null }).strain_dominance ?? "").toLowerCase();
      const matchesDominance =
        dominanceFilter === "all" ||
        (dominanceFilter === "indica" && sd.includes("indica")) ||
        (dominanceFilter === "sativa" && sd.includes("sativa")) ||
        (dominanceFilter === "hybrid" && sd.includes("hybrid"));
      return matchesSearch && matchesBreeder && matchesSeedType && matchesDominance;
    });
  }, [products, search, breederFilter, seedTypeFilter, dominanceFilter]);

  // ── Submit Manual Order (uses /api/admin/orders/simple with Prisma + stock deduction) ──
  const handleSubmit = async () => {
    const paidItems = items.filter((i) => !i.isFreeGift);
    if (paidItems.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/admin/orders/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            productName: i.productName,
            unitLabel: i.unitLabel,
            quantity: i.quantity,
            price: i.price,
          })),
          status: "COMPLETED",
          totalAmount: grandTotal,
          points_redeemed: effectivePointsRedeemed,
          points_discount_amount: pointsDiscountAmount,
          promotion_rule_id: hasPromotionDiscount ? (activePromotion?.id ?? null) : null,
          promotion_discount_amount: summary.tierDiscount,
          customer_profile_id: selectedCustomer ? Number(selectedCustomer.id) : null,
          customer: {
            full_name: customer.full_name,
            phone: customer.phone,
            address: customer.address,
            payment_method: customer.payment_method,
            note: customer.note,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "สร้างออเดอร์ไม่สำเร็จ");
      }

      const result = await res.json();
      setSubmitSuccess(`✅ สร้างออเดอร์ #${result.orderNumber} สำเร็จ (หักสต็อกแล้ว)`);
      clearCart();
      setSelectedCustomer(null);
      setPointsToRedeem(0);
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
              {/* Breeder filter — horizontal scroll */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setBreederFilter("all")}
                  className={cn(
                    "shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    breederFilter === "all"
                      ? "border-primary bg-primary text-white"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-primary/30"
                  )}
                >
                  ทั้งหมด
                </button>
                {breeders.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBreederFilter(String(b.id))}
                    className={cn(
                      "shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      breederFilter === String(b.id)
                        ? "border-primary bg-primary text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-primary/30"
                    )}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              {/* Seed Type filter — Button Group */}
              <div className="flex gap-2">
                {[
                  { value: "all", label: "ทั้งหมด" },
                  { value: "auto", label: "Autoflower" },
                  { value: "photo", label: "Photoperiod" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeedTypeFilter(opt.value)}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      seedTypeFilter === opt.value
                        ? "border-primary bg-primary text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-primary/30"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Dominance filter — ประเภทพันธุกรรม */}
              <div className="flex gap-2">
                {[
                  { value: "all", label: "Dominance: ทั้งหมด" },
                  { value: "indica", label: "Indica" },
                  { value: "sativa", label: "Sativa" },
                  { value: "hybrid", label: "Hybrid" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDominanceFilter(opt.value)}
                    className={cn(
                      "shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      dominanceFilter === opt.value
                        ? "border-primary bg-primary text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-primary/30"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="ค้นหา strain, SKU, breeder..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto">
                {loadingProducts ? (
                  <p className="py-4 text-center text-sm text-zinc-400">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </p>
                ) : filteredProducts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-zinc-400">ไม่พบสินค้า</p>
                ) : (
                  filteredProducts.map((product) => {
                    const prod = product as ProductWithBreederMaybeVariants;
                    const breederName = prod.breeders?.name ?? "";
                    const variants =
                      prod.product_variants?.filter(
                        (v) => v.is_active !== false && (v.stock ?? 0) > 0
                      ) ?? [];
                    if (variants.length === 0) return null;
                    return (
                      <div
                        key={product.id}
                        className="rounded-lg border border-zinc-200 overflow-hidden"
                      >
                        <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-zinc-200 bg-white">
                            {(() => {
                              const p = product as { image_urls?: string[]; image_url?: string | null };
                              const src = Array.isArray(p.image_urls) && p.image_urls[0] ? p.image_urls[0] : p.image_url ?? null;
                              return src ? (
                                <Image src={src} alt="" width={40} height={40} className="h-10 w-10 object-cover" unoptimized={!src.includes("supabase.co")} />
                              ) : (
                                <div className="h-10 w-10 bg-zinc-100" />
                              );
                            })()}
                          </div>
                          <div className="min-w-0 flex-1">
                            {breederName && (
                              <span className="text-xs font-medium text-zinc-500">
                                {breederName}
                              </span>
                            )}
                            <p className="text-sm font-semibold text-zinc-800">{product.name}</p>
                          </div>
                        </div>
                        <div className="divide-y divide-zinc-100">
                          {variants.map((variant) => {
                            const retailPrice = Number(variant.price);
                            const price = wholesaleDiscount > 0
                              ? applyWholesalePrice(retailPrice, wholesaleDiscount)
                              : retailPrice;
                            return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() =>
                                addToCart({
                                  variantId: variant.id,
                                  productId: product.id,
                                  productName: product.name,
                                  productImage: product.image_url,
                                  unitLabel: variant.unit_label,
                                  price,
                                  quantity: 1,
                                  masterSku: (product as { master_sku?: string | null }).master_sku ?? null,
                                  breeder_id: (prod as ProductWithBreeder).breeder_id ?? null,
                                })
                              }
                              className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-accent"
                            >
                              <span className="text-sm text-zinc-700">
                                {variant.unit_label} · เหลือ {variant.stock}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-primary">
                                  {formatPrice(price)}
                                </span>
                                <Plus className="h-4 w-4 text-primary" />
                              </div>
                            </button>
                          );
                          })}
                        </div>
                      </div>
                    );
                  })
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
              {/* Customer Selector */}
              <div className="space-y-1.5" ref={customerSearchRef}>
                <Label className="text-xs">เลือกลูกค้า</Label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/25 bg-accent px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{selectedCustomer.name}</p>
                      <p className="text-xs text-zinc-500">{selectedCustomer.phone}</p>
                      <Badge variant="outline" className="mt-0.5 text-[10px]">
                        {selectedCustomer.tier}
                        {selectedCustomer.tier === "Wholesale" && ` -${selectedCustomer.wholesale_discount_percent ?? 20}%`}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => selectCustomer(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      placeholder="ค้นหาชื่อ/เบอร์โทร..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setCustomerSearchOpen(true);
                      }}
                      onFocus={() => setCustomerSearchOpen(true)}
                      className="h-9 pl-8 pr-16"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                      onClick={() => setQuickAddOpen(true)}
                      title="เพิ่มลูกค้าใหม่"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    {selectedCustomer && items.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-zinc-500">คะแนนคงเหลือ: <span className="font-medium text-zinc-700">{availablePoints}</span> คะแนน</p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={maxRedeemable}
                            value={pointsToRedeem || ""}
                            onChange={(e) => {
                              const v = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                              setPointsToRedeem(Math.min(v, maxRedeemable));
                            }}
                            placeholder="ใช้คะแนน"
                            className="h-8 text-sm w-24"
                            disabled={availablePoints === 0}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => setPointsToRedeem(maxRedeemable)}
                            disabled={availablePoints === 0}
                          >
                            ใช้ทั้งหมด
                          </Button>
                          {pointsToRedeem > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-zinc-500"
                              onClick={() => setPointsToRedeem(0)}
                            >
                              ล้าง
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    {customerSearchOpen && (customerSearch.length >= 2 || customerResults.length > 0) && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
                        {customerSearching ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                          </div>
                        ) : customerResults.length === 0 ? (
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm text-zinc-500">ไม่พบลูกค้า</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setQuickAddOpen(true)}>
                              + เพิ่มใหม่
                            </Button>
                          </div>
                        ) : (
                          customerResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-zinc-50"
                              onClick={() => selectCustomer(c)}
                            >
                              <div>
                                <p className="text-sm font-medium">{c.name}</p>
                                <p className="text-xs text-zinc-500">{c.phone}</p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">{c.tier}</Badge>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Separator />
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
                      <span className="w-24 text-right text-sm font-medium">
                        {item.isFreeGift ? "ฟรี" : wholesaleDiscount > 0 ? (
                          <span className="flex flex-col items-end gap-0">
                            <span className="text-zinc-400 line-through text-xs">
                              {formatPrice(Math.round((item.price * item.quantity) / (1 - wholesaleDiscount / 100)))}
                            </span>
                            <span className="text-primary font-semibold">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </span>
                        ) : (
                          formatPrice(item.price * item.quantity)
                        )}
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

              {/* Promo Code — disabled when Promotion (tiered) is active */}
              <div className="flex flex-col gap-1.5">
                {hasPromotionDiscount && (
                  <p className="text-xs text-amber-600">โปรโมชั่นอัตโนมัติใช้งานอยู่ — ไม่สามารถใช้โค้ดได้</p>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="โค้ดส่วนลด"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="text-sm"
                    disabled={!!promo.code || hasPromotionDiscount}
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
                      disabled={isValidatingPromo || !promoInput || hasPromotionDiscount}
                    >
                    {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "ใช้"}
                  </Button>
                )}
                </div>
              </div>
              {promo.code && (
                <p className="text-xs text-primary">✅ {promo.code.code} — ลด {formatPrice(promo.discountAmount)}</p>
              )}
              {promo.error && <p className="text-xs text-red-500">{promo.error}</p>}

              {/* Promotion Alerts */}
              {buyXGetYAlert && (
                <div className="rounded-lg bg-accent px-3 py-2 text-xs text-primary flex items-center gap-2">
                  <Gift className="h-4 w-4 shrink-0" />
                  <span>Freebies Earned: {buyXGetYAlert.name} — ได้รับฟรี {buyXGetYAlert.getQty} ชิ้น</span>
                </div>
              )}
              {freebieAlert && (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                  <Gift className="h-4 w-4 shrink-0" />
                  <span>Gift Eligible: {freebieAlert.description}</span>
                </div>
              )}

              {/* Upsell Message */}
              {summary.upsellMessage && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  💡 {summary.upsellMessage}
                </p>
              )}

              <Separator />

              {/* Summary Rows */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-zinc-600 items-center gap-2">
                  <span>ยอดรวม</span>
                  <span className="flex items-center gap-1">
                    {formatPrice(summary.subtotal)}
                    {activePromotion && (
                      <Badge className="bg-primary text-white text-[10px]">โปรโมชั่น</Badge>
                    )}
                  </span>
                </div>
                {summary.tierDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>ส่วนลดโปรโมชั่น {summary.appliedTier ? `(${summary.appliedTier.discount_percentage}%)` : summary.discountPercent > 0 ? `(${summary.discountPercent}%)` : ""}</span>
                    <span>-{formatPrice(summary.tierDiscount)}</span>
                  </div>
                )}
                {summary.promoDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>ส่วนลดโค้ด</span>
                    <span>-{formatPrice(summary.promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-600">
                  <span>ค่าส่ง</span>
                  <span>{summary.shipping === 0 ? "ฟรี" : formatPrice(summary.shipping)}</span>
                </div>
                {pointsDiscountAmount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>ส่วนลดคะแนน ({effectivePointsRedeemed} คะแนน)</span>
                    <span>-{formatPrice(pointsDiscountAmount)}</span>
                  </div>
                )}
                {pointsDiscountAmount > 0 && (
                  <p className="text-xs text-zinc-500">คงเหลือหลังซื้อ: {balanceAfterPurchase} คะแนน</p>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold text-zinc-900">
                  <span>ยอดสุทธิ</span>
                  <span className="text-primary">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Submit */}
              {submitSuccess && (
                <p className="rounded-lg bg-accent px-3 py-2 text-sm text-primary">{submitSuccess}</p>
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
                  <>ยืนยันออเดอร์ · {formatPrice(grandTotal)}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ชื่อ *</Label>
              <Input
                value={quickAddForm.name}
                onChange={(e) => setQuickAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ชื่อลูกค้า"
              />
            </div>
            <div className="space-y-2">
              <Label>เบอร์โทร *</Label>
              <Input
                value={quickAddForm.phone}
                onChange={(e) => setQuickAddForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="08xxxxxxxx"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAddOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleQuickAdd} disabled={quickAddSaving || !quickAddForm.name.trim() || !quickAddForm.phone.trim()}>
              {quickAddSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              เพิ่มและเลือก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
