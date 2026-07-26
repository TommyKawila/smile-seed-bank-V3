import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CLEARANCE_DISCOUNT_PERCENT } from "@/lib/clearance";
import { revalidateClearanceStorefront } from "@/lib/revalidate-clearance";
import {
  addProductToClearance,
  addProductsToClearance,
  listAdminClearanceProducts,
  listClearanceBreederSummary,
  removeProductsFromClearance,
  resyncAllClearancePrices,
} from "@/services/clearance-admin-service";

export const dynamic = "force-dynamic";

const AddSchema = z.union([
  z.object({ productId: z.coerce.number().int().positive() }),
  z.object({
    productIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
  }),
  z.object({ action: z.literal("resync") }),
  z.object({
    action: z.literal("remove"),
    productIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
  }),
]);

export async function GET() {
  try {
    const [products, breederSummary] = await Promise.all([
      listAdminClearanceProducts(),
      listClearanceBreederSummary(),
    ]);
    return NextResponse.json({
      products,
      breederSummary,
      discountPercent: CLEARANCE_DISCOUNT_PERCENT,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AddSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if ("action" in data && data.action === "resync") {
      const { error, synced } = await resyncAllClearancePrices();
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateClearanceStorefront();
      return NextResponse.json({ ok: true, synced, discountPercent: CLEARANCE_DISCOUNT_PERCENT });
    }

    if ("action" in data && data.action === "remove") {
      const { error, removed } = await removeProductsFromClearance(data.productIds);
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateClearanceStorefront();
      return NextResponse.json({
        ok: true,
        removed,
        discountPercent: CLEARANCE_DISCOUNT_PERCENT,
      });
    }

    if ("productIds" in data) {
      const { error, added } = await addProductsToClearance(data.productIds);
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateClearanceStorefront();
      return NextResponse.json({
        ok: true,
        added,
        discountPercent: CLEARANCE_DISCOUNT_PERCENT,
      });
    }

    const { error } = await addProductToClearance(data.productId);
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    revalidateClearanceStorefront();
    return NextResponse.json({
      ok: true,
      productId: data.productId,
      discountPercent: CLEARANCE_DISCOUNT_PERCENT,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
