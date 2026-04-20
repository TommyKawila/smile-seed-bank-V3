import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createProductWithVariants } from "@/services/product-service";
import { syncProductImagesForProduct } from "@/lib/product-images-sync";
import type { Product, ProductVariant } from "@/types/supabase";
import {
  ProductSchema,
  deriveProductIsActiveForCatalog,
} from "@/lib/validations/product";
import { prisma } from "@/lib/prisma";
import {
  adminProductsOrderBy,
  buildAdminProductsWhere,
} from "@/lib/admin-products-list-query";
import {
  adminProductListInclude,
  serializeAdminProductForList,
} from "@/lib/serialize-admin-product-list";

type ProductInsert = Omit<Product, "id" | "price" | "stock">;
type VariantInsert = Omit<ProductVariant, "id" | "product_id">;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  try {
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
