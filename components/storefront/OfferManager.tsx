"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { WelcomeModal } from "@/components/storefront/WelcomeModal";
import { FloatingOfferButton } from "@/components/storefront/FloatingOfferButton";
import type { EligibleCoupon } from "@/components/storefront/FloatingOfferButton";
import {
  isCouponCollectableForFloating,
  pickFloatingBadgeAsset,
} from "@/lib/coupon-floating-badge";

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
  const [claimedPromoIds, setClaimedPromoIds] = useState<number[]>([]);

  const refreshOffers = useCallback(async () => {
    if (!user) {
      setFloatingCoupons([]);
      setClaimedPromoIds([]);
      return;
    }
    try {
      const params = new URLSearchParams({ userId: user.id });
      if (user.email) params.set("email", user.email);

      const [eligRes, collRes] = await Promise.all([
        fetch(`/api/storefront/coupons/eligible?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/storefront/coupons/collected", { cache: "no-store" }),
      ]);

      if (eligRes.ok) {
        const data = (await eligRes.json()) as { coupons: EligibleCoupon[] };
        const list = (data.coupons ?? []).filter((c) => c.code !== "WELCOME10");
        setFloatingCoupons(list.filter(isCouponCollectableForFloating));
      }
      if (collRes.ok) {
        const cj = (await collRes.json()) as { coupons: { id: number }[] };
        setClaimedPromoIds((cj.coupons ?? []).map((c) => c.id));
      }
    } catch {
      // non-critical
    }
  }, [user]);

  useEffect(() => {
    void refreshOffers();
  }, [refreshOffers]);

  useEffect(() => {
    if (!user) return;
    const onFocus = () => void refreshOffers();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, refreshOffers]);

  const floatingBadge = useMemo(
    () => pickFloatingBadgeAsset(floatingCoupons),
    [floatingCoupons]
  );

  return (
    <>
      <WelcomeModal />

      <FloatingOfferButton
        coupons={floatingCoupons}
        claimedPromoIds={claimedPromoIds}
        onClaimed={() => void refreshOffers()}
        floatingBadge={floatingBadge}
      />
    </>
  );
}
