import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const FieldSchema = z.object({
  strain_dominance: z.enum(["Mostly Indica", "Mostly Sativa", "Hybrid 50/50"]).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = parseInt(params.id, 10);
  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = FieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid field" },
        { status: 400 }
      );
    }

    const updates = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ productId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
