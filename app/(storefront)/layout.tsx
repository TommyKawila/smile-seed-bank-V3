import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { OfferManager } from "@/components/storefront/OfferManager";
import { PromotionBanner } from "@/components/storefront/PromotionBanner";
import { PromoReturnHandler } from "@/components/storefront/PromoReturnHandler";
import { Toaster } from "@/components/ui/sonner";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>
        <Toaster />
        <Suspense fallback={null}>
          <PromoReturnHandler />
        </Suspense>
        <PromotionBanner />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 bg-white">{children}</main>
          <Footer />
          <OfferManager />
        </div>
      </CartProvider>
    </LanguageProvider>
  );
}
