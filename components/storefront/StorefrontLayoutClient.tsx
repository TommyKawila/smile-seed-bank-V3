"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/storefront/Navbar";
import { FramerLazyRoot } from "@/components/storefront/FramerLazyRoot";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";
import { scheduleInteractionMount } from "@/lib/schedule-interaction-mount";
import { CART_FLY_EVENT, type CartFlyEventDetail } from "@/lib/cart-fly-events";
import { clearCatalogReturnPath } from "@/lib/catalog-return-path";

const CART_ANIMATION_IDLE_MS = 8_000;
const AGE_GATE_FALLBACK_MS = 12_000;

const AgeVerificationGate = dynamic(
  () =>
    import("@/components/storefront/age-verification-gate").then((m) => ({
      default: m.AgeVerificationGate,
    })),
  { ssr: false }
);
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
const CartAnimation = dynamic(
  () => import("@/components/storefront/CartAnimation").then((m) => ({ default: m.CartAnimation })),
  { ssr: false }
);
const PromoReturnHandler = dynamic(
  () =>
    import("@/components/storefront/PromoReturnHandler").then((m) => ({
      default: m.PromoReturnHandler,
    })),
  { ssr: false }
);

const PROMO_HANDLER_IDLE_MS = 2_500;

export function StorefrontLayoutClient({
  children,
  initialAgeVerifiedCookie,
  initialSkipAgeGate,
}: {
  children: React.ReactNode;
  initialAgeVerifiedCookie: boolean;
  initialSkipAgeGate: boolean;
}) {
  const pathname = usePathname();
  const isLiffEntry =
    pathname === "/line/entry" || pathname.startsWith("/line/entry/");

  useEffect(() => {
    if (pathname === "/blog" || pathname?.startsWith("/blog/")) {
      clearCatalogReturnPath();
    }
  }, [pathname]);
  const [mountAgeGate, setMountAgeGate] = useState(false);
  const [mountOffers, setMountOffers] = useState(false);
  const [cartFxMount, setCartFxMount] = useState(false);
  const [cartFxReplay, setCartFxReplay] = useState<CartFlyEventDetail | null>(null);
  const [mountPromoHandler, setMountPromoHandler] = useState(false);
  const cartFxArmedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("promo=")) {
      setMountPromoHandler(true);
      return;
    }
    return scheduleIdleWork(() => setMountPromoHandler(true), PROMO_HANDLER_IDLE_MS);
  }, []);

  useEffect(() => {
    if (initialSkipAgeGate) return;
    return scheduleInteractionMount(() => setMountAgeGate(true), AGE_GATE_FALLBACK_MS);
  }, [initialSkipAgeGate]);

  useEffect(() => {
    return scheduleIdleWork(() => setMountOffers(true), AGE_GATE_FALLBACK_MS);
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

  if (isLiffEntry) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  const layoutBody = (
    <>
      {cartFxMount ? <CartAnimation replay={cartFxReplay} /> : null}
      <Toaster />
      {mountAgeGate ? (
        <AgeVerificationGate initialVerifiedCookie={initialAgeVerifiedCookie} />
      ) : null}
      {mountPromoHandler ? (
        <Suspense fallback={null}>
          <PromoReturnHandler />
        </Suspense>
      ) : null}
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 bg-background pt-20 sm:pt-28">{children}</main>
        <Footer />
        {mountOffers ? <OfferManager /> : null}
      </div>
    </>
  );

  // Always wrap — never swap tree on first interaction (breaks soft nav in LINE LIFF).
  return <FramerLazyRoot>{layoutBody}</FramerLazyRoot>;
}
