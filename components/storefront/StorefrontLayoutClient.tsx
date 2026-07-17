"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/storefront/Navbar";
import { FRAMER_MOTION_NEEDED_EVENT } from "@/lib/framer-motion-events";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";
import { scheduleInteractionMount } from "@/lib/schedule-interaction-mount";
import { CART_FLY_EVENT, type CartFlyEventDetail } from "@/lib/cart-fly-events";
import { clearCatalogReturnPath } from "@/lib/catalog-return-path";

const CART_ANIMATION_IDLE_MS = 8_000;
const AGE_GATE_FALLBACK_MS = 12_000;
const HOME_FRAMER_FALLBACK_MS = 15_000;
const HOME_BANNER_IDLE_MS = 2_500;

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
const FramerLazyRoot = dynamic(
  () => import("@/components/storefront/FramerLazyRoot").then((m) => ({ default: m.FramerLazyRoot })),
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

const CATALOG_FRAMER_IDLE_MS = 2_500;

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
  const isHomePath = pathname === "/";

  useEffect(() => {
    if (pathname === "/blog" || pathname?.startsWith("/blog/")) {
      clearCatalogReturnPath();
    }
  }, [pathname]);
  const [mountAgeGate, setMountAgeGate] = useState(false);
  const [framerReady, setFramerReady] = useState(false);
  const [mountOffers, setMountOffers] = useState(false);
  const [mountHomeBanners, setMountHomeBanners] = useState(!isHomePath);
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
    if (framerReady) return;
    const arm = () => setFramerReady(true);
    window.addEventListener(FRAMER_MOTION_NEEDED_EVENT, arm);
    const cancelInteract = scheduleInteractionMount(arm, HOME_FRAMER_FALLBACK_MS);
    const cancelIdle = scheduleIdleWork(arm, CATALOG_FRAMER_IDLE_MS);
    return () => {
      window.removeEventListener(FRAMER_MOTION_NEEDED_EVENT, arm);
      cancelInteract();
      cancelIdle();
    };
  }, [framerReady]);

  useEffect(() => {
    if (!isHomePath) return;
    return scheduleIdleWork(() => setMountHomeBanners(true), HOME_BANNER_IDLE_MS);
  }, [isHomePath]);

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

  const layoutBody = (
    <>
      {cartFxMount ? <CartAnimation replay={cartFxReplay} /> : null}
      <Toaster />
      {mountHomeBanners ? <BrowserDetectionBanner /> : null}
      {mountAgeGate ? (
        <AgeVerificationGate initialVerifiedCookie={initialAgeVerifiedCookie} />
      ) : null}
      {mountPromoHandler ? (
        <Suspense fallback={null}>
          <PromoReturnHandler />
        </Suspense>
      ) : null}
      {mountHomeBanners ? <PromotionBanner /> : null}
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 bg-white pt-20 sm:pt-28">{children}</main>
        <Footer />
        {mountOffers ? <OfferManager /> : null}
      </div>
    </>
  );

  return framerReady ? <FramerLazyRoot>{layoutBody}</FramerLazyRoot> : layoutBody;
}
