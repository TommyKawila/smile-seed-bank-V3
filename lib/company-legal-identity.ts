/**
 * SSOT — legal entities for letterhead, About Us, and trust footers.
 * Document scan URLs live in site_settings (Admin upload); numbers/addresses live here.
 */

export type LegalLocale = "th" | "en";

/** Admin site_settings overrides for document letterhead/footer numbers. */
export type LegalDocumentOverrides = {
  companySeedLicenseNumber?: string | null;
  companyPartnershipRegistrationNumber?: string | null;
  storeSeedLicenseNumber?: string | null;
  storeCommercialRegistrationNumber?: string | null;
};

/** Entity A — registered partnership (formal letterhead). */
export const LEGAL_ENTITY = {
  nameTh: "ห้างหุ้นส่วนจำกัด ทีเอ็มวาย อะโกร เทรด",
  nameEn: "T.M.Y Agro Trade Limited Partnership",
  addressTh: "161 หมู่ 16 ตำบลแม่สาว อำเภอแม่อาย จังหวัดเชียงใหม่ 50280",
  addressEn: "161 Moo 16, Mae Sao, Mae Ai, Chiang Mai, Thailand, 50280",
  seedLicenseNumber: "1011043900042568",
} as const;

/** Entity B — online store brand (Smile Seed Bank). */
export const STORE_ENTITY = {
  nameTh: "ร้านค้าออนไลน์ Smile Seed Bank",
  nameEn: "Smile Seed Bank Online Store",
  brandName: "Smile Seed Bank",
  websiteDisplay: "www.smileseedbank.com",
  websiteUrl: "https://www.smileseedbank.com",
  commercialRegistrationNumber: "1500900026221",
  seedLicenseNumber: "1011043900132566",
  contactEmail: "smileseedsbank@gmail.com",
} as const;

export type LocalizedLegalEntity = {
  name: string;
  address: string;
  seedLicenseNumber: string;
  seedLicenseLabel: string;
  partnershipRegistrationNumber: string | null;
  partnershipRegistrationLabel: string;
};

export type LocalizedStoreEntity = {
  name: string;
  brandName: string;
  websiteDisplay: string;
  websiteUrl: string;
  commercialRegistrationNumber: string;
  commercialRegistrationLabel: string;
  seedLicenseNumber: string;
  seedLicenseLabel: string;
};

export function getLegalEntity(
  locale: LegalLocale,
  partnershipRegistrationOverride?: string | null
): LocalizedLegalEntity {
  const th = locale === "th";
  const partnershipRegistrationNumber = resolveCompanyPartnershipRegistrationNumber(
    partnershipRegistrationOverride
  );
  return {
    name: th ? LEGAL_ENTITY.nameTh : LEGAL_ENTITY.nameEn,
    address: th ? LEGAL_ENTITY.addressTh : LEGAL_ENTITY.addressEn,
    seedLicenseNumber: LEGAL_ENTITY.seedLicenseNumber,
    seedLicenseLabel: th
      ? "ใบอนุญาตขายเมล็ดพันธุ์ควบคุมเลขที่"
      : "Controlled seed sales license number",
    partnershipRegistrationNumber,
    partnershipRegistrationLabel: th
      ? "ทะเบียนห้างหุ้นส่วนจำกัดเลขที่"
      : "Limited partnership registration number",
  };
}

export function getStoreEntity(locale: LegalLocale): LocalizedStoreEntity {
  const th = locale === "th";
  return {
    name: th ? STORE_ENTITY.nameTh : STORE_ENTITY.nameEn,
    brandName: STORE_ENTITY.brandName,
    websiteDisplay: STORE_ENTITY.websiteDisplay,
    websiteUrl: STORE_ENTITY.websiteUrl,
    commercialRegistrationNumber: STORE_ENTITY.commercialRegistrationNumber,
    commercialRegistrationLabel: th ? "ทะเบียนพาณิชย์เลขที่" : "Commercial registration number",
    seedLicenseNumber: STORE_ENTITY.seedLicenseNumber,
    seedLicenseLabel: th
      ? "ใบอนุญาตขายเมล็ดพันธุ์ควบคุมเลขที่"
      : "Controlled seed sales license number",
  };
}

/** Letterhead lines — legal entity + operating brand (EN default for international docs). */
export function formatLetterheadBlock(
  locale: LegalLocale = "en",
  overrides?: LegalDocumentOverrides
): string[] {
  const th = locale === "th";
  const legal = getLegalEntity(locale, overrides?.companyPartnershipRegistrationNumber);
  const store = getStoreEntity(locale);
  const seedLicenseNumber = resolveCompanySeedLicenseNumber(overrides?.companySeedLicenseNumber);
  const lines = [
    legal.name,
    legal.address,
    `${legal.seedLicenseLabel} : ${seedLicenseNumber}`,
  ];
  if (legal.partnershipRegistrationNumber) {
    lines.push(
      `${legal.partnershipRegistrationLabel} : ${legal.partnershipRegistrationNumber}`
    );
  }
  lines.push(
    th ? `ดำเนินการภายใต้แบรนด์ ${store.brandName}` : `Operating as ${store.brandName}`
  );
  return lines;
}

/** Store trust / footer lines for docs and About. */
export function formatStoreTrustBlock(
  locale: LegalLocale = "en",
  overrides?: LegalDocumentOverrides
): string[] {
  const store = getStoreEntity(locale);
  const commercialRegistrationNumber = resolveStoreCommercialRegistrationNumber(
    overrides?.storeCommercialRegistrationNumber
  );
  const seedLicenseNumber = resolveStoreSeedLicenseNumber(overrides?.storeSeedLicenseNumber);
  return [
    store.name,
    store.websiteDisplay,
    `${store.commercialRegistrationLabel} : ${commercialRegistrationNumber}`,
    `${store.seedLicenseLabel} : ${seedLicenseNumber}`,
  ];
}

/** Prefer Admin override when set; else SSOT. */
export function resolveStoreSeedLicenseNumber(override?: string | null): string {
  const v = override?.trim();
  return v || STORE_ENTITY.seedLicenseNumber;
}

export function resolveStoreCommercialRegistrationNumber(override?: string | null): string {
  const v = override?.trim();
  return v || STORE_ENTITY.commercialRegistrationNumber;
}

export function resolveCompanySeedLicenseNumber(override?: string | null): string {
  const v = override?.trim();
  return v || LEGAL_ENTITY.seedLicenseNumber;
}

export function resolveCompanyPartnershipRegistrationNumber(
  override?: string | null
): string | null {
  const v = override?.trim();
  return v || null;
}

export function resolveCompanyContactEmail(override?: string | null): string {
  const v = override?.trim();
  if (v && v.toLowerCase() !== "contact@smileseedbank.com") return v;
  return STORE_ENTITY.contactEmail;
}
