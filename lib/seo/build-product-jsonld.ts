import { plainTextFromHtml } from "@/lib/magazine-seo";
import { buildDetailGalleryUrls } from "@/lib/product-gallery-utils";
import {
  computeTotalStock,
  getEffectiveListingPrice,
  productDetailHref,
} from "@/lib/product-utils";
import { resolvePublicAssetUrl } from "@/lib/public-storage-url";
import { SHIPPING_ADMIN_DEFAULT_FEE } from "@/lib/validations/shipping-admin";
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
  const price = getEffectiveListingPrice(product);
  const totalStock = computeTotalStock(variants);
  const availability =
    totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const offerId = `${productUrl}#offer`;
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);
  const priceValidUntil = validUntil.toISOString().slice(0, 10);

  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "TH",
    },
    shippingRate: {
      "@type": "MonetaryAmount",
      value: String(SHIPPING_ADMIN_DEFAULT_FEE),
      currency: "THB",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 2,
        unitText: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 7,
        unitText: "DAY",
      },
    },
    name: "Standard shipping (Thailand)",
  };

  const hasMerchantReturnPolicy = {
    "@type": "MerchantReturnPolicy",
    "@id": `${siteOrigin}/#merchant-return-policy-seeds`,
    applicableCountry: "TH",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
    name: "Seeds are not returnable for change of mind; contact us within 7 days for damaged or incorrect shipments.",
    url: `${siteOrigin}/terms`,
  };

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
    "@id": offerId,
    url: productUrl,
    itemCondition: "https://schema.org/NewCondition",
    priceCurrency: "THB",
    priceValidUntil,
    availability,
    shippingDetails: [shippingDetails],
    hasMerchantReturnPolicy,
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
