import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { deriveProductIsActiveForCatalog } from "@/lib/validations/product";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  is_active: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = parseInt(params.id, 10);
  if (Number.isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: `[${first?.path?.join(".") ?? "field"}] ${first?.message}` },
      { status: 400 }
    );
  }

  const { is_active: requested } = parsed.data;

  try {
    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: variants, error: vErr } = await db
      .from("product_variants")
      .select("stock")
      .eq("product_id", productId);

    if (vErr) {
      return NextResponse.json({ error: vErr.message }, { status: 500 });
    }

    const rows = (variants ?? []) as { stock?: number | null }[];
    const nextActive = deriveProductIsActiveForCatalog(rows, requested);

    const { error: uErr } = await db
      .from("products")
      .update({ is_active: nextActive })
      .eq("id", productId);

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    return NextResponse.json({
      is_active: nextActive,
      requested,
      couldNotActivate: requested === true && nextActive === false,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/products/.../status]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
