import { storefrontStructuredData } from "@/lib/seo/build-storefront-jsonld";
import { JsonLd } from "@/components/seo/JsonLd";

export function StorefrontStructuredData() {
  return <JsonLd data={storefrontStructuredData()} />;
}
