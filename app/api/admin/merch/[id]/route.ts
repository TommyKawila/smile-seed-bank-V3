import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateMerchStorefront } from "@/lib/revalidate-merch";
import {
  deactivateMerchProduct,
  updateMerchProduct,
  type MerchProductInput,
} from "@/services/merch-admin-service";

export const dynamic = "force-dynamic";

const MerchCategorySchema = z.enum(["tees", "caps", "pins", "stickers"]);

const VariantSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  unit_label: z.string().min(1).max(64),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  sku: z.string().max(64).nullable().optional(),
});

const PatchSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  breeder_id: z.coerce.number().int().positive(),
  merch_category: MerchCategorySchema,
  description_th: z.string().max(5000).nullable().optional(),
  description_en: z.string().max(5000).nullable().optional(),
  image_url: z.string().max(2000).nullable().optional(),
  is_active: z.boolean().optional(),
  variants: z.array(VariantSchema).min(1).max(20),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }

    const input: MerchProductInput = {
      ...parsed.data,
      image_url: parsed.data.image_url || null,
      variants: parsed.data.variants,
    };

    const { error } = await updateMerchProduct(productId, input);
    if (error) return NextResponse.json({ error }, { status: 400 });

    revalidateMerchStorefront();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const { error } = await deactivateMerchProduct(productId);
    if (error) return NextResponse.json({ error }, { status: 500 });

    revalidateMerchStorefront();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
