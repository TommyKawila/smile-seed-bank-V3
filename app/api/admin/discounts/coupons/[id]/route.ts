import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

/** Omitted → leave unchanged; null/"" → clear expiry. */
const patchExpiry = z
  .union([z.string(), z.null()])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (val == null || val === "") return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  });

const UpdateCouponSchema = z.object({
  code: z.string().min(1).max(50).transform((s) => s.trim().toUpperCase()).optional(),
  discount_type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discount_value: z.number().min(0).optional(),
  min_spend: z.number().min(0).nullable().optional(),
  expiry_date: patchExpiry,
  is_active: z.boolean().optional(),
  usage_limit_per_user: z.number().int().min(1).max(999).optional(),
  requires_auth: z.boolean().optional(),
  first_order_only: z.boolean().optional(),
});

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await _req.json();
  const parsed = UpdateCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updatePayload = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .update(updatePayload)
    .eq("id", idNum)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
