"use client";

import Link from "next/link";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import { useLanguage } from "@/context/LanguageContext";
import {
  getLegalEntity,
  getStoreEntity,
  resolveCompanySeedLicenseNumber,
  resolveStoreCommercialRegistrationNumber,
  resolveStoreSeedLicenseNumber,
  type LegalLocale,
} from "@/lib/company-legal-identity";
import { cn } from "@/lib/utils";

type Props = {
  companySeedLicenseUrl: string | null;
  companyBusinessRegistrationUrl: string | null;
  companyBusinessRegistrationNumber: string | null;
  storeSeedLicenseUrl: string | null;
  businessRegistrationUrl: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
};

function DocButton({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return (
      <span
        className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 text-sm text-muted-foreground"
        title="Document not uploaded yet"
      >
        <FileText className="h-4 w-4 shrink-0" aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-12 items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-medium text-primary",
        "transition-colors hover:border-primary/60 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      )}
    >
      <FileText className="h-4 w-4 shrink-0" aria-hidden />
      {label}
      <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
    </a>
  );
}

export function AboutPageClient({
  companySeedLicenseUrl,
  companyBusinessRegistrationUrl,
  companyBusinessRegistrationNumber,
  storeSeedLicenseUrl,
  businessRegistrationUrl,
  companyEmail,
  companyPhone,
}: Props) {
  const { locale, t } = useLanguage();
  const lang = (locale === "en" ? "en" : "th") as LegalLocale;
  const legal = getLegalEntity(lang, companyBusinessRegistrationNumber);
  const store = getStoreEntity(lang);
  const companyLicenseNo = resolveCompanySeedLicenseNumber();
  const storeLicenseNo = resolveStoreSeedLicenseNumber();
  const commercialNo = resolveStoreCommercialRegistrationNumber();

  return (
    <article className="mx-auto max-w-3xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32">
      <p className="font-[family-name:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace] text-[10px] font-bold tracking-[0.2em] text-primary">
        EST. 2018
      </p>
      <h1 className="mt-3 font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {t("เกี่ยวกับเรา", "About Us")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {t(
          "Smile Seed Bank เป็นร้านเมล็ดพันธุ์ออนไลน์ที่ดำเนินการโดยห้างหุ้นส่วนจำกัด ทีเอ็มวาย อะโกร เทรด ด้วยใบอนุญาตขายเมล็ดพันธุ์ควบคุมตามกฎหมายไทย — เพื่อความโปร่งใสและความเชื่อมั่นของลูกค้า",
          "Smile Seed Bank is an online seed shop operated by T.M.Y Agro Trade Limited Partnership under Thai controlled-seed sales licenses — built for transparency and customer trust."
        )}
      </p>

      <div className="mt-12 space-y-10">
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-foreground">
            {t("นิติบุคคล", "Legal entity")}
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p className="font-medium text-foreground">{legal.name}</p>
            <p>{legal.address}</p>
            <p>
              {legal.seedLicenseLabel}:{" "}
              <span className="font-mono text-foreground">{companyLicenseNo}</span>
            </p>
            {legal.partnershipRegistrationNumber && (
              <p>
                {legal.partnershipRegistrationLabel}:{" "}
                <span className="font-mono text-foreground">
                  {legal.partnershipRegistrationNumber}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <DocButton
              href={companySeedLicenseUrl}
              label={t("ดูใบอนุญาตเมล็ดพันธุ์ (หจก.)", "View company seed license")}
            />
            <DocButton
              href={companyBusinessRegistrationUrl}
              label={t("ดูทะเบียนห้างหุ้นส่วนจำกัด", "View partnership registration")}
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-foreground">
            {t("ร้านค้าออนไลน์", "Online store")}
          </h2>
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p className="font-medium text-foreground">{store.name}</p>
            <p>
              <a
                href={store.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {store.websiteDisplay}
              </a>
            </p>
            <p>
              {store.commercialRegistrationLabel}:{" "}
              <span className="font-mono text-foreground">{commercialNo}</span>
            </p>
            <p>
              {store.seedLicenseLabel}:{" "}
              <span className="font-mono text-foreground">{storeLicenseNo}</span>
            </p>
            {(companyEmail || companyPhone) && (
              <p className="pt-1">
                {[companyEmail, companyPhone].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <DocButton
              href={businessRegistrationUrl}
              label={t("ดูทะเบียนพาณิชย์", "View commercial registration")}
            />
            <DocButton
              href={storeSeedLicenseUrl}
              label={t("ดูใบอนุญาตเมล็ดพันธุ์ (ร้าน)", "View store seed license")}
            />
          </div>
        </section>

        <section className="space-y-3 border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-foreground">
            {t("ติดต่อและช้อป", "Contact & shop")}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t(
              "เลือกเมล็ดพันธุ์คุณภาพ หรืออ่านนโยบายความเป็นส่วนตัวและเงื่อนไขการใช้งานได้จากลิงก์ด้านล่าง",
              "Browse premium genetics, or read our privacy policy and terms below."
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/seeds"
              className="inline-flex min-h-12 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-emerald-400"
            >
              {t("ดูเมล็ดพันธุ์", "Shop seeds")}
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm text-foreground hover:border-primary/40"
            >
              {t("นโยบายความเป็นส่วนตัว", "Privacy")}
            </Link>
            <Link
              href="/terms"
              className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm text-foreground hover:border-primary/40"
            >
              {t("เงื่อนไขการใช้งาน", "Terms")}
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
