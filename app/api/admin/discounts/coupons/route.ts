import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import type { PromoCode } from "@/types/supabase";

const CreateCouponSchema = z.object({
  code: z.string().min(1).max(50).transform((s) => s.trim().toUpperCase()),
  discount_type: z.enum(["PERCENTAGE", "FIXED"]),
  discount_value: z.number().min(0),
  min_spend: z.number().min(0).nullable().optional(),
  is_active: z.boolean().optional().default(true),
  usage_limit_per_user: z.number().int().min(1).max(999).optional().default(1),
  requires_auth: z.boolean().optional().default(false),
  first_order_only: z.boolean().optional().default(false),
});

export async function GET() {
  const supabase = await createAdminClient();
  const { data: codes, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("code");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: usages } = await supabase.from("promo_code_usages").select("promo_code_id");
  const countByCode = new Map<number, number>();
  for (const u of usages ?? []) {
    countByCode.set(u.promo_code_id, (countByCode.get(u.promo_code_id) ?? 0) + 1);
  }

  const list = (codes ?? []).map((c) => ({
    ...c,
    used_count: countByCode.get(c.id) ?? 0,
  }));

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      code: parsed.data.code,
      discount_type: parsed.data.discount_type,
      discount_value: parsed.data.discount_value,
      min_spend: parsed.data.min_spend ?? null,
      is_active: parsed.data.is_active ?? true,
      usage_limit_per_user: parsed.data.usage_limit_per_user ?? 1,
      requires_auth: parsed.data.requires_auth ?? false,
      first_order_only: parsed.data.first_order_only ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, used_count: 0 });
}
