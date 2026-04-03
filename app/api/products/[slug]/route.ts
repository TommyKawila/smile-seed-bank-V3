import { NextResponse } from "next/server";
import { getProductBySlug } from "@/services/product-service";

/** Public JSON for product by slug (same normalization + text sanitization as storefront RSC). */
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { data, error } = await getProductBySlug(params.slug);
  if (error || !data) {
    return NextResponse.json({ error: error ?? "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
