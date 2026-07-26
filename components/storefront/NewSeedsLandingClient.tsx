"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ProductCard } from "@/components/storefront/ProductCard";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { saveCatalogReturnPath, touchCatalogReturnFromWindow } from "@/lib/catalog-return-path";
import type { ProductWithBreederAndVariants } from "@/lib/supabase/types";

export function NewSeedsLandingClient({
  products,
}: {
  products: ProductWithBreederAndVariants[];
}) {
  const { t } = useLanguage();

  useEffect(() => {
    saveCatalogReturnPath("/new");
  }, []);

  return (
    <div className={`min-h-[60vh] bg-background text-foreground ${JOURNAL_PRODUCT_FONT_VARS}`}>
      <div className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.16),_transparent_55%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-violet-400/90">
            {t("มาใหม่", "NEW DROPS")}
          </p>
          <h1 className="mt-2 max-w-2xl font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("เมล็ดพันธุ์มาใหม่", "New Seeds")}
          </h1>
          <p className="mt-2 max-w-xl text-sm font-light text-muted-foreground">
            {t(
              "สายพันธุ์ที่คัดเข้าคลังล่าสุด — อัปเดตจากกล่อง New Seeds",
              "Latest curated drops from the New Seeds vault."
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {products.length === 0 ? (
          <div className="space-y-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {t("ยังไม่มีสินค้ามาใหม่ในกล่อง", "No new seeds in the box yet")}
            </p>
            <Link
              href="/seeds"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-5 text-sm text-emerald-400 hover:bg-muted"
            >
              {t("ไปหน้ารวมเมล็ดพันธุ์", "Browse all seeds")}
            </Link>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            onClickCapture={(e) => {
              const el = (e.target as HTMLElement).closest("a");
              if (el) touchCatalogReturnFromWindow();
            }}
          >
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href="/seeds?view=all"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-6 text-sm font-medium text-primary hover:bg-primary/20"
          >
            {t("ดูคลังทั้งหมด", "Browse full vault")}
          </Link>
        </div>
      </div>
    </div>
  );
}
