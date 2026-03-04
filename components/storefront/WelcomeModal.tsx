"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";

const DISCOUNT_CODE = "WELCOME10";
const WELCOME10_API = "/api/storefront/promo/welcome10";

/** localStorage key: stores ISO timestamp of when user dismissed the modal. */
function dismissKey(userId?: string) {
  return userId ? `welcome_dismissed_${userId}` : "welcome_dismissed_guest";
}

/** Returns true if this session already has a dismiss record. */
function isDismissedLocally(userId?: string): boolean {
  try {
    const val = localStorage.getItem(dismissKey(userId));
    if (!val) return false;
    // Expire guest dismissals after 7 days so returning guests can still see it
    if (!userId) {
      return Date.now() - Number(val) < 7 * 24 * 60 * 60 * 1000;
    }
    // For logged-in users the DB is the source of truth; localStorage is just
    // a same-session debounce to avoid flicker during refetch.
    return true;
  } catch {
    return false;
  }
}

function setDismissedLocally(userId?: string) {
  try {
    localStorage.setItem(dismissKey(userId), String(Date.now()));
  } catch { /* ignore */ }
}

export function WelcomeModal() {
  const router = useRouter();
  const { user, customer, refetchCustomer } = useAuth();
  const { locale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  /**
   * null  = not yet fetched
   * false = should NOT show (inactive / already used)
   * true  = should show
   */
  const [eligible, setEligible] = useState<boolean | null>(null);

  // ── Fetch eligibility from API ────────────────────────────────────────────
  const checkEligibility = useCallback(async (uid: string | undefined) => {
    try {
      const url = uid
        ? `${WELCOME10_API}?userId=${encodeURIComponent(uid)}`
        : WELCOME10_API;
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as { is_active?: boolean; has_used?: boolean };

      // Ineligible if code is off OR user already redeemed it
      if (!data.is_active || data.has_used) {
        setEligible(false);
        // Silently mark as seen in DB so future loads skip the DB check too
        if (uid && data.has_used) {
          const supabase = createClient();
          void supabase
            .from("customers")
            .upsert({ id: uid, has_seen_welcome: true }, { onConflict: "id" });
        }
        return;
      }

      setEligible(true);
    } catch {
      setEligible(false);
    }
  }, []);

  // Re-check when user state changes
  useEffect(() => {
    checkEligibility(user?.id);
  }, [user?.id, checkEligibility]);

  // Re-check on tab focus (handles the "used code in another tab" case)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkEligibility(user?.id);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user?.id, checkEligibility]);

  // ── Decide whether to open ────────────────────────────────────────────────
  useEffect(() => {
    if (eligible !== true) return;

    // For logged-in users: has_seen_welcome is the permanent gate
    if (user) {
      const alreadySeen = customer?.has_seen_welcome === true;
      if (alreadySeen || isDismissedLocally(user.id)) return;
      setOpen(true);
      return;
    }

    // For guests: use localStorage 7-day debounce
    if (!isDismissedLocally(undefined)) {
      setOpen(true);
    }
  }, [eligible, user, customer?.has_seen_welcome]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const dismiss = useCallback(async () => {
    if (updating) return;
    setOpen(false);
    setDismissedLocally(user?.id);

    if (!user) return;

    setUpdating(true);
    const supabase = createClient();
    await supabase.from("customers").upsert(
      {
        id: user.id,
        has_seen_welcome: true,
        ...(customer?.email === undefined && user.email ? { email: user.email } : {}),
      },
      { onConflict: "id" }
    );
    await refetchCustomer();
    setUpdating(false);
  }, [updating, user, customer?.email, refetchCustomer]);

  const handleSetUpAddress = useCallback(() => {
    void dismiss().then(() => router.push("/profile#address"));
  }, [dismiss, router]);

  const copyCode = () => {
    void navigator.clipboard.writeText(DISCOUNT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const headerTh = "ยินดีต้อนรับสู่ครอบครัว Smile Seed Bank! 🌿";
  const headerEn = "Welcome to the Smile Seed Bank Family! 🧬";
  const msgTh =
    "บันทึกที่อยู่จัดส่งของคุณตอนนี้ จะได้ใช้เติมอัตโนมัติในออเดอร์ถัดไป และจำเป็นเพื่อปลดล็อคส่วนลดครับ";
  const msgEn =
    "Saving your shipping address now enables auto-fill for future orders and is required to unlock the discount.";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-2xl"
          >
            {/* Close X */}
            <button
              type="button"
              onClick={() => void dismiss()}
              disabled={updating}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              aria-label={t("ปิด", "Close")}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-6 pt-8 pb-6">
              {/* Icon */}
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Leaf className="h-7 w-7 text-primary" />
                </div>
              </div>

              {/* Header */}
              <h2 className="text-center text-xl font-extrabold leading-snug text-zinc-900">
                {locale === "en" ? headerEn : headerTh}
              </h2>

              {/* Discount box */}
              <div className="mt-5 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-4">
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("รหัสส่วนลด 10%", "10% discount code")}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-lg font-bold tracking-wider text-primary">
                    {DISCOUNT_CODE}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90"
                    aria-label={t("คัดลอก", "Copy")}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Message */}
              <p className="mt-4 text-center text-sm leading-relaxed text-zinc-600">
                {locale === "en" ? msgEn : msgTh}
              </p>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  onClick={handleSetUpAddress}
                  disabled={updating}
                  className="h-12 w-full bg-primary text-base font-semibold text-white hover:bg-primary/90"
                >
                  {t("ตั้งค่าที่อยู่", "Set Up Address")}
                </Button>
                <button
                  type="button"
                  onClick={() => void dismiss()}
                  disabled={updating}
                  className="text-center text-sm font-medium text-zinc-500 hover:text-zinc-700"
                >
                  {t("เก็บไว้ก่อน", "Maybe Later")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
