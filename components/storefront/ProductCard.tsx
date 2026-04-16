"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { BreederLogoImage } from "@/components/storefront/BreederLogoImage";
import { MicroGeneticsBar } from "@/components/storefront/MicroGeneticsBar";
import { formatPrice } from "@/lib/utils";
import { productDetailHref } from "@/lib/product-utils";
import { shopBreederHref } from "@/lib/breeder-slug";
import {
  labelForSeedTypeBadge,
  productCardFloweringChipLabel,
} from "@/lib/seed-type-filter";
import { getListingThumbnailUrl } from "@/lib/product-gallery-utils";
import { CatalogImagePlaceholder } from "@/components/storefront/CatalogImagePlaceholder";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const shopCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const showcaseCardVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const glassBadge =
  "rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur-md";

const journalChip =
  "rounded-full border border-zinc-100 bg-zinc-50/90 px-2 py-0.5 text-[10px] font-normal text-zinc-700";

function getPrimaryImage(product: {
  image_urls?: unknown;
  image_url?: string | null;
  product_images?: unknown;
}): string | null {
  return getListingThumbnailUrl(product);
}

function getDefaultVariant(product: {
  product_variants?: {
    id: number;
    price: number;
    stock: number | null;
    is_active: boolean | null;
    unit_label: string;
  }[];
}) {
  const variants =
    product.product_variants?.filter((v) => v.is_active !== false && (v.stock ?? 0) > 0) ?? [];
  return variants.sort((a, b) => a.price - b.price)[0] ?? null;
}

type Product = ReturnType<typeof useProducts>["products"][number];

