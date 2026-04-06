import type { Metadata } from "next";
import { getProductBySlug } from "@/services/product-service";
import ProductDetailClient from "./product-detail-client";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { data } = await getProductBySlug(params.slug);
  if (!data) return { title: "Product" };
  const title = data.name;
  const raw = (data.description_th || data.description_en || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const description = raw ? raw.slice(0, 160) : `${title} — Smile Seed Bank`;
  const canonical = `/product/${params.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: data.image_url ? [{ url: data.image_url, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.image_url ? [data.image_url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const { data } = await getProductBySlug(params.slug);
  return <ProductDetailClient key={params.slug} initialProduct={data} />;
}
