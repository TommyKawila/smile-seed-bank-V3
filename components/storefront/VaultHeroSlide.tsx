"use client";

import Image from "next/image";
import Link from "next/link";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { productDetailHref } from "@/lib/product-utils";
import { plainTextFromHtml, truncateMetaDescription } from "@/lib/magazine-seo";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import type { ProductWithBreeder } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/shimmer-blur";

export type VaultHeroTFn = (th: string, en: string) => string;

function productNote(product: ProductWithBreeder): string {
  const ratio = product.genetic_ratio?.trim();
  if (ratio) {
    const plain = plainTextFromHtml(String(ratio));
    return truncateMetaDescription(plain, 220);
  }
  const dom = product.strain_dominance?.trim();
  if (dom) return truncateMetaDescription(dom, 220);
  const thc = product.thc_percent;
  if (thc != null) return truncateMetaDescription(`THC ${thc}%`, 220);
  return "";
}

export function VaultHeroSlide({
  product,
  isEn: _isEn,
  t,
  priorityImage,
}: {
  product: ProductWithBreeder;
  isEn: boolean;
  t: VaultHeroTFn;
  priorityImage: boolean;
}) {
  const img = getListingThumbnailUrl(product);
  const note = productNote(product);
  const thc = product.thc_percent;
  const cbd = product.cbd_percent;
  const yieldInfo = product.yield_info?.trim();

  const statValClass =
    "mt-1 font-sans text-sm font-semibold tabular-nums leading-snug text-emerald-700 sm:text-base md:text-lg";

  return (
    <div className="min-w-0 px-0">
      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:items-stretch md:gap-10 lg:gap-12">
        <Link
          href={productDetailHref(product)}
          aria-label={`${product.name} — ${t("ดูรูปสายพันธุ์", "Strain image")}`}
          className="group relative order-1 block aspect-[4/3] min-h-[200px] overflow-hidden rounded-sm border border-border bg-muted/30 shadow-sm sm:min-h-[240px] md:min-h-[320px]"
        >
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priorityImage}
              fetchPriority={priorityImage ? "high" : "auto"}
              loading={priorityImage ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR_DATA_URL}
              unoptimized={shouldOffloadImageOptimization(img)}
            />
          ) : (
            <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
          )}
        </Link>

        <div className="order-2 flex min-w-0 flex-col justify-center font-sans">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
            {t("สายพันธุ์เด่น", "FEATURED_STRAIN")}
          </p>
          <h2 className="mt-2 font-sans text-2xl font-bold leading-tight tracking-tight text-foreground sm:mt-3 sm:text-3xl md:text-[2.35rem]">
            <Link href={productDetailHref(product)} className="hover:text-primary" aria-label={product.name}>
              {product.name}
            </Link>
          </h2>

          {product.breeders && (
            <p className="mt-2 font-sans text-[11px] font-normal tabular-nums text-muted-foreground sm:text-xs">
              {product.breeders.name}
            </p>
          )}

          <dl className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 border-y border-border sm:mt-5">
            <div className="min-w-0 py-3 pr-2 sm:py-4 sm:pr-3">
              <dt className="font-sans text-[8px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-[9px] sm:tracking-[0.2em]">
                THC
              </dt>
              <dd className={statValClass}>{thc != null ? `${thc}%` : "—"}</dd>
            </div>
            <div className="min-w-0 px-2 py-3 sm:px-3 sm:py-4">
              <dt className="font-sans text-[8px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-[9px] sm:tracking-[0.2em]">
                CBD
              </dt>
              <dd className={statValClass}>{cbd != null && cbd !== "" ? String(cbd) : "—"}</dd>
            </div>
            <div className="min-w-0 py-3 pl-2 sm:py-4 sm:pl-3">
              <dt className="font-sans text-[8px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-[9px] sm:tracking-[0.2em]">
                {t("ผลผลิต", "YIELD")}
              </dt>
              <dd className={cn(statValClass, "line-clamp-2 normal-case tracking-normal")}>
                {yieldInfo || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 sm:mt-6">
            <p className="font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]">
              {t("บันทึกจากผู้ผลิต", "BREEDER'S_NOTE")}
            </p>
            <p className="mt-2 max-w-xl font-sans text-sm font-normal leading-relaxed text-muted-foreground">
              {note || t("รายละเอียดกำลังจัดเตรียม", "Archive entry in preparation.")}
            </p>
          </div>

          <Link
            href={productDetailHref(product)}
            aria-label={t("เปิดรายงานสายพันธุ์ — รายละเอียดสินค้า", "Open strain dossier — product details")}
            className="mt-5 inline-flex w-fit items-center font-sans text-xs font-semibold tabular-nums text-primary underline-offset-4 hover:underline sm:mt-6"
          >
            {t("เปิดรายงานสายพันธุ์", "Open strain dossier")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