export function ProductCard({
  product,
  variant = "shop",
}: {
  product: Product;
  variant?: "shop" | "showcase";
}) {
  const { addToCart, openCart } = useCartContext();
  const { t } = useLanguage();
  const stock = product.stock ?? 0;
  const lowStock = stock > 0 && stock <= 5;
  const outOfStock = stock === 0;
  const defaultVariant = getDefaultVariant(product);
  const cardImage = getPrimaryImage(product);
  const floweringLabel = productCardFloweringChipLabel(product);
  const seedLabel = labelForSeedTypeBadge(product.seed_type);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (defaultVariant) {
      const { error } = addToCart({
        variantId: defaultVariant.id,
        productId: product.id,
        productName: product.name,
        productImage: cardImage,
        unitLabel: defaultVariant.unit_label,
        price: defaultVariant.price,
        quantity: 1,
        stock_quantity: defaultVariant.stock ?? 0,
        masterSku: (product as { master_sku?: string | null }).master_sku ?? null,
        breeder_id: product.breeder_id ?? null,
        breederLogoUrl: product.breeders?.logo_url ?? null,
      });
      if (error) {
        toast.error(error);
        return;
      }
    } else {
      openCart();
    }
  };

  const outlineBtn =
    "h-8 border-emerald-800 bg-white text-xs font-semibold text-emerald-800 shadow-none transition-colors hover:bg-emerald-50";

  if (variant === "showcase") {
    return (
      <motion.div variants={showcaseCardVariant}>
        <div
          className={cn(
            "group flex h-full flex-col overflow-hidden rounded-sm border border-zinc-50 bg-white shadow-sm transition-shadow hover:shadow-md"
          )}
        >
          <div className="relative aspect-square overflow-hidden bg-zinc-50">
            <Link href={productDetailHref(product)} className="absolute inset-0 block">
              {cardImage ? (
                <Image
                  src={cardImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
              )}
            </Link>
            {product.breeders && (
              <Link
                href={shopBreederHref(product.breeders)}
                className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-sm border border-zinc-100 bg-white shadow-sm transition-transform hover:scale-105"
              >
                <BreederLogoImage
                  src={product.breeders.logo_url}
                  breederName={product.breeders.name}
                  width={40}
                  height={40}
                  className="rounded-sm"
                  imgClassName="object-contain p-1"
                  sizes="40px"
                />
              </Link>
            )}
            {(product.stock ?? 0) <= 5 && (product.stock ?? 0) > 0 && (
              <span className="absolute left-2 top-2 z-10 rounded-full border border-red-100 bg-red-50/95 px-2 py-0.5 text-[10px] font-medium text-red-800">
                {t("เหลือน้อย", "Low Stock")}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
            {product.breeders && (
              <Link
                href={shopBreederHref(product.breeders)}
                className="inline-block max-w-fit text-[11px] font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
              >
                {product.breeders.name}
              </Link>
            )}
            <Link href={productDetailHref(product)} className="block min-w-0">
              <h3 className="line-clamp-2 font-[family-name:var(--font-journal-product-serif)] text-base font-medium leading-relaxed tracking-tight text-zinc-900">
                {product.name}
              </h3>
            </Link>
            <div className="flex flex-wrap gap-1.5">
              {floweringLabel && <span className={journalChip}>{floweringLabel}</span>}
              {seedLabel && <span className={journalChip}>{seedLabel}</span>}
              {product.thc_percent != null && (
                <span
                  className={cn(
                    journalChip,
                    "font-[family-name:var(--font-journal-product-mono)] tabular-nums text-zinc-600"
                  )}
                >
                  THC {product.thc_percent}%
                </span>
              )}
            </div>
            <div className="mt-auto flex items-end justify-between gap-3 pt-3">
              <p className="font-[family-name:var(--font-journal-product-mono)] text-base font-medium tabular-nums text-zinc-800">
                {(product.price ?? 0) > 0
                  ? `${formatPrice(product.price ?? 0)}+`
                  : t("สอบถาม", "Inquire")}
              </p>
              <Button size="sm" variant="outline" className={outlineBtn} asChild>
                <Link href={productDetailHref(product)}>{t("ดูสินค้า", "View")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={shopCardVariants}>
      <Link
        href={productDetailHref(product)}
        className="group block overflow-hidden rounded-sm border border-zinc-50 bg-white shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="relative aspect-square overflow-hidden bg-zinc-50">
          {cardImage ? (
            <Image
              src={cardImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`rounded-sm object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${outOfStock ? "opacity-50 grayscale" : ""}`}
            />
          ) : (
            <CatalogImagePlaceholder seed={product.id} className="absolute inset-0" />
          )}

          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {outOfStock && (
              <span className={`${glassBadge} text-zinc-800`}>หมด</span>
            )}
            {lowStock && !outOfStock && (
              <span className={`${glassBadge} text-red-800`}>เหลือน้อย</span>
            )}
          </div>

          {product.breeders && (
            <Link
              href={shopBreederHref(product.breeders)}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 right-2 flex h-9 w-9 overflow-hidden rounded-sm border border-white/40 bg-white/25 shadow-md backdrop-blur-md transition-transform hover:scale-110"
            >
              <BreederLogoImage
                src={product.breeders.logo_url}
                breederName={product.breeders.name}
                width={36}
                height={36}
                className="rounded-sm"
                imgClassName="object-cover"
                sizes="36px"
              />
            </Link>
          )}
        </div>

        <MicroGeneticsBar product={product} />

        <div className="flex flex-col gap-2.5 p-4 sm:p-5">
          {product.breeders && (
            <Link
              href={shopBreederHref(product.breeders)}
              onClick={(e) => e.stopPropagation()}
              className="inline-block max-w-fit text-[11px] font-medium uppercase tracking-wider text-zinc-500"
            >
              {product.breeders.name}
            </Link>
          )}
          <h3 className="line-clamp-2 font-[family-name:var(--font-journal-product-serif)] text-sm font-medium leading-relaxed tracking-tight text-zinc-900 sm:text-base">
            {product.name}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {floweringLabel && <span className={journalChip}>{floweringLabel}</span>}
            {seedLabel && <span className={journalChip}>{seedLabel}</span>}
            {product.thc_percent != null && (
              <span
                className={cn(
                  journalChip,
                  "font-[family-name:var(--font-journal-product-mono)] tabular-nums text-zinc-600"
                )}
              >
                THC {product.thc_percent}%
              </span>
            )}
          </div>

          <div className="mt-1 flex items-end justify-between gap-3 border-t border-zinc-50 pt-3">
            <div>
              <p className="text-[10px] font-normal uppercase tracking-wide text-zinc-400">
                {t("เริ่มต้น", "From")}
              </p>
              <p className="font-[family-name:var(--font-journal-product-mono)] text-base font-medium tabular-nums text-zinc-800">
                {(product.price ?? 0) > 0 ? formatPrice(product.price ?? 0) : t("สอบถาม", "Inquire")}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={outOfStock}
              onClick={handleAdd}
              className={cn(outlineBtn, "disabled:opacity-40")}
            >
              {outOfStock ? t("หมด", "Out") : t("เพิ่ม", "Add")}
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
