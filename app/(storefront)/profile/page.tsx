"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User, MapPin, Phone, Mail, ChevronRight,
  Loader2, LogOut, Check, X, Leaf, ShoppingBag,
  Truck, Copy, BadgeCheck, Save,
  Link2, Link2Off, FileText,
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
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { OrderDetailDrawer, type OrderDetailRow } from "@/components/storefront/OrderDetailDrawer";
import { CouponCard } from "@/components/storefront/FloatingOfferButton";
import type { EligibleCoupon } from "@/components/storefront/FloatingOfferButton";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { GenomeCirclePanel } from "@/components/storefront/GenomeCirclePanel";
import { MemberCoupons } from "@/components/storefront/profile/MemberCoupons";
import { canViewMembershipProgram } from "@/lib/feature-flags";
import { orderIsPaymentReceived } from "@/lib/order-paid";

type ProfileTab = "orders" | "membership" | "coupons" | "profile";

const serif = "font-sans";
const mono = "font-[family-name:var(--font-journal-product-mono)] tabular-nums";
const navMono =
  "font-[family-name:var(--font-journal-product-mono)] text-[10px] font-medium uppercase tracking-widest";

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
            t.type === "success" ? "bg-primary text-white" : "bg-red-600 text-white")}>
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
  payment_status: string;
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

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; cls: string }> = {
  PENDING: { label: "รอดำเนินการ", labelEn: "Pending", cls: "bg-zinc-100 text-zinc-600" },
  AWAITING_VERIFICATION: { label: "รอตรวจสอบสลิป", labelEn: "Verifying", cls: "bg-zinc-100 text-zinc-600" },
  PAID: { label: "ชำระแล้ว", labelEn: "Paid", cls: "bg-emerald-50 text-emerald-800" },
  COMPLETED: { label: "เสร็จสมบูรณ์", labelEn: "Completed", cls: "bg-emerald-50 text-emerald-800" },
  SHIPPED: { label: "จัดส่งแล้ว", labelEn: "Shipped", cls: "bg-zinc-100 text-zinc-700" },
  DELIVERED: { label: "ส่งถึงแล้ว", labelEn: "Delivered", cls: "bg-emerald-50 text-emerald-800" },
  CANCELLED: { label: "ยกเลิกแล้ว", labelEn: "Cancelled", cls: "bg-zinc-100 text-zinc-500" },
  VOIDED: { label: "ยกเลิก·คืนสต็อก", labelEn: "Voided", cls: "bg-zinc-100 text-zinc-600" },
};

