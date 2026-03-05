"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User, Package, MapPin, Phone, Mail, ChevronRight,
  Loader2, LogOut, Check, X, Leaf, ShoppingBag,
  Truck, Clock, CheckCircle2, XCircle, Copy, Tag, BadgeCheck, Save,
  Link2, Link2Off,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import type { Customer } from "@/types/supabase";
import { OrderDetailDrawer, type OrderDetailRow } from "@/components/storefront/OrderDetailDrawer";

// ─── Toast ─────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; msg: string; type: "success" | "error" }
let _tid = 0;
function ToastStack({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
      {toasts.map((t) => (
        <button key={t.id} type="button" onClick={() => onDismiss(t.id)}
          className={cn("flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
            t.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}>
          {t.type === "success" ? <BadgeCheck className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {t.msg}
        </button>
      ))}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderRow = {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  payment_method: string;
  tracking_number: string | null;
  shipping_provider: string | null;
  shipping_address: string | null;
  created_at: string;
  order_items: {
    id: number;
    quantity: number;
    unit_price: number;
    product_variants: {
      unit_label: string;
      flowering_type: string | null;
      breeder_name: string | null;
      products: { id: number; name: string; image_url: string | null };
    } | null;
  }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; icon: React.ComponentType<{className?:string}>; cls: string }> = {
  PENDING:  { label: "รอดำเนินการ",  labelEn: "Pending",   icon: Clock,         cls: "bg-amber-100 text-amber-700" },
  PAID:     { label: "ชำระแล้ว",     labelEn: "Paid",      icon: CheckCircle2,  cls: "bg-blue-100 text-blue-700" },
  SHIPPED:  { label: "จัดส่งแล้ว",   labelEn: "Shipped",   icon: Truck,         cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED:{ label: "ยกเลิก",       labelEn: "Cancelled", icon: XCircle,       cls: "bg-red-100 text-red-600" },
};

function StatusBadge({ status, locale }: { status: string; locale: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {locale === "en" ? cfg.labelEn : cfg.label}
    </span>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, customer, isLoading: authLoading, signOut } = useAuth();
  const { locale, t } = useLanguage();

  const tabParam = searchParams.get("tab");
  const initialTab: "orders" | "profile" | "coupons" =
    tabParam === "profile" || tabParam === "orders" || tabParam === "coupons"
      ? tabParam
      : "orders";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [tab, setTab] = useState<"orders" | "profile" | "coupons">(initialTab);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const pushToast = useCallback((msg: string, type: "success" | "error") => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  // Sync tab when URL ?tab= changes (e.g. from /account?tab=profile redirect)
  useEffect(() => {
    const p = searchParams.get("tab");
    if (p === "profile" || p === "orders" || p === "coupons") setTab(p);
  }, [searchParams]);

  // Handle LINE OAuth callback result (?line_connected=1 or ?line_error=...)
  useEffect(() => {
    const connected = searchParams.get("line_connected");
    const lineName = searchParams.get("line_name");
    const lineError = searchParams.get("line_error");
    if (connected === "1") {
      const nameStr = lineName ? ` (${lineName})` : "";
      pushToast(`เชื่อมต่อ LINE สำเร็จ${nameStr} ✓ คุณจะรับแจ้งเตือนการจัดส่งผ่าน LINE`, "success");
      // Clean up URL params without re-render loop
      const url = new URL(window.location.href);
      url.searchParams.delete("line_connected");
      url.searchParams.delete("line_name");
      window.history.replaceState({}, "", url.toString());
    } else if (lineError) {
      pushToast(decodeURIComponent(lineError), "error");
      const url = new URL(window.location.href);
      url.searchParams.delete("line_error");
      window.history.replaceState({}, "", url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to address when landing on /profile#address (e.g. from Welcome modal)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#address") {
      setTab("profile");
      const timer = setTimeout(() => {
        document.getElementById("address")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", address: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailRow | null>(null);

  // Pre-fill form when customer loads
  useEffect(() => {
    if (customer) {
      setEditForm({
        full_name: customer.full_name ?? "",
        phone: customer.phone ?? "",
        address: customer.address ?? "",
      });
    }
  }, [customer]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/storefront/profile/orders");
      if (res.ok) {
        const json = await res.json() as { orders: OrderRow[] };
        setOrders(json.orders ?? []);
      }
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void fetchOrders();
  }, [user, fetchOrders]);

  // Auto-open drawer for ?open={orderId} deep links (e.g. from email CTA)
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || orders.length === 0) return;
    const target = orders.find((o) => o.id === Number(openId));
    if (target) {
      setTab("orders");
      setSelectedOrder(target as OrderDetailRow);
      // Clean param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("open");
      window.history.replaceState({}, "", url.toString());
    }
  }, [orders, searchParams]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  const handleSaveProfile = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/storefront/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      pushToast(t("บันทึกข้อมูลสำเร็จ ✓", "Profile updated successfully ✓"), "success");
    } catch (err) {
      pushToast(String(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const copyTracking = (tracking: string) => {
    void navigator.clipboard.writeText(tracking);
    setCopied(tracking);
    setTimeout(() => setCopied(null), 2000);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const displayCustomer = customer as Customer | null;

  return (
    <div className="min-h-screen bg-zinc-50 pt-20">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
              {(displayCustomer?.full_name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-zinc-900">{displayCustomer?.full_name ?? t("ลูกค้า", "Customer")}</p>
              <p className="text-sm text-zinc-500">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { void signOut().then(() => router.push("/")); }}
            className="gap-1.5 text-zinc-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("ออกจากระบบ", "Sign Out")}
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {(["orders", "coupons", "profile"] as const).map((tb) => (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                tab === tb ? "bg-primary text-white" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tb === "orders" && <Package className="h-4 w-4" />}
              {tb === "coupons" && <Tag className="h-4 w-4" />}
              {tb === "profile" && <User className="h-4 w-4" />}
              {tb === "orders" ? t("ประวัติออเดอร์", "My Orders") : tb === "coupons" ? t("คูปองของฉัน", "My Coupons") : t("ข้อมูลส่วนตัว", "Profile")}
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ──────────────────────────────────────────────────────── */}
        {tab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {ordersLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-200 py-16 text-center">
                <ShoppingBag className="h-10 w-10 text-zinc-200" />
                <p className="text-sm font-medium text-zinc-500">{t("ยังไม่มีออเดอร์", "No orders yet")}</p>
                <Button asChild className="bg-primary text-white hover:bg-primary/90">
                  <Link href="/shop">{t("เริ่มช้อปปิ้ง", "Start Shopping")}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const firstItem = order.order_items?.[0];
                  const itemCount = order.order_items?.length ?? 0;
                  const img = firstItem?.product_variants?.products?.image_url;
                  const itemName = firstItem?.product_variants?.products?.name ?? "สินค้า";
                  return (
                    <motion.button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrder(order as OrderDetailRow)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm text-left active:scale-[.99] transition-transform"
                    >
                      <div className="flex items-start gap-4 p-4">
                        {/* Item image */}
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                          {img ? (
                            <Image src={img} alt={itemName} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Leaf className="h-5 w-5 text-zinc-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-zinc-900">#{order.order_number}</p>
                              <p className="mt-0.5 text-xs text-zinc-500">
                                {itemName}{itemCount > 1 ? ` +${itemCount - 1} ${t("รายการ", "more")}` : ""}
                              </p>
                              <p className="mt-0.5 text-xs text-zinc-400">
                                {new Date(order.created_at).toLocaleDateString(
                                  locale === "th" ? "th-TH" : "en-US",
                                  { year: "numeric", month: "short", day: "numeric" }
                                )}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <StatusBadge status={order.status} locale={locale} />
                              <p className="text-sm font-bold text-primary">{formatPrice(order.total_amount)}</p>
                            </div>
                          </div>

                          {/* Tracking */}
                          {order.tracking_number && (
                            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                              <Truck className="h-4 w-4 shrink-0 text-emerald-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">{t("เลขพัสดุ", "Tracking")}</p>
                                <p className="font-mono text-sm font-bold text-emerald-900">{order.tracking_number}</p>
                              </div>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); copyTracking(order.tracking_number!); }}
                                onKeyDown={(e) => e.key === "Enter" && copyTracking(order.tracking_number!)}
                                className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
                              >
                                {copied === order.tracking_number ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Tap hint */}
                      <div className="flex items-center justify-end gap-1 border-t border-zinc-50 px-4 py-2">
                        <span className="text-[11px] text-zinc-400">{t("แตะเพื่อดูรายละเอียด", "Tap for details")}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── MY COUPONS TAB ──────────────────────────────────────────────────── */}
        {tab === "coupons" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {orders.length === 0 ? (
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold uppercase tracking-wider text-primary">
                      {t("ลูกค้าใหม่", "New Customer")}
                    </span>
                  </div>
                  <p className="font-mono text-2xl font-extrabold tracking-wider text-zinc-900">WELCOME10</p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {t("ส่วนลด 10% สำหรับออเดอร์แรก", "10% off your first order")}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {t("ใช้ที่หน้า Checkout เมื่อพร้อมสั่งซื้อ", "Use at Checkout when you're ready to order")}
                  </p>
                  <Button asChild className="mt-4 bg-primary text-white hover:bg-primary/90">
                    <Link href="/checkout">{t("ไปชำระเงิน", "Go to Checkout")}</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-200 py-16 text-center">
                <Tag className="h-10 w-10 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-500">
                  {t("ไม่มีคูปองที่ใช้ได้ในขณะนี้", "No available coupons at the moment")}
                </p>
                <p className="text-xs text-zinc-400">
                  {t("คูปองพิเศษจะแสดงเมื่อมี", "Special coupons will appear here when available")}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── PROFILE TAB ─────────────────────────────────────────────────────── */}
        {tab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className="font-bold text-zinc-800">{t("ข้อมูลส่วนตัว", "Personal Information")}</h2>
                <p className="mt-0.5 text-xs text-zinc-400">{t("แก้ไขข้อมูลแล้วกดบันทึก", "Edit your info then tap Save")}</p>
              </div>

              <div className="space-y-5 p-5">
                {/* Email (read-only) */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                    <Mail className="h-3.5 w-3.5" />{t("อีเมล", "Email")}
                  </Label>
                  <div className="flex min-h-[48px] items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-500">
                    {user.email}
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                    <User className="h-3.5 w-3.5" />{t("ชื่อ-นามสกุล", "Full Name")}
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder={t("ชื่อ-นามสกุล", "Full name")}
                    className="min-h-[48px] rounded-xl text-sm"
                  />
                </div>

                {/* Phone — type="tel" triggers numeric keypad on mobile */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                    <Phone className="h-3.5 w-3.5" />{t("เบอร์โทรศัพท์", "Phone")}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="08x-xxx-xxxx"
                    className="min-h-[48px] rounded-xl text-sm"
                  />
                </div>

                {/* Address — scroll target from /profile#address */}
                <div id="address" className="scroll-mt-24 space-y-1.5">
                  <Label htmlFor="address" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />{t("ที่อยู่จัดส่ง", "Shipping Address")}
                  </Label>
                  <Textarea
                    id="address"
                    autoComplete="street-address"
                    value={editForm.address}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder={t("บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์", "House no., Street, District, Province, Zip")}
                    rows={4}
                    className="resize-none rounded-xl text-sm leading-relaxed"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={() => void handleSaveProfile()}
                  disabled={saving}
                  className="h-12 w-full gap-2 bg-primary text-base font-semibold text-white hover:bg-primary/90 active:scale-[.98]"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <><Save className="h-4 w-4" />{t("บันทึกข้อมูล", "Save Changes")}</>
                  )}
                </Button>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Social Connections */}
            <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className="font-bold text-zinc-800">{t("การเชื่อมต่อบัญชี", "Social Connections")}</h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {t("เชื่อมต่อ LINE เพื่อรับแจ้งเตือนการจัดส่งพัสดุ", "Connect LINE to receive shipping notifications")}
                </p>
              </div>

              <div className="p-5">
                {customer?.line_user_id ? (
                  /* ── Connected state ── */
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {/* Official LINE icon (SVG) */}
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ background: "#06C755" }}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">
                          {t("เชื่อมต่อ LINE แล้ว", "LINE Connected")}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {t("รับแจ้งเตือนการจัดส่งผ่าน LINE", "Shipping alerts active")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <Check className="h-3 w-3" />
                      {t("เชื่อมต่อแล้ว", "Active")}
                    </div>
                  </div>
                ) : (
                  /* ── Not connected state ── */
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: "#06C755" }}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.630 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.630 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-800">LINE</p>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          {t(
                            "เชื่อมต่อ LINE เพื่อรับแจ้งเตือนเมื่อพัสดุถูกจัดส่ง พร้อมเลขติดตามพัสดุในทันที",
                            "Get instant shipping alerts with tracking number directly on LINE"
                          )}
                        </p>
                      </div>
                    </div>

                    <a
                      href="/api/auth/line/connect"
                      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.98]"
                      style={{ background: "#06C755" }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.630 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.630 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                      </svg>
                      <Link2 className="h-4 w-4" />
                      {t("เชื่อมต่อ LINE", "Connect LINE")}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-5" />

            {/* Quick Links */}
            <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
              {[
                { href: "/shop", label: t("เลือกซื้อสินค้า", "Browse Products"), icon: ShoppingBag },
                { href: "/breeders", label: t("ดูข้อมูล Breeder", "Explore Breeders"), icon: Leaf },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-zinc-100"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-zinc-400" />
                    {label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-300" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        locale={locale}
      />
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
