"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, Copy, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatCouponValueDisplay,
  isCouponPercentageType,
} from "@/lib/discount-utils";
import type { EligibleCoupon } from "@/lib/services/coupon-service";

// Re-export the type so OfferManager can import from one place
export type { EligibleCoupon };

interface Props {
  coupons: EligibleCoupon[];
}

function discountLabel(c: EligibleCoupon): string {
  return isCouponPercentageType(c.discount_type)
    ? `ลด ${c.discount_value}%`
    : `ลด ฿${c.discount_value.toLocaleString("th-TH")}`;
}

function minSpendLabel(c: EligibleCoupon): string | null {
  if (!c.min_spend || c.min_spend <= 0) return null;
  return `ยอดขั้นต่ำ ฿${c.min_spend.toLocaleString("th-TH")}`;
}

function expiryLabel(c: EligibleCoupon): string | null {
  if (!c.expiry_date) return null;
  const diff = new Date(c.expiry_date).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return null;
  if (days === 1) return "หมดอายุวันนี้";
  if (days <= 7) return `หมดอายุใน ${days} วัน`;
  return null; // Don't show if far away
}

// ─── Coupon Card ──────────────────────────────────────────────────────────────

function CouponCard({ coupon }: { coupon: EligibleCoupon }) {
  const [copied, setCopied] = useState(false);
  const expiry = expiryLabel(coupon);
  const minSpend = minSpendLabel(coupon);
  const isWelcome = coupon.code === "WELCOME10";

  const copy = () => {
    void navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
      isWelcome
        ? "border-primary/25 bg-accent"
        : "border-zinc-100 bg-white"
    )}>
      {/* Discount pill */}
      <div className={cn(
        "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center",
        isWelcome ? "bg-primary text-white" : "bg-zinc-800 text-white"
      )}>
        <span className="text-xs font-bold leading-none">
          {formatCouponValueDisplay(coupon.discount_type, coupon.discount_value)}
        </span>
        <span className="mt-0.5 text-[10px] opacity-80">OFF</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-bold text-zinc-900">{coupon.code}</p>
        <p className="text-xs text-zinc-500">{discountLabel(coupon)}</p>
        {minSpend && <p className="text-[11px] text-zinc-400">{minSpend}</p>}
        {expiry && (
          <p className="mt-0.5 text-[11px] font-medium text-orange-500">{expiry}</p>
        )}
      </div>

      {/* Copy button */}
      <button
        type="button"
        onClick={copy}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
          copied
            ? "bg-accent text-primary"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        )}
        aria-label="คัดลอก"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FloatingOfferButton({ coupons }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (coupons.length === 0) return null;

  return (
    <>
      {/* Floating pill button */}
      <AnimatePresence>
        {!drawerOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setDrawerOpen(true)}
            className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-white shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
          >
            <Tag className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {coupons.length === 1 ? "1 ส่วนลด" : `${coupons.length} ส่วนลด`}
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
              {coupons.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white px-4 pb-8 pt-4 shadow-2xl"
            >
              {/* Handle */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200" />

              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900">ส่วนลดของคุณ</h3>
                  <p className="text-xs text-zinc-500">
                    {coupons.length} โค้ดที่ยังใช้ได้ · คลิกคัดลอกเพื่อใช้งาน
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Coupon list */}
              <div className="max-h-[55vh] space-y-2 overflow-y-auto pb-2">
                {coupons.map((c) => (
                  <CouponCard key={c.id} coupon={c} />
                ))}
              </div>

              {/* Footer hint */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
                <ChevronRight className="h-3 w-3" />
                คัดลอกโค้ด แล้วใส่ในหน้าตะกร้าสินค้า
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
