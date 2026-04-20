"use client";

import Image from "next/image";
import Link from "next/link";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import { plainTextFromHtml, truncateMetaDescription } from "@/lib/magazine-seo";
import { JOURNAL_PRODUCT_FONT_VARS } from "@/components/storefront/journal-product-fonts";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const serif = "font-[family-name:var(--font-journal-product-serif)]";
const mono = "font-[family-name:var(--font-journal-product-mono)]";

function productNote(product: ProductWithBreeder, isEn: boolean): string {
  const raw = isEn
    ? (product.description_en ?? product.description_th ?? "")
    : (product.description_th ?? product.description_en ?? "");
  const plain = plainTextFromHtml(String(raw));
  return truncateMetaDescription(plain, 220);
}

type TFn = (th: string, en: string) => string;

export function ShopGeneticVaultHero({
  product,
  isEn,
  t,
}: {
  product: ProductWithBreeder;
  isEn: boolean;
  t: TFn;
}) {
  const img = getListingThumbnailUrl(product);
  const note = productNote(product, isEn);
  const thc = product.thc_percent;
  const cbd = product.cbd_percent;
  const yieldInfo = product.yield_info?.trim();

  return (
    <div
      className={cn(
        "border-b border-zinc-100 bg-white px-4 py-10 sm:px-6 sm:py-12",
        JOURNAL_PRODUCT_FONT_VARS
      )}
    >
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 md:items-stretch md:gap-10 lg:gap-12">
        <Link
          href={productDetailHref(product)}
          className="group relative block min-h-[220px] overflow-hidden rounded-sm border border-zinc-100 bg-zinc-50 shadow-sm md:min-h-[320px]"
        >
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
          )}
        </Link>

        <div className="flex min-w-0 flex-col justify-center">
          <p className={cn(mono, "text-[10px] font-medium uppercase tracking-[0.28em] text-zinc-500")}>
            {t("สายพันธุ์เด่น", "FEATURED_STRAIN")}
          </p>
          <h1
            className={cn(
              serif,
              "mt-3 text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-4xl md:text-[2.35rem]"
            )}
          >
            <Link href={productDetailHref(product)} className="hover:text-primary">
              {product.name}
            </Link>
          </h1>

          {product.breeders && (
            <p className={cn(mono, "mt-2 text-[11px] font-normal tabular-nums text-zinc-500")}>
              {product.breeders.name}
            </p>
          )}

          <dl
            className={cn(
              mono,
              "mt-5 grid max-w-md grid-cols-3 gap-3 border-y border-zinc-100 py-4 text-[11px] uppercase tracking-wide text-zinc-600"
            )}
          >
            <div>
              <dt className="text-[9px] tracking-[0.2em] text-zinc-400">THC</dt>
              <dd className="mt-1 tabular-nums">{thc != null ? `${thc}%` : "—"}</dd>
            </div>
            <div>
              <dt className="text-[9px] tracking-[0.2em] text-zinc-400">CBD</dt>
              <dd className="mt-1 tabular-nums">{cbd != null && cbd !== "" ? String(cbd) : "—"}</dd>
            </div>
            <div>
              <dt className="text-[9px] tracking-[0.2em] text-zinc-400">
                {t("ผลผลิต", "YIELD")}
              </dt>
              <dd className="mt-1 line-clamp-2 text-[10px] font-normal normal-case leading-snug tracking-normal text-zinc-700">
                {yieldInfo || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className={cn(mono, "text-[9px] font-medium uppercase tracking-[0.22em] text-zinc-400")}>
              {t("บันทึกจากผู้ผลิต", "BREEDER'S_NOTE")}
            </p>
            <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-zinc-600">
              {note || t("รายละเอียดกำลังจัดเตรียม", "Archive entry in preparation.")}
            </p>
          </div>

          <Link
            href={productDetailHref(product)}
            className={cn(
              mono,
              "mt-6 inline-flex w-fit items-center text-xs font-medium tabular-nums text-primary underline-offset-4 hover:underline"
            )}
          >
            {t("เปิดรายงานสายพันธุ์", "Open strain dossier")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
