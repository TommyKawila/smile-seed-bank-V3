import { Suspense } from "react";
import dynamic from "next/dynamic";
import { cookies } from "next/headers";
import { BreederCatalogProvider } from "@/context/BreederCatalogContext";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { magazineLocaleFromCookie } from "@/lib/magazine-bilingual";
import { AuthProvider } from "@/hooks/use-auth";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import { StorefrontStructuredData } from "@/components/seo/StorefrontStructuredData";
import {
  AgeVerificationGate,
  SMIL_AGE_VERIFIED_COOKIE_NAME,
} from "@/components/storefront/age-verification-gate";
import { Navbar } from "@/components/storefront/Navbar";
import { PromoReturnHandler } from "@/components/storefront/PromoReturnHandler";
import { Toaster } from "@/components/ui/sonner";

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
  () => import("@/components/storefront/BrowserDetectionBanner").then((m) => ({
    default: m.BrowserDetectionBanner,
  })),
  { ssr: false }
);

const CartAnimation = dynamic(
  () => import("@/components/storefront/CartAnimation").then((m) => ({ default: m.CartAnimation })),
  { ssr: false }
);

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLocale = magazineLocaleFromCookie(cookieStore.get("locale")?.value);
  const initialAgeVerifiedCookie =
    cookieStore.get(SMIL_AGE_VERIFIED_COOKIE_NAME)?.value === "1";

  /* CDN preconnect: Supabase origin from root `app/layout.tsx` <head> (React 18 has no ReactDOM.preconnect). */

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <BreederCatalogProvider>
        <AuthProvider>
          <SiteSettingsProvider>
            <CartProvider>
              <CartAnimation />
              <Toaster />
              <BrowserDetectionBanner />
              <AgeVerificationGate initialVerifiedCookie={initialAgeVerifiedCookie} />
              <Suspense fallback={null}>
                <PromoReturnHandler />
              </Suspense>
              <PromotionBanner />
              <StorefrontStructuredData />
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1 bg-white pt-20 sm:pt-28">{children}</main>
                <Footer />
                <OfferManager />
              </div>
            </CartProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </BreederCatalogProvider>
    </LanguageProvider>
  );
}
