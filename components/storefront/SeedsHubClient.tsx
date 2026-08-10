"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { SeedsChooserBox } from "@/components/storefront/SeedsChooserBox";
import { VaultBreederBoxCard } from "@/components/storefront/VaultBreederBoxCard";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { SeedsHubPayload } from "@/lib/seeds-hub";
import { VAULT_ACCENT } from "@/lib/storefront-category-accents";
import { cn } from "@/lib/utils";

function countLabel(
  t: (th: string, en: string) => string,
  n: number | null
): string | undefined {
  if (n == null || n <= 0) return undefined;
  return t(`${n} สินค้า`, `${n} strains`);
}

export function SeedsHubClient({ payload }: { payload: SeedsHubPayload }) {
  const { t, locale } = useLanguage();

  return (
    <div className={`min-h-0 bg-background text-foreground sm:min-h-[60vh] ${JOURNAL_PRODUCT_FONT_VARS}`}>
      <div className="relative overflow-hidden border-b border-border">
        <div aria-hidden className={VAULT_ACCENT.heroRadial} />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-14">
          <p className={VAULT_ACCENT.eyebrow}>
            {t("คลังพันธุกรรม", "GENETIC VAULT")}
          </p>
          <h1 className={VAULT_ACCENT.titleGradient}>
            {t("เมล็ดพันธุ์ทั้งหมด", "All Seeds")}
          </h1>
          <p className="mt-1.5 max-w-xl text-xs font-light text-muted-foreground sm:mt-2 sm:text-sm">
            {t(
              "เลือกทางเข้า — ค่าย · ประเภทดอก · หรือ genetics — แล้วค่อยกรองละเอียดต่อ",
              "Pick an entry — breeder, flowering type, or genetics — then refine with filters."
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-5 sm:space-y-12 sm:px-6 sm:py-12">
        <section className="space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              {t("เลือกตามค่าย", "Shop by breeder")}
            </h2>
            <p className={cn("text-xs sm:text-sm", VAULT_ACCENT.sectionHint)}>
              {t("กล่องค่ายที่มีสินค้าในคลัง", "Breeders with strains in the vault")}
            </p>
          </div>
          {payload.breeders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t(
                "โหลดรายชื่อค่ายไม่สำเร็จ หรือยังไม่มีสินค้าในคลัง — ลองรีเฟรช หรือกดดูสินค้าทั้งหมดด้านล่าง",
                "Couldn’t load breeders, or none have products yet — refresh, or browse all strains below."
              )}
            </p>
          ) : (
            <div className="grid auto-rows-[minmax(10rem,auto)] grid-cols-2 gap-3 md:grid-cols-4">
              {payload.breeders.map((b, index) => (
                <VaultBreederBoxCard
                  key={b.breederId}
                  box={b}
                  featured={index === 0}
                  style={{ animationDelay: `${Math.min(index, 8) * 80}ms` }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              {t("เลือกตามประเภทดอก", "Shop by flowering")}
            </h2>
            <p className={cn("text-xs sm:text-sm", VAULT_ACCENT.sectionHint)}>
              {t("ออโต้ หรือ โฟโต้พีเรียด", "Autoflower or photoperiod")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            {payload.flowering.map((box) => (
              <SeedsChooserBox
                key={box.id}
                href={box.href}
                title={locale === "en" ? box.labelEn : box.labelTh}
                subtitle={countLabel(t, box.productCount)}
                accent={box.accent}
                imageUrl={box.imageUrl}
                imageFit="cover"
              />
            ))}
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              {t("เลือกตาม Genetics", "Shop by genetics")}
            </h2>
            <p className={cn("text-xs sm:text-sm", VAULT_ACCENT.sectionHint)}>
              {t("ซาติวา · อินดิกา · ไฮบริด", "Sativa · Indica · Hybrid")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {payload.genetics.map((box) => (
              <SeedsChooserBox
                key={box.id}
                href={box.href}
                title={locale === "en" ? box.labelEn : box.labelTh}
                subtitle={countLabel(t, box.productCount)}
                accent={box.accent}
                imageUrl={box.imageUrl}
                imageFit="cover"
              />
            ))}
          </div>
        </section>

        <div className="border-t border-border pt-6 text-center sm:pt-8">
          <Link
            href="/seeds?view=all"
            className={cn(
              "inline-flex min-h-12 items-center justify-center rounded-lg border px-6 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2",
              VAULT_ACCENT.ctaOutline
            )}
          >
            {t("ดูสินค้าทั้งหมด", "Browse all strains")}
          </Link>
        </div>
      </div>
    </div>
  );
}
