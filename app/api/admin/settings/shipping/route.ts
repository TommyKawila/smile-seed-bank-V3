import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  SHIPPING_ADMIN_DEFAULT_FEE,
  SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD,
  ShippingRulesAdminSchema,
} from "@/lib/validations/shipping-admin";
import { STOREFRONT_SHIPPING_CATEGORY } from "@/lib/storefront-shipping";

export async function GET() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("shipping_rules")
    .select("id, category_name, base_fee, free_shipping_threshold, is_active")
    .eq("category_name", STOREFRONT_SHIPPING_CATEGORY)
    .maybeSingle();

  if (error) {
    console.error("[shipping GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      id: null,
      category_name: STOREFRONT_SHIPPING_CATEGORY,
      base_fee: SHIPPING_ADMIN_DEFAULT_FEE,
      free_shipping_threshold: SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD,
    });
  }

  return NextResponse.json({
    id: String(data.id),
    category_name: data.category_name,
    base_fee: Number(data.base_fee ?? SHIPPING_ADMIN_DEFAULT_FEE),
    free_shipping_threshold: Number(
      data.free_shipping_threshold ?? SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD
    ),
    is_active: data.is_active ?? true,
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const parsed = ShippingRulesAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();
  const { base_fee, free_shipping_threshold } = parsed.data;

  const { data: existing } = await supabase
    .from("shipping_rules")
    .select("id")
    .eq("category_name", STOREFRONT_SHIPPING_CATEGORY)
    .maybeSingle();

  if (existing?.id != null) {
    const { error } = await supabase
      .from("shipping_rules")
      .update({
        base_fee,
        free_shipping_threshold,
        is_active: true,
      })
      .eq("id", existing.id);

    if (error) {
      console.error("[shipping PUT update]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("shipping_rules").insert({
      category_name: STOREFRONT_SHIPPING_CATEGORY,
      base_fee,
      free_shipping_threshold,
      is_active: true,
    });

    if (error) {
      console.error("[shipping PUT insert]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
