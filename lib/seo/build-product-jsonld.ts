import { plainTextFromHtml } from "@/lib/magazine-seo";
import { buildDetailGalleryUrls } from "@/lib/product-gallery-utils";
import { computeStartingPrice, computeTotalStock, productDetailHref } from "@/lib/product-utils";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import type { ProductFull } from "@/types/supabase";

/** Lab-style readouts for AIO / LLM parsing (plain text, not font-specific). */
function formatCbdJsonLd(raw: string | number | null | undefined): string {
  if (raw == null || raw === "") return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (s.includes("%") || /^[<>≤≥]/.test(s)) return s;
  return `${s}%`;
}

export function buildProductJsonLd(product: ProductFull, siteOrigin: string): Record<string, unknown> {
  const path = productDetailHref(product);
  const productUrl = `${siteOrigin}${path}`;
  const rawImages = buildDetailGalleryUrls(product, null);
  const images = [
    ...new Set(
      rawImages
        .map((u) => resolvePublicAssetUrl(u))
        .filter((u): u is string => typeof u === "string" && u.length > 0)
    ),
  ];

  const description = plainTextFromHtml(
    (product.description_th || product.description_en || "").trim() || ""
  ).slice(0, 8000);

  const brandName = product.breeders?.name?.trim() || "Smile Seed Bank";
  const variants = product.product_variants ?? [];
  const price = computeStartingPrice(variants);
  const totalStock = computeTotalStock(variants);
  const availability =
    totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const additionalProperty: Record<string, unknown>[] = [];
  if (product.thc_percent != null && Number.isFinite(Number(product.thc_percent))) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "THC",
      value: `${product.thc_percent}%`,
    });
  }
  const cbd = formatCbdJsonLd(product.cbd_percent);
  if (cbd) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "CBD",
      value: cbd,
    });
  }
  if (product.yield_info?.trim()) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Yield",
      value: product.yield_info.trim(),
    });
  }

  const offers: Record<string, unknown> = {
    "@type": "Offer",
    url: productUrl,
    priceCurrency: "THB",
    availability,
    seller: {
      "@type": "Organization",
      name: "Smile Seed Bank",
      url: siteOrigin,
    },
  };
  if (price > 0) {
    offers.price = String(price);
  }

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    brand: { "@type": "Brand", name: brandName },
    offers,
  };

  if (description) node.description = description;
  if (images.length > 0) node.image = images;
  const sku = product.master_sku?.trim();
  if (sku) node.sku = sku;
  if (additionalProperty.length > 0) node.additionalProperty = additionalProperty;

  return node;
}
