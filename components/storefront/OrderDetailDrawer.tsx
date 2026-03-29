"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  X, Leaf, MapPin, Truck, Copy, Check,
  Clock, XCircle, Package, CreditCard,
  ShieldCheck, Hourglass, ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { cn, formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderDetailRow = {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  payment_method: string | null;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, {
  label: string; desc: string;
  icon: React.ComponentType<{ className?: string }>;
  cls: string; bg: string;
}> = {
  PENDING: {
    label: "รอดำเนินการ",
    desc: "ออเดอร์ได้รับแล้ว รอการยืนยันการชำระเงิน",
    icon: Clock, cls: "text-amber-700", bg: "bg-amber-50 border-amber-200",
  },
  AWAITING_VERIFICATION: {
    label: "รอตรวจสอบสลิป",
    desc: "เราได้รับสลิปของคุณแล้ว กำลังตรวจสอบอยู่ ใช้เวลาไม่นานครับ",
    icon: Hourglass, cls: "text-blue-700", bg: "bg-blue-50 border-blue-200",
  },
  PAID: {
    label: "ชำระเงินสำเร็จ",
    desc: "เราได้รับการชำระเงินแล้ว กำลังเตรียมแพ็คสินค้าให้คุณ 🌿",
    icon: ShieldCheck, cls: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",
  },
  SHIPPED: {
    label: "จัดส่งแล้ว",
    desc: "สินค้าถูกส่งออกไปแล้ว กำลังเดินทางมาหาคุณ 📦",
    icon: Truck, cls: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",
  },
  CANCELLED: {
    label: "ยกเลิกแล้ว",
    desc: "ออเดอร์นี้ถูกยกเลิก กรุณาติดต่อเราหากมีข้อสงสัย",
    icon: XCircle, cls: "text-red-600", bg: "bg-red-50 border-red-200",
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  TRANSFER: "โอนเงิน",
  COD: "COD (ชำระปลายทาง)",
  CREDIT_CARD: "บัตรเครดิต",
};

const CARRIER_LABELS: Record<string, string> = {
  THAILAND_POST: "ไปรษณีย์ไทย",
  KERRY_EXPRESS: "Kerry Express",
  FLASH_EXPRESS: "Flash Express",
  "J&T_EXPRESS":  "J&T Express",
};

function trackingUrl(trackingNumber: string, provider?: string | null): string {
  const t = encodeURIComponent(trackingNumber);
  switch (provider) {
    case "THAILAND_POST":
      return `https://track.thailandpost.co.th/?trackNumber=${t}`;
    case "FLASH_EXPRESS":
      return `https://www.flashexpress.co.th/tracking/?se=${t}`;
    case "J&T_EXPRESS":
      return `https://www.jtexpress.co.th/trajectoryQuery?waybillNo=${t}`;
    case "KERRY_EXPRESS":
    default:
      return `https://th.kerryexpress.com/en/track/?track=${t}`;
  }
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: OrderDetailRow["order_items"][number] }) {
  const pv = item.product_variants;
  const product = pv?.products;

  // Format: "Lemon Paya (Photo) by Sensi Seeds"
  let titleLine = product?.name ?? "สินค้า";
  const flowerLabel =
    (pv?.flowering_type ?? "").toLowerCase().includes("auto") ? "Auto"
    : (pv?.flowering_type ?? "").toLowerCase().includes("photo") ? "Photo"
    : null;
  if (flowerLabel) titleLine += ` (${flowerLabel})`;
  if (pv?.breeder_name) titleLine += ` by ${pv.breeder_name}`;

  const lineTotal = item.unit_price * item.quantity;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
        {product?.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Leaf className="h-5 w-5 text-zinc-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-snug text-zinc-900 line-clamp-2">{titleLine}</p>
        {pv?.unit_label && (
          <p className="mt-0.5 text-xs font-medium text-emerald-700">{pv.unit_label}</p>
        )}
        <p className="mt-1 text-xs text-zinc-400">
          {formatPrice(item.unit_price)} × {item.quantity}
        </p>
      </div>

      {/* Line total */}
      <p className="shrink-0 pt-0.5 text-sm font-bold text-zinc-800">
        {formatPrice(lineTotal)}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  order: OrderDetailRow | null;
  onClose: () => void;
  locale?: string;
}

export function OrderDetailDrawer({ order, onClose, locale = "th" }: Props) {
  const [copiedTracking, setCopiedTracking] = useState(false);

  const copyTracking = () => {
    if (!order?.tracking_number) return;
    void navigator.clipboard.writeText(order.tracking_number);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const subtotal = order
    ? order.order_items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
    : 0;
  const discount =
    subtotal > Number(order?.total_amount ?? 0)
      ? Math.round(subtotal - Number(order?.total_amount ?? 0))
      : 0;

  const statusInfo = STATUS_MAP[order?.status ?? ""] ?? STATUS_MAP.PENDING;
  const StatusIcon = statusInfo.icon;

  const dateStr = order
    ? new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      }).format(new Date(order.created_at))
    : "";

  return (
    <AnimatePresence>
      {order && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-2xl"
          >
            {/* Handle + Header */}
            <div className="shrink-0 border-b border-zinc-100 px-5 pb-4 pt-4">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    ออเดอร์{" "}
                    <span className="font-mono text-emerald-700">#{order.order_number}</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-400">{dateStr}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 pb-10">

              {/* ── Status Banner ── */}
              <div className={cn("flex items-start gap-3 rounded-2xl border p-3.5", statusInfo.bg)}>
                <StatusIcon className={cn("mt-0.5 h-5 w-5 shrink-0", statusInfo.cls)} />
                <div>
                  <p className={cn("text-sm font-bold", statusInfo.cls)}>{statusInfo.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{statusInfo.desc}</p>
                </div>
              </div>

              {/* ── Shipping / Tracking ── */}
              {order.tracking_number && (
                <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
                  <div className="flex items-center gap-2 border-b border-emerald-100 px-4 py-2.5">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      ข้อมูลการจัดส่ง
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                      เลขพัสดุ
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 font-mono text-lg font-black tracking-widest text-emerald-900">
                        {order.tracking_number}
                      </p>
                      <button
                        type="button"
                        onClick={copyTracking}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:scale-95"
                        title="คัดลอกเลขพัสดุ"
                      >
                        {copiedTracking
                          ? <Check className="h-4 w-4" />
                          : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    {order.shipping_provider && (
                      <p className="mt-1 text-xs text-emerald-600">
                        ขนส่งโดย: {CARRIER_LABELS[order.shipping_provider] ?? order.shipping_provider}
                      </p>
                    )}
                    <a
                      href={trackingUrl(order.tracking_number, order.shipping_provider)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[.98] transition-transform"
                    >
                      <ExternalLink className="h-4 w-4" />
                      ติดตามพัสดุ ({CARRIER_LABELS[order.shipping_provider ?? ""] ?? "ขนส่ง"})
                    </a>
                  </div>
                </div>
              )}

              {/* ── Items List ── */}
              <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
                <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
                  <Package className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-semibold text-zinc-700">
                    รายการสินค้า ({order.order_items.length})
                  </span>
                </div>
                <div className="divide-y divide-zinc-50">
                  {order.order_items.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* ── Price Breakdown ── */}
              <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
                {subtotal !== Number(order.total_amount) && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-zinc-500">ยอดรวมสินค้า</span>
                    <span className="text-zinc-700">{formatPrice(subtotal)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex items-center justify-between border-t border-zinc-50 px-4 py-3 text-sm">
                    <span className="text-emerald-600">🏷 ส่วนลด</span>
                    <span className="font-semibold text-emerald-600">
                      − {formatPrice(discount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-4 py-3.5">
                  <span className="font-bold text-zinc-900">ยอดสุทธิ</span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    {formatPrice(Number(order.total_amount))}
                  </span>
                </div>
              </div>

              {/* ── Payment Method ── */}
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5">
                <CreditCard className="h-5 w-5 shrink-0 text-zinc-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    ช่องทางชำระเงิน
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-700">
                    {PAYMENT_LABELS[order.payment_method ?? ""] ?? order.payment_method ?? "—"}
                  </p>
                </div>
              </div>

              {/* ── Shipping Address ── */}
              {order.shipping_address && (
                <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3.5">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      ที่อยู่จัดส่ง
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-700 whitespace-pre-line">
                      {order.shipping_address}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
