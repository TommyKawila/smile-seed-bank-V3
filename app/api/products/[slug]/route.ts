import { NextResponse } from "next/server";
import { getProductBySlug } from "@/services/product-service";

/** Public JSON for product by slug (same normalization + text sanitization as storefront RSC). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { data, error } = await getProductBySlug(slug);
  if (error || !data) {
    return NextResponse.json({ error: error ?? "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
