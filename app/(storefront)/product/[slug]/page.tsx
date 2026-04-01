import { getProductBySlug } from "@/services/product-service";
import ProductDetailClient from "./product-detail-client";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const { data } = await getProductBySlug(params.slug);
  return <ProductDetailClient key={params.slug} initialProduct={data} />;
}
