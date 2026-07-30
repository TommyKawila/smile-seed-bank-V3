import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  CLEARANCE_DISCOUNT_PERCENT,
  CLEARANCE_DISCOUNT_PERCENTS,
  normalizeClearanceDiscountPercent,
} from "@/lib/clearance";
import { revalidateClearanceStorefront } from "@/lib/revalidate-clearance";
import {
  addProductToClearance,
  addProductsToClearance,
  listAdminClearanceProducts,
  listClearanceBreederSummary,
  removeProductsFromClearance,
  resyncAllClearancePrices,
  setClearanceProductDiscountPercent,
} from "@/services/clearance-admin-service";

export const dynamic = "force-dynamic";

const DiscountPercentSchema = z
  .number()
  .int()
  .refine((n) => (CLEARANCE_DISCOUNT_PERCENTS as readonly number[]).includes(n), {
    message: "Invalid clearance discount percent",
  });

const AddSchema = z.union([
  z.object({ action: z.literal("resync") }),
  z.object({
    action: z.literal("remove"),
    productIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
  }),
  z.object({
    action: z.literal("setDiscountPercent"),
    productId: z.coerce.number().int().positive(),
    discountPercent: DiscountPercentSchema,
  }),
  z.object({
    productId: z.coerce.number().int().positive(),
    discountPercent: DiscountPercentSchema.optional(),
  }),
  z.object({
    productIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
    discountPercent: DiscountPercentSchema.optional(),
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
      discountPercents: [...CLEARANCE_DISCOUNT_PERCENTS],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
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
      return NextResponse.json({
        ok: true,
        synced,
        /** Per-product percent used — not a single global override. */
        resyncMode: "per_product_percent",
      });
    }

    if ("action" in data && data.action === "remove") {
      const { error, removed } = await removeProductsFromClearance(data.productIds);
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateClearanceStorefront();
      return NextResponse.json({
        ok: true,
        removed,
      });
    }

    if ("action" in data && data.action === "setDiscountPercent") {
      const pct = normalizeClearanceDiscountPercent(data.discountPercent);
      const { error } = await setClearanceProductDiscountPercent(data.productId, pct);
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateClearanceStorefront();
      return NextResponse.json({
        ok: true,
        productId: data.productId,
        discountPercent: pct,
        cartNote:
          "ลูกค้าที่ค้างในตะกร้าอาจยังเห็นราคาเก่า — ต้องลบแล้วเพิ่มสินค้าใหม่ (ยอด checkout คิดจาก DB)",
      });
    }

    if ("productIds" in data) {
      const pct = normalizeClearanceDiscountPercent(
        data.discountPercent ?? CLEARANCE_DISCOUNT_PERCENT
      );
      const { error, added } = await addProductsToClearance(data.productIds, pct);
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateClearanceStorefront();
      return NextResponse.json({
        ok: true,
        added,
        discountPercent: pct,
      });
    }

    const pct = normalizeClearanceDiscountPercent(
      data.discountPercent ?? CLEARANCE_DISCOUNT_PERCENT
    );
    const { error } = await addProductToClearance(data.productId, pct);
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    revalidateClearanceStorefront();
    return NextResponse.json({
      ok: true,
      productId: data.productId,
      discountPercent: pct,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
