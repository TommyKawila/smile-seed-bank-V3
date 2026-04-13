import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createProductWithVariants } from "@/services/product-service";
import { syncProductImagesForProduct } from "@/lib/product-images-sync";
import type { Product, ProductVariant } from "@/types/supabase";
import {
  ProductSchema,
  deriveProductIsActiveForCatalog,
} from "@/lib/validations/product";
type ProductInsert = Omit<Product, "id" | "price" | "stock">;
type VariantInsert = Omit<ProductVariant, "id" | "product_id">;

export async function GET() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, breeder_id")
    .eq("is_active", true)
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ProductSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const field = firstIssue?.path?.join(".") ?? "unknown";
      return NextResponse.json(
        { error: `[${field}] ${firstIssue?.message ?? "ข้อมูลไม่ถูกต้อง"}` },
        { status: 400 }
      );
    }

    const { variants, gallery_entries, ...productData } = parsed.data;

    const isActive = deriveProductIsActiveForCatalog(
      variants,
      productData.is_active
    );

    // Sanitize: replace undefined optional strings with null for Supabase
    const sanitized = Object.fromEntries(
      Object.entries({ ...productData, is_active: isActive }).map(([k, v]) => [
        k,
        v === undefined ? null : v,
      ])
    ) as unknown as ProductInsert;

    const result = await createProductWithVariants(
      sanitized,
      variants as VariantInsert[]
    );

    if (result.error) {
      console.error("[/api/admin/products] DB Error:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (result.data) {
      await syncProductImagesForProduct(
        result.data.productId,
        gallery_entries,
        result.data.variants.map((v) => ({
          id: Number(v.id),
          unit_label: v.unit_label,
        }))
      );
    }

    return NextResponse.json(
      { productId: result.data?.productId },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/admin/products] Unexpected Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