function StatusBadge({
  status,
  paymentStatus,
  locale,
}: {
  status: string;
  paymentStatus?: string;
  locale: string;
}) {
  const ps = (paymentStatus ?? "").toLowerCase();
  const key =
    status === "PENDING" && ps === "paid" ? "PAID" : status;
  const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        cfg.cls
      )}
    >
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
  const isAdminUser = user?.user_metadata?.role === "ADMIN";
  const showMembershipProgram = canViewMembershipProgram(isAdminUser);
  const initialTab: ProfileTab = (() => {
    if (tabParam === "membership" && !showMembershipProgram) return "orders";
    if (
      tabParam === "profile" ||
      tabParam === "orders" ||
      tabParam === "coupons" ||
      tabParam === "membership"
    ) {
      return tabParam;
    }
    return "orders";
  })();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const pushToast = useCallback((msg: string, type: "success" | "error") => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  // Sync tab when URL ?tab= changes (e.g. from /account?tab=profile redirect)
  useEffect(() => {
    const p = searchParams.get("tab");
    const admin = user?.user_metadata?.role === "ADMIN";
    const showM = canViewMembershipProgram(!!admin);
    if (p === "profile" || p === "orders" || p === "coupons") setTab(p);
    if (p === "membership" && showM) setTab("membership");
  }, [searchParams, user]);

  useEffect(() => {
    if (!showMembershipProgram && tab === "membership") setTab("orders");
  }, [showMembershipProgram, tab]);

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
  const [collectedCoupons, setCollectedCoupons] = useState<(EligibleCoupon & { used?: boolean })[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

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

  const fetchCollectedCoupons = useCallback(async () => {
    if (!user) return;
    setCouponsLoading(true);
    try {
      const res = await fetch("/api/storefront/coupons/collected", { cache: "no-store" });
      if (res.ok) {
        const j = (await res.json()) as { coupons: (EligibleCoupon & { used?: boolean })[] };
        setCollectedCoupons(j.coupons ?? []);
      }
    } finally {
      setCouponsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && tab === "coupons") void fetchCollectedCoupons();
  }, [user, tab, fetchCollectedCoupons]);

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
    <div className={`min-h-screen bg-white pt-20 ${JOURNAL_PRODUCT_FONT_VARS}`}>
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
            className="gap-1.5 rounded-sm border-zinc-200 text-zinc-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("ออกจากระบบ", "Sign Out")}
          </Button>
        </div>

        {/* Tabs */}
        <div
          className={cn(
            "mb-4 grid gap-px overflow-hidden rounded-sm border border-zinc-200 bg-zinc-200",
            showMembershipProgram ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
          )}
        >
          {(
            [
              ["orders", t("ประวัติออเดอร์", "Orders")] as const,
              ...(showMembershipProgram
                ? [["membership", t("วงจีโนม", "Genome")] as const]
                : []),
              ["coupons", t("คูปอง", "Coupons")] as const,
              ["profile", t("โปรไฟล์", "Profile")] as const,
            ] as const
          ).map(([tb, label]) => (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              className={cn(
                navMono,
                "flex min-h-[2.75rem] items-center justify-center px-1 py-2.5 text-center transition-colors sm:min-h-0 sm:py-3.5",
                tab === tb
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── GENOME CIRCLE (MEMBERSHIP) — gated by feature flag or admin preview ── */}
        {showMembershipProgram && tab === "membership" && user ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <GenomeCirclePanel
              orders={orders}
              isWholesale={!!customer?.is_wholesale}
              userId={user.id}
              t={t}
            />
          </motion.div>
        ) : null}

        {/* ── ORDERS TAB ──────────────────────────────────────────────────────── */}
        {tab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {ordersLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-sm border border-dashed border-zinc-200 py-16 text-center">
                <ShoppingBag className="h-10 w-10 text-zinc-200" strokeWidth={1} />
                <p className={cn(serif, "text-lg font-medium text-zinc-800")}>
                  {t("ยังไม่มีออเดอร์", "No orders yet")}
                </p>
                <Button asChild variant="outline" className="rounded-sm border-zinc-200 tracking-wide">
                  <Link href="/shop">{t("สำรวจสายพันธุ์", "Explore genetics")}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const firstItem = order.order_items?.[0];
                  const itemCount = order.order_items?.length ?? 0;
                  const img = firstItem?.product_variants?.products?.image_url;
                  const itemName = firstItem?.product_variants?.products?.name ?? "สินค้า";
                  const showReceiptBtn = orderIsPaymentReceived(
                    order.status,
                    order.payment_status
                  );
                  return (
                    <motion.button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrder(order as OrderDetailRow)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full overflow-hidden rounded-sm border border-zinc-100 bg-white text-left shadow-sm transition-transform active:scale-[.99]"
                    >
                      <div className="flex items-start gap-4 p-4">
                        {/* Item image */}
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
                          {img ? (
                            <Image
                              src={img}
                              alt={itemName}
                              fill
                              className="object-cover"
                              unoptimized={shouldOffloadImageOptimization(img)}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Leaf className="h-5 w-5 text-zinc-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn(mono, "text-sm font-medium text-zinc-900")}>
                                #{order.order_number}
                              </p>
                              <p className={cn(serif, "mt-0.5 text-xs font-medium text-zinc-700")}>
                                {itemName}{itemCount > 1 ? ` +${itemCount - 1} ${t("รายการ", "more")}` : ""}
                              </p>
                              <p className={cn(mono, "mt-0.5 text-[11px] text-zinc-500")}>
                                {new Date(order.created_at).toLocaleDateString(
                                  locale === "th" ? "th-TH" : "en-US",
                                  { year: "numeric", month: "short", day: "numeric" }
                                )}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <StatusBadge
                                  status={order.status}
                                  paymentStatus={order.payment_status}
                                  locale={locale}
                                />
                                {showReceiptBtn ? (
                                  <a
                                    href={`/api/storefront/orders/${encodeURIComponent(order.order_number)}/receipt`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-700 hover:bg-white"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    {locale === "en" ? "Receipt" : "ใบเสร็จ"}
                                  </a>
                                ) : null}
                              </div>
                              <p className={cn(mono, "text-sm font-semibold text-emerald-900")}>
                                {formatPrice(order.total_amount)}
                              </p>
                            </div>
                          </div>

                          {/* Tracking */}
                          {order.tracking_number && (
                            <div className="mt-2.5 flex items-center gap-2 rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
                              <Truck className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.25} />
                              <div className="min-w-0 flex-1">
                                <p className={cn(navMono, "text-[9px] text-zinc-500")}>{t("เลขพัสดุ", "Tracking")}</p>
                                <p className={cn(mono, "text-sm font-medium text-zinc-800")}>{order.tracking_number}</p>
                              </div>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); copyTracking(order.tracking_number!); }}
                                onKeyDown={(e) => e.key === "Enter" && copyTracking(order.tracking_number!)}
                                className="text-primary hover:text-primary cursor-pointer"
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

        {/* ── MY COUPONS TAB (collected codes only) ───────────────────────────── */}
        {tab === "coupons" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="space-y-8">
              <MemberCoupons locale={locale} t={t} mono={mono} serif={serif} />

              <div className="space-y-4">
                <div className="border-b border-zinc-100 pb-2">
                  <h3 className={cn(serif, "text-sm font-medium text-zinc-800")}>
                    {t("โค้ดจากปุ่มส่วนลด", "Collected from offer button")}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">{t("เลือกจากคูปองลอยมุมขวาล่างของร้าน", "From the floating coupon on the storefront")}</p>
                </div>
                {couponsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : collectedCoupons.length === 0 ? (
                  <p className="text-center text-xs text-zinc-400">
                    {t(
                      "ยังไม่มีโค้ดในส่วนนี้ — กด «เก็บโค้ด» จากปุ่มส่วนลดมุมขวาล่างเมื่อมีโค้ด",
                      "Nothing here yet — tap “Collect code” on the bottom-right discount button when offers appear.",
                    )}
                  </p>
                ) : (
                  (() => {
                    const available = collectedCoupons.filter((c) => !c.used);
                    const used = collectedCoupons.filter((c) => c.used);
                    return (
                      <div className="space-y-6">
                        {available.length > 0 && (
                          <div className="space-y-2">
                            <p className={cn(serif, "mb-1 text-xs text-zinc-500")}>
                              {t("ใช้ได้", "Available")}
                            </p>
                            {available.map((c) => (
                              <CouponCard
                                key={c.id}
                                coupon={c}
                                showCollect={false}
                                collected={false}
                                collecting={false}
                              />
                            ))}
                          </div>
                        )}
                        {used.length > 0 && (
                          <div className="space-y-2">
                            <p className={cn(serif, "mb-1 text-xs text-zinc-400")}>
                              {t("ใช้แล้ว / หมดอายุ", "Used / Expired")}
                            </p>
                            {used.map((c) => (
                              <CouponCard
                                key={c.id}
                                coupon={c}
                                showCollect={false}
                                collected={false}
                                collecting={false}
                                used
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PROFILE TAB ─────────────────────────────────────────────────────── */}
        {tab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="overflow-hidden rounded-sm border border-zinc-100 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className={cn(serif, "text-lg font-medium text-zinc-900")}>
                  {t("ข้อมูลส่วนตัว", "Personal Information")}
                </h2>
                <p className="mt-0.5 text-xs font-light text-zinc-500">
                  {t("แก้ไขข้อมูลแล้วกดบันทึก", "Edit your info then tap Save")}
                </p>
              </div>

              <div className="space-y-5 p-5">
                {/* Email (read-only) */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-light text-zinc-600">
                    <Mail className="h-3.5 w-3.5" strokeWidth={1.25} />
                    {t("อีเมล", "Email")}
                  </Label>
                  <div className="flex min-h-[48px] items-center rounded-sm border border-zinc-200 bg-white px-4 text-sm font-normal text-zinc-600">
                    {user.email}
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="full_name"
                    className="flex items-center gap-1.5 text-xs font-light text-zinc-600"
                  >
                    <User className="h-3.5 w-3.5" strokeWidth={1.25} />
                    {t("ชื่อ-นามสกุล", "Full Name")}
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder={t("ชื่อ-นามสกุล", "Full name")}
                    className="min-h-[48px] rounded-sm border-zinc-200 bg-white text-sm"
                  />
                </div>

                {/* Phone — type="tel" triggers numeric keypad on mobile */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="phone"
                    className="flex items-center gap-1.5 text-xs font-light text-zinc-600"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.25} />
                    {t("เบอร์โทรศัพท์", "Phone")}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="08x-xxx-xxxx"
                    className="min-h-[48px] rounded-sm border-zinc-200 bg-white text-sm"
                  />
                </div>

                {/* Address — scroll target from /profile#address */}
                <div id="address" className="scroll-mt-24 space-y-1.5">
                  <Label
                    htmlFor="address"
                    className="flex items-center gap-1.5 text-xs font-light text-zinc-600"
                  >
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.25} />
                    {t("ที่อยู่จัดส่ง", "Shipping Address")}
                  </Label>
                  <Textarea
                    id="address"
                    autoComplete="street-address"
                    value={editForm.address}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder={t("บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์", "House no., Street, District, Province, Zip")}
                    rows={4}
                    className="resize-none rounded-sm border-zinc-200 bg-white text-sm leading-relaxed"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={() => void handleSaveProfile()}
                  disabled={saving}
                  className="h-12 w-full gap-2 rounded-sm bg-emerald-800 text-base font-semibold tracking-wide text-white shadow-none hover:bg-emerald-900 active:scale-[.98]"
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
            <div className="overflow-hidden rounded-sm border border-zinc-100 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className={cn(serif, "text-lg font-medium text-zinc-900")}>
                  {t("การเชื่อมต่อบัญชี", "Social Connections")}
                </h2>
                <p className="mt-0.5 text-xs font-light text-zinc-500">
                  {t("เชื่อมต่อ LINE เพื่อรับแจ้งเตือนการจัดส่งพัสดุ", "Connect LINE to receive shipping notifications")}
                </p>
              </div>

              <div className="p-5">
                {customer?.line_user_id ? (
                  /* ── Connected state ── */
                  <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-accent px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {/* Official LINE icon (SVG) */}
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ background: "#06C755" }}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          {t("เชื่อมต่อ LINE แล้ว", "LINE Connected")}
                        </p>
                        <p className="text-xs text-primary">
                          {t("รับแจ้งเตือนการจัดส่งผ่าน LINE", "Shipping alerts active")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
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
            <div className="overflow-hidden rounded-sm border border-zinc-100 bg-white shadow-sm">
              {[
                { href: "/shop", label: t("เลือกซื้อสินค้า", "Browse Products"), icon: ShoppingBag },
                { href: "/breeders", label: t("ดูข้อมูล Breeder", "Explore Breeders"), icon: Leaf },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-5 py-3.5 text-sm font-light text-zinc-700 hover:bg-zinc-50 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-zinc-100"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-zinc-400" strokeWidth={1.25} />
                    {label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-300" strokeWidth={1.25} />
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
