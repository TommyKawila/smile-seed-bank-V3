import { resolvePdfLogo } from "./pdf-logo";

export type SocialLink = { platform: string; handle: string };

export type PdfSettings = {
  logoDataUrl: string | null;
  companyName: string;
  companyAddress: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyLineId: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNo: string | null;
  socialLinks: SocialLink[];
  legalSeedLicenseUrl: string | null;
  legalSeedLicenseNumber: string | null;
  legalBusinessRegistrationUrl: string | null;
  legalBusinessRegistrationNumber: string | null;
};

export async function fetchPdfSettings(): Promise<PdfSettings> {
  const [storeRes, paymentRes, siteRes] = await Promise.all([
    fetch("/api/admin/store-settings"),
    fetch("/api/admin/settings/payment"),
    fetch("/api/admin/settings"),
  ]);

  const store = await storeRes.json().catch(() => ({}));
  const payment = await paymentRes.json().catch(() => ({}));
  const site = await siteRes.json().catch(() => ({}));

  const logoDataUrl = await resolvePdfLogo({
    logo_secondary_png_url: site.logo_secondary_png_url ?? null,
    logo_main_url: site.logo_main_url ?? null,
  });

  const banks = (payment.bankAccounts ?? []) as { bankName?: string; accountName?: string; accountNo?: string; isActive?: boolean }[];
  const activeBank = banks.find((b) => b.isActive !== false) ?? banks[0];

  let socialLinks: SocialLink[] = [];
  try {
    const s = site.social_media;
    if (s) {
      const arr = JSON.parse(s);
      socialLinks = Array.isArray(arr) ? arr : [];
    }
  } catch {
    /* ignore */
  }

  return {
    logoDataUrl,
    companyName: (site.company_name || store.storeName) ?? "Smile Seed Bank",
    companyAddress: (site.company_address || store.address) ?? null,
    companyEmail: (site.company_email || store.contactEmail) ?? null,
    companyPhone: (site.company_phone || store.supportPhone) ?? null,
    companyLineId: payment.lineId ?? null,
    bankName: activeBank?.bankName ?? null,
    bankAccountName: activeBank?.accountName ?? null,
    bankAccountNo: activeBank?.accountNo ?? null,
    socialLinks,
    legalSeedLicenseUrl: site.legal_seed_license_url ?? null,
    legalSeedLicenseNumber: site.legal_seed_license_number ?? null,
    legalBusinessRegistrationUrl: site.legal_business_registration_url ?? null,
    legalBusinessRegistrationNumber: site.legal_business_registration_number ?? null,
  };
}
