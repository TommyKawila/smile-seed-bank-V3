import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateClearanceStorefront } from "@/lib/revalidate-clearance";
import {
  addProductToClearance,
  listAdminClearanceProducts,
} from "@/services/clearance-admin-service";

export const dynamic = "force-dynamic";

const AddSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export async function GET() {
  try {
    const products = await listAdminClearanceProducts();
    return NextResponse.json({ products });
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

    const { error } = await addProductToClearance(parsed.data.productId);
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    revalidateClearanceStorefront();
    return NextResponse.json({ ok: true, productId: parsed.data.productId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
