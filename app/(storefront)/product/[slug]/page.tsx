import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProductBySlug } from "@/services/product-service";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import ProductDetailClient from "./product-detail-client";
import { isMerchProduct } from "@/lib/product-kind";
import { merchCategoryHref, type MerchCategoryId } from "@/lib/merch-catalog";
import { breederSlugFromName } from "@/lib/breeder-slug";

function cleanProductPath(slug: string): string {
  return `/product/${encodeURIComponent(slug.trim())}`;
}

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const { data } = await getProductBySlug(slug);
  if (!data) return { title: "Product" };
  const title = data.name;
  const raw = (data.description_th || data.description_en || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const description = raw ? raw.slice(0, 160) : `${title} — Smile Seed Bank`;
  const canonical = cleanProductPath(data.slug?.trim() || slug);
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

async function ProductPageContent({ slug }: { slug: string }) {
  const { data } = await getProductBySlug(slug);

  if (data && isMerchProduct(data)) {
    const breederName = data.breeders?.name;
    const cat = data.merch_category;
    if (breederName && cat) {
      redirect(merchCategoryHref(breederSlugFromName(breederName), cat as MerchCategoryId));
    }
    redirect("/merch");
  }

  return (
    <>
      {data ? <ProductJsonLd product={data} /> : null}
      <ProductDetailClient key={slug} initialProduct={data} />
    </>
  );
}

export default async function ProductPage(props: ProductPageProps) {
  const { slug } = await props.params;
  return <ProductPageContent slug={slug} />;
}
