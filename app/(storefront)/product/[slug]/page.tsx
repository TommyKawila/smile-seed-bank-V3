import type { Metadata } from "next";
import { getProductBySlug } from "@/services/product-service";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import ProductDetailClient from "./product-detail-client";

function cleanProductPath(slug: string): string {
  return `/product/${encodeURIComponent(slug.trim())}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { data } = await getProductBySlug(resolvedParams.slug);
  if (!data) return { title: "Product" };
  const title = data.name;
  const raw = (data.description_th || data.description_en || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const description = raw ? raw.slice(0, 160) : `${title} — Smile Seed Bank`;
  const canonical = cleanProductPath(data.slug?.trim() || resolvedParams.slug);
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
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const { data } = await getProductBySlug(resolvedParams.slug);
  return (
    <>
      {data ? <ProductJsonLd product={data} /> : null}
      <ProductDetailClient key={resolvedParams.slug} initialProduct={data} />
    </>
  );
}
