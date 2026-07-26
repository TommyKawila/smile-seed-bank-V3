"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { SeedsChooserBox } from "@/components/storefront/SeedsChooserBox";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import type { SeedsHubPayload } from "@/lib/seeds-hub";
import { seedsBreederHref } from "@/lib/breeder-slug";

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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.16),_transparent_55%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-500/90">
            {t("คลังพันธุกรรม", "GENETIC VAULT")}
          </p>
          <h1 className="mt-1.5 max-w-2xl font-sans text-2xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-4xl">
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
            <p className="text-xs text-muted-foreground sm:text-sm">
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {payload.breeders.map((b) => (
                <SeedsChooserBox
                  key={b.breederId}
                  href={seedsBreederHref(b)}
                  title={b.name}
                  subtitle={countLabel(t, b.productCount)}
                  imageUrl={b.logoUrl}
                  accent="emerald"
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
            <p className="text-xs text-muted-foreground sm:text-sm">
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
            <p className="text-xs text-muted-foreground sm:text-sm">
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
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-primary/40 bg-card/50 px-6 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {t("ดูสินค้าทั้งหมด", "Browse all strains")}
          </Link>
        </div>
      </div>
    </div>
  );
}
