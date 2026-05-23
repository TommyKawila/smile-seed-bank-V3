"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AgeVerificationGate } from "@/components/storefront/age-verification-gate";
import { FramerLazyRoot } from "@/components/storefront/FramerLazyRoot";
import { Navbar } from "@/components/storefront/Navbar";
import { PromoReturnHandler } from "@/components/storefront/PromoReturnHandler";
import { FRAMER_MOTION_NEEDED_EVENT } from "@/lib/framer-motion-events";
import { scheduleIdleWork } from "@/lib/schedule-idle-work";
import { CART_FLY_EVENT, type CartFlyEventDetail } from "@/lib/cart-fly-events";

const CART_ANIMATION_IDLE_MS = 8_000;
const AGE_GATE_AFTER_LCP_IDLE_MS = 2_000;
const HOME_FRAMER_IDLE_MS = 4_500;

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

function scheduleAgeGateMount(onMount: () => void): () => void {
  let cancelled = false;
  let idleCancel: (() => void) | null = null;
  const mount = () => {
    if (!cancelled) onMount();
  };
  const afterLcp = () => {
    idleCancel = scheduleIdleWork(mount, AGE_GATE_AFTER_LCP_IDLE_MS);
  };

  if (typeof PerformanceObserver !== "undefined") {
    try {
      let lcpHandled = false;
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType !== "largest-contentful-paint" || lcpHandled) continue;
          lcpHandled = true;
          po.disconnect();
          afterLcp();
        }
      });
      po.observe({ type: "largest-contentful-paint", buffered: true });
      const fallback = scheduleIdleWork(() => {
        if (!lcpHandled && !cancelled) mount();
      }, 3_500);
      return () => {
        cancelled = true;
        po.disconnect();
        fallback();
        idleCancel?.();
      };
    } catch {
      /* fall through */
    }
  }

  const cancel = scheduleIdleWork(mount, 2_500);
  return () => {
    cancelled = true;
    cancel();
    idleCancel?.();
  };
}

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
  const [mountAgeGate, setMountAgeGate] = useState(false);
  const [framerReady, setFramerReady] = useState(!isHomePath);
  const [mountOffers, setMountOffers] = useState(false);
  const [cartFxMount, setCartFxMount] = useState(false);
  const [cartFxReplay, setCartFxReplay] = useState<CartFlyEventDetail | null>(null);
  const cartFxArmedRef = useRef(false);

  useEffect(() => {
    if (initialSkipAgeGate) return;
    return scheduleAgeGateMount(() => setMountAgeGate(true));
  }, [initialSkipAgeGate]);

  useEffect(() => {
    if (!isHomePath) {
      setFramerReady(true);
      return;
    }
    if (framerReady) return;
    const onNeeded = () => setFramerReady(true);
    window.addEventListener(FRAMER_MOTION_NEEDED_EVENT, onNeeded);
    const cancelIdle = scheduleIdleWork(() => setFramerReady(true), HOME_FRAMER_IDLE_MS);
    return () => {
      window.removeEventListener(FRAMER_MOTION_NEEDED_EVENT, onNeeded);
      cancelIdle();
    };
  }, [framerReady, isHomePath]);

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
      <BrowserDetectionBanner />
      {mountAgeGate ? (
        <AgeVerificationGate initialVerifiedCookie={initialAgeVerifiedCookie} />
      ) : null}
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

  return framerReady ? <FramerLazyRoot>{layoutBody}</FramerLazyRoot> : layoutBody;
}
