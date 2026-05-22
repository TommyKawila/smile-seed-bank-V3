"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { AgeVerificationGate } from "@/components/storefront/age-verification-gate";
import { Navbar } from "@/components/storefront/Navbar";
import { PromoReturnHandler } from "@/components/storefront/PromoReturnHandler";

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
  return (
    <>
      <CartAnimation />
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
        <OfferManager />
      </div>
    </>
  );
}
