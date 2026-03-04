"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { WelcomeModal } from "@/components/storefront/WelcomeModal";
import { FloatingOfferButton } from "@/components/storefront/FloatingOfferButton";
import type { EligibleCoupon } from "@/components/storefront/FloatingOfferButton";

/**
 * OfferManager — single entry point for all discount UI.
 *
 * Rules:
 *  - Not logged in                    → render nothing (WelcomeModal handles guest logic internally)
 *  - WELCOME10 eligible (not used)    → WelcomeModal handles its own popup
 *  - Has other unused coupons         → FloatingOfferButton drawer
 *  - No eligible coupons at all       → render nothing
 */
export function OfferManager() {
  const { user } = useAuth();
  const [floatingCoupons, setFloatingCoupons] = useState<EligibleCoupon[]>([]);

  const fetchEligible = useCallback(async (userId: string, email: string | null) => {
    try {
      const params = new URLSearchParams({ userId });
      if (email) params.set("email", email);
      const res = await fetch(`/api/storefront/coupons/eligible?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { coupons: EligibleCoupon[] };

      // WELCOME10 is handled by WelcomeModal — exclude it from the floating drawer
      setFloatingCoupons(
        (data.coupons ?? []).filter((c) => c.code !== "WELCOME10")
      );
    } catch {
      // silent fail — non-critical feature
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setFloatingCoupons([]);
      return;
    }
    void fetchEligible(user.id, user.email ?? null);
  }, [user, fetchEligible]);

  // Re-fetch when tab regains focus (user may have just placed an order)
  useEffect(() => {
    if (!user) return;
    const onFocus = () => void fetchEligible(user.id, user.email ?? null);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, fetchEligible]);

  return (
    <>
      {/* WelcomeModal is always mounted — it manages its own WELCOME10 visibility */}
      <WelcomeModal />

      {/* FloatingOfferButton only shows when there are non-WELCOME10 coupons */}
      <FloatingOfferButton coupons={floatingCoupons} />
    </>
  );
}
