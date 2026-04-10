import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSql } from "@/lib/db";
import { STOREFRONT_SITE_SETTING_KEYS } from "@/lib/storefront-site-setting-keys";
import type { PdfSettings } from "@/lib/pdf-settings";
import { resolvePdfLogo } from "./pdf-logo";

/** Same data as `fetchStorefrontReceiptPdfSettings` for API routes (DB + logo). */
export async function getStorefrontReceiptPdfSettingsServer(): Promise<PdfSettings> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [...STOREFRONT_SITE_SETTING_KEYS]);

  if (error) {
    console.error("[getStorefrontReceiptPdfSettingsServer] site_settings", error.message);
  }

  const site: Record<string, string> = {};
  for (const r of rows ?? []) {
    if (r.key) site[r.key] = r.value ?? "";
  }

  type BankRow = { bankName: string; accountName: string; accountNo: string; isActive: boolean };
  let bank: BankRow | null = null;
  let lineId: string | null = null;
  try {
    const sql = getSql();
    const pr = await sql<{ bank_accounts: unknown; line_id: string | null }[]>`
      SELECT bank_accounts, line_id FROM payment_settings WHERE id = 1 LIMIT 1
    `;
    const row = pr[0];
    if (row) {
      const allBanks = (row.bank_accounts ?? []) as BankRow[];
      bank = allBanks.find((b) => b.isActive) ?? allBanks[0] ?? null;
      const lid = row.line_id?.trim();
      lineId = lid && lid.length > 0 ? lid : null;
    }
  } catch (e) {
    console.error("[getStorefrontReceiptPdfSettingsServer] payment_settings", e);
  }

  const logoDataUrl = await resolvePdfLogo({
    logo_secondary_png_url: site.logo_secondary_png_url ?? null,
    logo_main_url: site.logo_main_url ?? null,
  });

  let socialLinks: { platform: string; handle: string }[] = [];
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
    companyName: site.company_name?.trim() || "Smile Seed Bank",
    companyAddress: site.company_address ?? null,
    companyEmail: site.company_email ?? null,
    companyPhone: site.company_phone ?? null,
    companyLineId: lineId,
    bankName: bank?.bankName ?? null,
    bankAccountName: bank?.accountName ?? null,
    bankAccountNo: bank?.accountNo ?? null,
    socialLinks,
    legalSeedLicenseUrl: site.legal_seed_license_url ?? null,
    legalSeedLicenseNumber: site.legal_seed_license_number ?? null,
    legalBusinessRegistrationUrl: site.legal_business_registration_url ?? null,
    legalBusinessRegistrationNumber: site.legal_business_registration_number ?? null,
  };
}
