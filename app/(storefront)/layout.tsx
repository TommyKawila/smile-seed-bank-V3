import { Suspense } from "react";
import { cookies } from "next/headers";
import { BreederCatalogProvider } from "@/context/BreederCatalogContext";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { magazineLocaleFromCookie } from "@/lib/magazine-bilingual";
import { AuthProvider } from "@/hooks/use-auth";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import { StorefrontStructuredData } from "@/components/seo/StorefrontStructuredData";
import { SMIL_AGE_VERIFIED_COOKIE_NAME } from "@/components/storefront/age-verification-gate";
import { getStorefrontSessionHint } from "@/services/storefront-auth-hint-service";
import { StorefrontLayoutClient } from "@/components/storefront/StorefrontLayoutClient";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLocale = magazineLocaleFromCookie(cookieStore.get("locale")?.value);
  const initialAgeVerifiedCookie =
    cookieStore.get(SMIL_AGE_VERIFIED_COOKIE_NAME)?.value === "1";
  const initialSessionHint = await getStorefrontSessionHint();

  return (
    <LanguageProvider initialLocale={initialLocale}>
      <BreederCatalogProvider>
        <AuthProvider initialSessionHint={initialSessionHint}>
          <SiteSettingsProvider>
            <CartProvider>
              <StorefrontStructuredData />
              <StorefrontLayoutClient initialAgeVerifiedCookie={initialAgeVerifiedCookie}>
                {children}
              </StorefrontLayoutClient>
            </CartProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </BreederCatalogProvider>
    </LanguageProvider>
  );
}
