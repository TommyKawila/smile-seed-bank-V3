import "server-only";

import { prisma } from "@/lib/prisma";
import { generateSlug, computeTotalStock } from "@/lib/product-utils";
import { PRODUCT_KIND_MERCH } from "@/lib/product-kind";
import {
  isMerchCategoryId,
  type MerchCategoryId,
} from "@/lib/merch-catalog";
import {
  adminProductListInclude,
  serializeAdminProductForList,
} from "@/lib/serialize-admin-product-list";
import type { ProductFull } from "@/types/supabase";

export type MerchVariantInput = {
  id?: number;
  unit_label: string;
  price: number;
  stock: number;
  sku?: string | null;
};

export type MerchProductInput = {
  name: string;
  slug?: string;
  breeder_id: number;
  merch_category: MerchCategoryId;
  description_th?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  variants: MerchVariantInput[];
};

export type AdminMerchProduct = ProductFull & {
  product_kind: string;
  merch_category: string | null;
};

async function uniqueSlug(base: string, excludeId?: bigint): Promise<string> {
  let candidate = generateSlug(base);
  if (!candidate) candidate = "merch-item";
  let n = 0;
  for (;;) {
    const slug = n === 0 ? candidate : `${candidate}-${n}`;
    const existing = await prisma.products.findFirst({
      where: {
        slug,
        ...(excludeId != null ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    n += 1;
  }
}

function validateMerchInput(input: MerchProductInput): string | null {
  if (!input.name.trim()) return "Name is required";
  if (!Number.isFinite(input.breeder_id) || input.breeder_id <= 0) {
    return "Breeder is required";
  }
  if (!isMerchCategoryId(input.merch_category)) {
    return "Invalid merch category";
  }
  if (!input.variants.length) return "At least one variant is required";
  for (const v of input.variants) {
    if (!v.unit_label.trim()) return "Variant size/label is required";
    if (!Number.isFinite(v.price) || v.price < 0) return "Invalid variant price";
    if (!Number.isFinite(v.stock) || v.stock < 0) return "Invalid variant stock";
  }
  return null;
}

function minVariantPrice(variants: MerchVariantInput[]): number {
  return Math.min(...variants.map((v) => v.price));
}

export async function listAdminMerchProducts(): Promise<AdminMerchProduct[]> {
  const rows = await prisma.products.findMany({
    where: { product_kind: PRODUCT_KIND_MERCH },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    include: adminProductListInclude,
  });
  return rows.map((p) => ({
    ...(serializeAdminProductForList(p) as unknown as ProductFull),
    product_kind: p.product_kind,
    merch_category: p.merch_category,
  }));
}

export async function createMerchProduct(
  input: MerchProductInput
): Promise<{ error: string | null; productId?: number }> {
  const err = validateMerchInput(input);
  if (err) return { error: err };

  try {
    const slug = await uniqueSlug(input.slug?.trim() || input.name);
    const minPrice = minVariantPrice(input.variants);
    const totalStock = computeTotalStock(
      input.variants.map((v) => ({ stock: v.stock, is_active: true }))
    );

    const created = await prisma.products.create({
      data: {
        name: input.name.trim(),
        slug,
        breeder_id: BigInt(input.breeder_id),
        product_kind: PRODUCT_KIND_MERCH,
        merch_category: input.merch_category,
        description_th: input.description_th?.trim() || null,
        description_en: input.description_en?.trim() || null,
        image_url: input.image_url?.trim() || null,
        is_active: input.is_active ?? true,
        price: minPrice,
        stock: totalStock,
        product_variants: {
          create: input.variants.map((v) => ({
            unit_label: v.unit_label.trim(),
            price: v.price,
            stock: Math.floor(v.stock),
            sku: v.sku?.trim() || null,
            is_active: true,
          })),
        },
      },
      select: { id: true },
    });

    return { error: null, productId: Number(created.id) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateMerchProduct(
  productId: number,
  input: MerchProductInput
): Promise<{ error: string | null }> {
  const err = validateMerchInput(input);
  if (err) return { error: err };

  try {
    const existing = await prisma.products.findUnique({
      where: { id: BigInt(productId) },
      select: { id: true, product_kind: true, slug: true },
    });
    if (!existing || existing.product_kind !== PRODUCT_KIND_MERCH) {
      return { error: "Merch product not found" };
    }

    const slug =
      input.slug?.trim()
        ? await uniqueSlug(input.slug.trim(), existing.id)
        : existing.slug ?? (await uniqueSlug(input.name, existing.id));
    const minPrice = minVariantPrice(input.variants);
    const totalStock = computeTotalStock(
      input.variants.map((v) => ({ stock: v.stock, is_active: true }))
    );

    const keepIds = input.variants
      .map((v) => v.id)
      .filter((id): id is number => id != null && Number.isFinite(id));

    await prisma.$transaction(async (tx) => {
      await tx.products.update({
        where: { id: existing.id },
        data: {
          name: input.name.trim(),
          slug,
          breeder_id: BigInt(input.breeder_id),
          merch_category: input.merch_category,
          description_th: input.description_th?.trim() || null,
          description_en: input.description_en?.trim() || null,
          image_url: input.image_url?.trim() || null,
          is_active: input.is_active ?? true,
          price: minPrice,
          stock: totalStock,
        },
      });

      if (keepIds.length > 0) {
        await tx.product_variants.deleteMany({
          where: {
            product_id: existing.id,
            id: { notIn: keepIds.map((id) => BigInt(id)) },
          },
        });
      } else {
        await tx.product_variants.deleteMany({
          where: { product_id: existing.id },
        });
      }

      for (const v of input.variants) {
        if (v.id != null && Number.isFinite(v.id)) {
          await tx.product_variants.update({
            where: { id: BigInt(v.id) },
            data: {
              unit_label: v.unit_label.trim(),
              price: v.price,
              stock: Math.floor(v.stock),
              sku: v.sku?.trim() || null,
              is_active: true,
            },
          });
        } else {
          await tx.product_variants.create({
            data: {
              product_id: existing.id,
              unit_label: v.unit_label.trim(),
              price: v.price,
              stock: Math.floor(v.stock),
              sku: v.sku?.trim() || null,
              is_active: true,
            },
          });
        }
      }
    });

    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deactivateMerchProduct(
  productId: number
): Promise<{ error: string | null }> {
  try {
    const existing = await prisma.products.findUnique({
      where: { id: BigInt(productId) },
      select: { product_kind: true },
    });
    if (!existing || existing.product_kind !== PRODUCT_KIND_MERCH) {
      return { error: "Merch product not found" };
    }
    await prisma.products.update({
      where: { id: BigInt(productId) },
      data: { is_active: false },
    });
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
