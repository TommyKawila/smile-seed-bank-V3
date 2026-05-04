import { Suspense } from "react";
import { cookies } from "next/headers";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { magazineLocaleFromCookie } from "@/lib/magazine-bilingual";
import { AuthProvider } from "@/hooks/use-auth";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import { StorefrontStructuredData } from "@/components/seo/StorefrontStructuredData";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { OfferManager } from "@/components/storefront/OfferManager";
import { PromotionBanner } from "@/components/storefront/PromotionBanner";
import { PromoReturnHandler } from "@/components/storefront/PromoReturnHandler";
import { Toaster } from "@/components/ui/sonner";
import { CartAnimation } from "@/components/storefront/CartAnimation";
import { AgeVerificationGate } from "@/components/storefront/age-verification-gate";
import { BrowserDetectionBanner } from "@/components/storefront/BrowserDetectionBanner";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLocale = magazineLocaleFromCookie(cookieStore.get("locale")?.value);

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <AuthProvider>
        <SiteSettingsProvider>
          <CartProvider>
            <CartAnimation />
            <Toaster />
            <BrowserDetectionBanner />
            <AgeVerificationGate />
            <Suspense fallback={null}>
              <PromoReturnHandler />
            </Suspense>
            <PromotionBanner />
            <StorefrontStructuredData />
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 bg-white">{children}</main>
              <Footer />
              <OfferManager />
            </div>
          </CartProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
