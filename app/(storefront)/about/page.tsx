import type { Metadata } from "next";
import { AboutPageClient } from "@/components/storefront/AboutPageClient";
import { getStorefrontSiteSettingsServer } from "@/services/storefront-site-settings-server";

export const metadata: Metadata = {
  title: { absolute: "เกี่ยวกับเรา | About Us — Smile Seed Bank" },
  description:
    "หจก. ทีเอ็มวาย อะโกร เทรด และร้านออนไลน์ Smile Seed Bank — ใบอนุญาตขายเมล็ดพันธุ์ควบคุมและทะเบียนพาณิชย์ | T.M.Y Agro Trade Limited Partnership and Smile Seed Bank online store.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const settings = await getStorefrontSiteSettingsServer();
  return (
    <AboutPageClient
      companySeedLicenseUrl={settings.legal_company_seed_license_url?.trim() || null}
      companyBusinessRegistrationUrl={
        settings.legal_company_business_registration_url?.trim() || null
      }
      companyBusinessRegistrationNumber={
        settings.legal_company_business_registration_number?.trim() || null
      }
      storeSeedLicenseUrl={settings.legal_seed_license_url?.trim() || null}
      businessRegistrationUrl={settings.legal_business_registration_url?.trim() || null}
      companyEmail={settings.company_email?.trim() || null}
      companyPhone={settings.company_phone?.trim() || null}
    />
  );
}
