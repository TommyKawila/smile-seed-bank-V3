"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AgeVerificationGate } from "@/components/storefront/age-verification-gate";
import { Navbar } from "@/components/storefront/Navbar";
import { PromoReturnHandler } from "@/components/storefront/PromoReturnHandler";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";
import { CART_FLY_EVENT, type CartFlyEventDetail } from "@/lib/cart-fly-events";

const CART_ANIMATION_IDLE_MS = 8_000;

const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })),
  { ssr: false }
);
const Footer = dynamic(
  () => import("@/components/storefront/Footer").then((m) => ({ default: m.Footer })),
  { ssr: false }
);
const OfferManager = dynamic(
  () => import("@/components/storefront/OfferManager").then((m) => ({ default: m.OfferManager })),
  { ssr: false }
);
const PromotionBanner = dynamic(
  () => import("@/components/storefront/PromotionBanner").then((m) => ({ default: m.PromotionBanner })),
  { ssr: false }
);
const BrowserDetectionBanner = dynamic(
  () =>
    import("@/components/storefront/BrowserDetectionBanner").then((m) => ({
      default: m.BrowserDetectionBanner,
    })),
  { ssr: false }
);
const CartAnimation = dynamic(
  () => import("@/components/storefront/CartAnimation").then((m) => ({ default: m.CartAnimation })),
  { ssr: false }
);

export function StorefrontLayoutClient({
  children,
  initialAgeVerifiedCookie,
}: {
  children: React.ReactNode;
  initialAgeVerifiedCookie: boolean;
}) {
  const [mountOffers, setMountOffers] = useState(false);
  const [cartFxMount, setCartFxMount] = useState(false);
  const [cartFxReplay, setCartFxReplay] = useState<CartFlyEventDetail | null>(null);
  const cartFxArmedRef = useRef(false);

  useEffect(() => {
    return scheduleIdleWork(() => setMountOffers(true), 5000);
  }, []);

  useEffect(() => {
    const armCartFx = (replay: CartFlyEventDetail | null) => {
      if (cartFxArmedRef.current) return;
      cartFxArmedRef.current = true;
      setCartFxReplay(replay);
      setCartFxMount(true);
    };
    const onFly = (ev: Event) => {
      const detail = (ev as CustomEvent<CartFlyEventDetail>).detail;
      if (!detail?.startRect) return;
      armCartFx(detail);
    };
    window.addEventListener(CART_FLY_EVENT, onFly);
    const cancelIdle = scheduleIdleWork(() => armCartFx(null), CART_ANIMATION_IDLE_MS);
    return () => {
      window.removeEventListener(CART_FLY_EVENT, onFly);
      cancelIdle();
    };
  }, []);

  return (
    <>
      {cartFxMount ? <CartAnimation replay={cartFxReplay} /> : null}
      <Toaster />
      <BrowserDetectionBanner />
      <AgeVerificationGate initialVerifiedCookie={initialAgeVerifiedCookie} />
      <Suspense fallback={null}>
        <PromoReturnHandler />
      </Suspense>
      <PromotionBanner />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 bg-white pt-20 sm:pt-28">{children}</main>
        <Footer />
        {mountOffers ? <OfferManager /> : null}
      </div>
    </>
  );
}
