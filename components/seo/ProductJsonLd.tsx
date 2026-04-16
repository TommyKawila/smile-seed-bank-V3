import { buildProductJsonLd } from "@/lib/seo/build-product-jsonld";
import { getSiteOrigin } from "@/lib/get-url";
import type { ProductFull } from "@/types/supabase";
import { JsonLd } from "@/components/seo/JsonLd";

export function ProductJsonLd({ product }: { product: ProductFull }) {
  const origin = getSiteOrigin();
  const data = buildProductJsonLd(product, origin);
  return <JsonLd data={data} />;
}
