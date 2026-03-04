import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { OfferManager } from "@/components/storefront/OfferManager";
import { PromoReturnHandler } from "@/components/storefront/PromoReturnHandler";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>
        <Suspense fallback={null}>
          <PromoReturnHandler />
        </Suspense>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <OfferManager />
        </div>
      </CartProvider>
    </LanguageProvider>
  );
}
