import { createClient, createAdminClient } from "@/lib/supabase/server";
import { computeStartingPrice, computeTotalStock, isLowStock } from "@/lib/product-utils";
import type {
  Product,
  ProductVariant,
  ProductFull,
  ProductWithBreeder,
} from "@/types/supabase";

export { computeStartingPrice, computeTotalStock, isLowStock };

type ServiceResult<T> = { data: T | null; error: string | null };

// ─── Storefront Queries ───────────────────────────────────────────────────────

export async function getActiveProducts(opts?: {
  category?: string;
  breeder_id?: number;
  limit?: number;
}): Promise<ServiceResult<ProductWithBreeder[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select("*, breeders(id, name, logo_url)")
      .eq("is_active", true)
      .order("id", { ascending: false });

    if (opts?.category) query = query.eq("category", opts.category);
    if (opts?.breeder_id) query = query.eq("breeder_id", opts.breeder_id);
    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;

    if (error) return { data: null, error: error.message };
    return { data: data as ProductWithBreeder[], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function getProductFull(
  productId: number
): Promise<ServiceResult<ProductFull>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("*, breeders(id, name, logo_url), product_variants(*)")
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (error) return { data: null, error: error.message };

    // Only expose active variants to storefront
    const product = data as ProductFull;
    product.product_variants = product.product_variants.filter(
      (v) => v.is_active
    );

    return { data: product, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── Admin Queries ────────────────────────────────────────────────────────────

export async function getAllProductsAdmin(): Promise<
  ServiceResult<ProductFull[]>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("*, breeders(id, name, logo_url), product_variants(*)")
      .order("id", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as ProductFull[], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createProductWithVariants(
  product: Omit<Product, "id" | "price" | "stock">,
  variants: Omit<ProductVariant, "id" | "product_id">[]
): Promise<ServiceResult<{ productId: number }>> {
  try {
    // Use admin client to bypass RLS — this runs in a server API route
    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Step 1: Insert parent product
    const { data: newProduct, error: productError } = await db
      .from("products")
      .insert({ ...product, price: 0, stock: 0 })
      .select("id")
      .single();

    if (productError) return { data: null, error: productError.message };

    const productId = (newProduct as { id: number }).id;

    // Step 2: Insert child variants
    const variantRows = variants.map((v) => ({ ...v, product_id: productId }));
    const { data: insertedVariants, error: variantError } = await db
      .from("product_variants")
      .insert(variantRows)
      .select();

    if (variantError) return { data: null, error: variantError.message };

    // Step 3: Recalculate and sync price & stock onto parent product
    const startingPrice = computeStartingPrice(insertedVariants as ProductVariant[]);
    const totalStock = computeTotalStock(insertedVariants as ProductVariant[]);

    await db
      .from("products")
      .update({ price: startingPrice, stock: totalStock })
      .eq("id", productId);

    return { data: { productId }, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function syncProductStats(productId: number): Promise<void> {
  const supabase = await createAdminClient();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("price, stock, is_active")
    .eq("product_id", productId);

  if (!variants) return;

  const startingPrice = computeStartingPrice(variants as ProductVariant[]);
  const totalStock = computeTotalStock(variants as ProductVariant[]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("products")
    .update({ price: startingPrice, stock: totalStock })
    .eq("id", productId);
}
