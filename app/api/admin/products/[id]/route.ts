import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ProductSchema } from "@/lib/validations/product";
import {
  computeStartingPrice,
  computeTotalStock,
  resolveProductSlugFromName,
} from "@/lib/product-utils";
import { ensureUniqueProductSlug } from "@/services/product-service";
import type { ProductVariant } from "@/types/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = parseInt(params.id, 10);
  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = ProductSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: `[${first?.path?.join(".") ?? "field"}] ${first?.message}` },
        { status: 400 }
      );
    }

    const { variants, ...productData } = parsed.data;

    const baseSlug = resolveProductSlugFromName(
      productData.name,
      productData.slug
    );
    const slug = await ensureUniqueProductSlug(baseSlug, productId);

    // Sanitize: undefined optional → null
    const sanitized = Object.fromEntries(
      Object.entries({ ...productData, slug }).map(([k, v]) => [
        k,
        v === undefined ? null : v,
      ])
    );

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // ── 1. Update product row ─────────────────────────────────────────────────
    const { error: productError } = await db
      .from("products")
      .update(sanitized)
      .eq("id", productId);

    if (productError) {
      console.error("[PATCH /api/admin/products] DB Error:", productError.message);
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    // ── 2. Replace all variants (delete → insert) ─────────────────────────────
    const { error: deleteError } = await db
      .from("product_variants")
      .delete()
      .eq("product_id", productId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const variantRows = variants.map((v) => ({ ...v, product_id: productId }));
    const { data: insertedVariants, error: variantError } = await db
      .from("product_variants")
      .insert(variantRows)
      .select();

    if (variantError) {
      return NextResponse.json({ error: variantError.message }, { status: 500 });
    }

    // ── 3. Sync price & stock on parent ───────────────────────────────────────
    const startingPrice = computeStartingPrice(insertedVariants as ProductVariant[]);
    const totalStock = computeTotalStock(insertedVariants as ProductVariant[]);

    await db
      .from("products")
      .update({ price: startingPrice, stock: totalStock })
      .eq("id", productId);

    return NextResponse.json({ productId });
  } catch (err) {
    console.error("[PATCH /api/admin/products] Unexpected:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
