import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { revalidateClearanceStorefront } from "@/lib/revalidate-clearance";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createProductWithVariants } from "@/services/product-service";
import { syncProductImagesForProduct } from "@/lib/product-images-sync";
import type { Product, ProductVariant } from "@/types/supabase";
import {
  ProductSchema,
  deriveProductIsActiveForCatalog,
} from "@/lib/validations/product";
import { applyClearancePricesToVariants, normalizeClearanceDiscountPercent } from "@/lib/clearance";
import { deriveClearanceSalePrice } from "@/lib/product-utils";
import { prisma } from "@/lib/prisma";
import {
  adminProductsOrderBy,
  buildAdminProductsWhere,
} from "@/lib/admin-products-list-query";
import {
  adminProductListInclude,
  serializeAdminProductForList,
} from "@/lib/serialize-admin-product-list";
import { toMasterSku, toVariantSku } from "@/lib/sku-utils";

type ProductInsert = Omit<Product, "id" | "price" | "stock">;
type VariantInsert = Omit<ProductVariant, "id" | "product_id">;

export const dynamic = "force-dynamic";
const AdminProductsQuerySchema = z.object({
  idsOnly: z.enum(["0", "1"]).optional(),
  minimal: z.enum(["0", "1"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  view: z.string().optional(),
  featured: z.enum(["0", "1"]).optional(),
}).passthrough();

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  try {
    const parsedQuery = AdminProductsQuerySchema.safeParse(Object.fromEntries(sp));
    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    if (sp.get("idsOnly") === "1") {
      const where = await buildAdminProductsWhere(prisma, sp);
      const featured = sp.get("view") === "featured" || sp.get("featured") === "1";
      const orderBy = adminProductsOrderBy(featured);
      const [totalCount, rows] = await Promise.all([
        prisma.products.count({ where }),
        prisma.products.findMany({
          where,
          orderBy,
          select: { id: true },
        }),
      ]);
      return NextResponse.json({
        ids: rows.map((r) => Number(r.id)),
        totalCount,
      });
    }

    const legacyMinimal =
      sp.get("minimal") === "1" || [...sp.keys()].length === 0;
    if (legacyMinimal) {
      const supabase = await createAdminClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, breeder_id")
        .eq("is_active", true)
        .order("name");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data ?? []);
    }

    const pageRaw = parseInt(sp.get("page") ?? "1", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limitRaw = parseInt(sp.get("limit") ?? "50", 10);
    const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 50));

    const where = await buildAdminProductsWhere(prisma, sp);
    const featured = sp.get("view") === "featured" || sp.get("featured") === "1";
    const orderBy = adminProductsOrderBy(featured);

    const totalCount = await prisma.products.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    const rows = await prisma.products.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: adminProductListInclude,
    });

    return NextResponse.json({
      products: rows.map(serializeAdminProductForList),
      totalCount,
      totalPages,
      currentPage,
      pageSize: limit,
    });
  } catch (err) {
    console.error("[GET /api/admin/products]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
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

    const { variants: rawVariants, gallery_entries, ...productData } = parsed.data;
    const clearancePct =
      productData.is_clearance === true
        ? normalizeClearanceDiscountPercent(
            (productData as { clearance_discount_percent?: number | null })
              .clearance_discount_percent
          )
        : null;

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    let masterSku = (productData.master_sku ?? "").toString().trim() || null;
    if (
      !masterSku &&
      productData.name?.trim() &&
      productData.breeder_id != null
    ) {
      const { data: breeder } = await db
        .from("breeders")
        .select("name")
        .eq("id", productData.breeder_id)
        .maybeSingle();
      const brand = (breeder?.name ?? "").toString().trim();
      if (brand) masterSku = toMasterSku(brand, productData.name);
    }

    const variantsWithClearance =
      productData.is_clearance === true
        ? applyClearancePricesToVariants(rawVariants, clearancePct ?? undefined)
        : rawVariants.map((v) => ({ ...v, clearance_price: null }));

    const variants = masterSku
      ? variantsWithClearance.map((v) => ({
          ...v,
          sku: toVariantSku(masterSku, v.unit_label),
        }))
      : variantsWithClearance;

    const syncedSalePrice = deriveClearanceSalePrice(
      productData.is_clearance === true,
      variants,
      null
    );
    /** Pack membership = clearance_price > 0; do not keep is_clearance without priced packs. */
    const isClearance =
      productData.is_clearance === true && syncedSalePrice != null && syncedSalePrice > 0;

    const isActive = deriveProductIsActiveForCatalog(
      variants,
      productData.is_active
    );

    // Sanitize: replace undefined optional strings with null for Supabase
    const sanitized = Object.fromEntries(
      Object.entries({
        ...productData,
        master_sku: masterSku,
        is_clearance: isClearance,
        clearance_discount_percent: isClearance ? clearancePct : null,
        is_active: isActive,
        sale_price: syncedSalePrice,
      }).map(([k, v]) => [k, v === undefined ? null : v])
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
        gallery_entries?.map((entry) => ({
          url: entry.url,
          is_main: entry.is_main,
          variant_unit_label: entry.variant_unit_label ?? null,
        })),
        result.data.variants.map((v) => ({
          id: Number(v.id),
          unit_label: v.unit_label,
        }))
      );
    }

    revalidateTag("storefront-home");
    revalidateTag("storefront-catalog");
    revalidateClearanceStorefront();

    return NextResponse.json(
      { productId: result.data?.productId },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/admin/products] Unexpected Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
