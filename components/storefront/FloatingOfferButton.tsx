"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ChevronRight, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  formatCouponValueDisplay,
  isCouponPercentageType,
} from "@/lib/discount-utils";
import type { EligibleCoupon } from "@/lib/services/coupon-service";
import { useAuth } from "@/hooks/use-auth";
import {
  DEFAULT_COUPON_FLOAT_BADGE,
  type FloatingBadgeAsset,
} from "@/lib/coupon-floating-badge";
import { FloatingCouponBadgeMedia } from "@/components/storefront/FloatingCouponBadgeMedia";

export type { EligibleCoupon, FloatingBadgeAsset };

interface Props {
  coupons: EligibleCoupon[];
  claimedPromoIds: number[];
  onClaimed: () => void;
  /** Resolved Lottie, image URL, or default SVG. */
  floatingBadge: FloatingBadgeAsset;
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
  return null;
}

export function CouponCard({
  coupon,
  showCollect,
  collected,
  collecting,
  used = false,
  onCollect,
}: {
  coupon: EligibleCoupon;
  showCollect: boolean;
  collected: boolean;
  collecting: boolean;
  used?: boolean;
  onCollect?: () => void;
}) {
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
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
        used
          ? "border-border bg-muted/30 opacity-60 grayscale"
          : isWelcome
            ? "border-primary/25 bg-accent"
            : "border-border bg-card"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center",
          used ? "bg-zinc-400 text-white" : isWelcome ? "bg-primary text-white" : "bg-zinc-800 text-white"
        )}
      >
        <span className="text-xs font-bold leading-none">
          {formatCouponValueDisplay(coupon.discount_type, coupon.discount_value)}
        </span>
        <span className="mt-0.5 text-[10px] opacity-80">OFF</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn("font-mono text-sm font-bold", used ? "text-muted-foreground line-through" : "text-foreground")}>
            {coupon.code}
          </p>
          {used && (
            <span className="rounded bg-muted/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
              ใช้แล้ว
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{discountLabel(coupon)}</p>
        {minSpend && <p className="text-[11px] text-muted-foreground">{minSpend}</p>}
        {expiry && !used && (
          <p className="mt-0.5 text-[11px] font-medium text-orange-500">{expiry}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {!used && showCollect && (
          <button
            type="button"
            disabled={collected || collecting}
            onClick={() => onCollect?.()}
            className={cn(
              "flex min-h-9 min-w-[5.5rem] items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold transition-colors",
              collected
                ? "cursor-not-allowed bg-muted/30 text-muted-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/15"
            )}
          >
            <Bookmark className="h-3.5 w-3.5 shrink-0" />
            {collected ? "เก็บแล้ว" : "เก็บโค้ด"}
          </button>
        )}
        {!used && (
          <button
            type="button"
            onClick={copy}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              copied ? "bg-accent text-primary" : "bg-muted/30 text-muted-foreground hover:bg-muted/40"
            )}
            aria-label="คัดลอก"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function FloatingOfferButton({
  coupons,
  claimedPromoIds,
  onClaimed,
  floatingBadge = { kind: "default", src: DEFAULT_COUPON_FLOAT_BADGE },
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collectingId, setCollectingId] = useState<number | null>(null);
  const [badgeReveal, setBadgeReveal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setBadgeReveal(true);
  }, []);

  const claim = async (promoCodeId: number) => {
    if (!user) {
      const next =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/";
      router.push(
        `/login?next=${encodeURIComponent(next)}&reason=${encodeURIComponent("collect_coupon")}`,
      );
      return;
    }
    setCollectingId(promoCodeId);
    try {
      const res = await fetch("/api/storefront/coupons/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promo_code_id: promoCodeId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        alreadyCollected?: boolean;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Could not save coupon");
        return;
      }
      toast.success("Saved to your profile!");
      onClaimed();
    } catch {
      toast.error("Could not save coupon");
    } finally {
      setCollectingId(null);
    }
  };

  if (coupons.length === 0) return null;

  const claimedSet = new Set(claimedPromoIds);

  return (
    <>
      <AnimatePresence>
        {!drawerOpen && (
          <m.button
            type="button"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setDrawerOpen(true)}
            className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-3 py-2.5 text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <div
              className={cn(
                "h-9 w-9 shrink-0 transition-opacity duration-200",
                badgeReveal ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
              )}
              aria-hidden={!badgeReveal}
            >
              <FloatingCouponBadgeMedia asset={floatingBadge} />
            </div>
            <span className="text-sm font-semibold">
              {coupons.length === 1 ? "1 ส่วนลด" : `${coupons.length} ส่วนลด`}
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
              {coupons.length}
            </span>
          </m.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />

            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card px-4 pb-8 pt-4 shadow-2xl"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted/40" />

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">ส่วนลดของคุณ</h3>
                  <p className="text-xs text-muted-foreground">
                    {coupons.length} โค้ดที่ยังใช้ได้ · เก็บโค้ดหรือคัดลอกไปใช้ที่ตะกร้า
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/30 text-muted-foreground hover:bg-muted/40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[55vh] space-y-2 overflow-y-auto pb-2">
                {coupons.map((c) => (
                  <CouponCard
                    key={c.id}
                    coupon={c}
                    showCollect
                    collected={claimedSet.has(c.id)}
                    collecting={collectingId === c.id}
                    onCollect={() => void claim(c.id)}
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                คัดลอกโค้ด แล้วใส่ในหน้าตะกร้าสินค้า
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
