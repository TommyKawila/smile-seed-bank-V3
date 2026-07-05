import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { revalidateClearanceStorefront } from "@/lib/revalidate-clearance";
import { createAdminClient } from "@/lib/supabase/server";
import {
  ProductSchema,
  deriveProductIsActiveForCatalog,
} from "@/lib/validations/product";
import {
  computeStartingPrice,
  computeTotalStock,
  deriveClearanceSalePrice,
  resolveProductSlugFromName,
} from "@/lib/product-utils";
import { ensureUniqueProductSlug } from "@/services/product-service";
import type { ProductVariant } from "@/types/supabase";
import { syncProductImagesForProduct } from "@/lib/product-images-sync";

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

    const { variants, gallery_entries, ...productData } = parsed.data;

    const isActive = deriveProductIsActiveForCatalog(
      variants,
      productData.is_active
    );

    const baseSlug = resolveProductSlugFromName(
      productData.name,
      productData.slug
    );
    const slug = await ensureUniqueProductSlug(baseSlug, productId);

    const syncedSalePrice = deriveClearanceSalePrice(
      productData.is_clearance,
      variants,
      productData.sale_price
    );

    // Sanitize: undefined optional → null
    const sanitized = Object.fromEntries(
      Object.entries({
        ...productData,
        slug,
        is_active: isActive,
        sale_price: syncedSalePrice,
      }).map(([k, v]) => [k, v === undefined ? null : v])
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

    // ── 2. Preserve variant IDs (update/insert; deactivate removed) ────────────
    const { data: existingRaw, error: existingError } = await db
      .from("product_variants")
      .select("*")
      .eq("product_id", productId);
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingVariants = (existingRaw ?? []) as ProductVariant[];
    const existingById = new Map(existingVariants.map((v) => [Number(v.id), v]));
    const unusedExisting = new Set(existingVariants.map((v) => Number(v.id)));
    const findFallbackVariant = (sku: string | null | undefined, unitLabel: string) => {
      const skuKey = sku?.trim().toLowerCase();
      const labelKey = unitLabel.trim().toLowerCase();
      return existingVariants.find((v) => {
        const id = Number(v.id);
        if (!unusedExisting.has(id)) return false;
        const existingSku = (v.sku ?? "").trim().toLowerCase();
        if (skuKey && existingSku === skuKey) return true;
        return v.unit_label.trim().toLowerCase() === labelKey;
      });
    };

    const savedVariants: ProductVariant[] = [];
    for (const variant of variants) {
      const { id, ...variantData } = variant;
      const fallback = id == null ? findFallbackVariant(variant.sku, variant.unit_label) : null;
      const targetId = id != null && existingById.has(id) ? id : fallback ? Number(fallback.id) : null;
      const payload = { ...variantData, product_id: productId };

      if (targetId != null) {
        const { data: updated, error: variantError } = await db
          .from("product_variants")
          .update(payload)
          .eq("id", targetId)
          .eq("product_id", productId)
          .select()
          .single();
        if (variantError) {
          return NextResponse.json({ error: variantError.message }, { status: 500 });
        }
        unusedExisting.delete(targetId);
        savedVariants.push(updated as ProductVariant);
      } else {
        const { data: inserted, error: variantError } = await db
          .from("product_variants")
          .insert(payload)
          .select()
          .single();
        if (variantError) {
          return NextResponse.json({ error: variantError.message }, { status: 500 });
        }
        savedVariants.push(inserted as ProductVariant);
      }
    }

    const removedVariantIds = [...unusedExisting];
    if (removedVariantIds.length > 0) {
      const { error: deactivateError } = await db
        .from("product_variants")
        .update({ is_active: false, stock: 0 })
        .in("id", removedVariantIds);
      if (deactivateError) {
        return NextResponse.json({ error: deactivateError.message }, { status: 500 });
      }
    }

    // ── 3. Sync price & stock on parent ───────────────────────────────────────
    const startingPrice = computeStartingPrice(savedVariants);
    const totalStock = computeTotalStock(savedVariants);

    await db
      .from("products")
      .update({ price: startingPrice, stock: totalStock })
      .eq("id", productId);

    await syncProductImagesForProduct(
      productId,
      gallery_entries?.map((entry) => ({
        url: entry.url,
        is_main: entry.is_main,
        variant_unit_label: entry.variant_unit_label ?? null,
      })),
      savedVariants.map((v) => ({
        id: Number(v.id),
        unit_label: v.unit_label,
      }))
    );

    revalidateTag("storefront-home");
    revalidateClearanceStorefront();

    return NextResponse.json({ productId });
  } catch (err) {
    console.error("[PATCH /api/admin/products] Unexpected:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
