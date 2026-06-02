import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateClearanceStorefront } from "@/lib/revalidate-clearance";
import {
  removeProductFromClearance,
  updateClearanceVariantPrices,
} from "@/services/clearance-admin-service";

const PricesSchema = z.object({
  variants: z
    .array(
      z.object({
        unit_label: z.string().min(1),
        clearance_price: z.number().min(0).nullable(),
      })
    )
    .min(1),
});

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const { error } = await removeProductFromClearance(productId);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  revalidateClearanceStorefront();
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = PricesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }

    const hasPrice = parsed.data.variants.some((v) => (v.clearance_price ?? 0) > 0);
    if (!hasPrice) {
      return NextResponse.json(
        { error: "กรอกราคาเซลอย่างน้อย 1 แพ็ก" },
        { status: 400 }
      );
    }

    const { error } = await updateClearanceVariantPrices(
      productId,
      parsed.data.variants
    );
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    revalidateClearanceStorefront();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
