import { requireAdminUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  SHIPPING_ADMIN_DEFAULT_FEE,
  SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD,
  ShippingAdminPutSchema,
} from "@/lib/validations/shipping-admin";
import { STOREFRONT_SHIPPING_CATEGORY } from "@/lib/storefront-shipping";
import { SHIPPING_PAUSE_KEYS } from "@/lib/shipping-pause";

const PAUSE_KEY_LIST = Object.values(SHIPPING_PAUSE_KEYS);

async function fetchPauseSettings(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", PAUSE_KEY_LIST);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.key) map[row.key] = row.value ?? "";
  }

  return {
    shipping_pause_enabled: map[SHIPPING_PAUSE_KEYS.enabled] === "true",
    shipping_pause_from: map[SHIPPING_PAUSE_KEYS.from] ?? "",
    shipping_pause_until: map[SHIPPING_PAUSE_KEYS.until] ?? "",
    shipping_pause_message_th: map[SHIPPING_PAUSE_KEYS.messageTh] ?? "",
    shipping_pause_message_en: map[SHIPPING_PAUSE_KEYS.messageEn] ?? "",
  };
}

export async function GET() {
  const supabase = await createAdminClient();
  const [rulesRes, pause] = await Promise.all([
    supabase
      .from("shipping_rules")
      .select("id, category_name, base_fee, free_shipping_threshold, is_active")
      .eq("category_name", STOREFRONT_SHIPPING_CATEGORY)
      .maybeSingle(),
    fetchPauseSettings(supabase),
  ]);

  const { data, error } = rulesRes;

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
      ...pause,
    });
  }

  return NextResponse.json({
    id: String(data.id),
    category_name: data.category_name,
    base_fee: Number(data.base_fee ?? SHIPPING_ADMIN_DEFAULT_FEE),
    free_shipping_threshold: Number(
      data.free_shipping_threshold ?? SHIPPING_ADMIN_DEFAULT_FREE_THRESHOLD,
    ),
    is_active: data.is_active ?? true,
    ...pause,
  });
}

export async function PUT(req: Request) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
  const body = await req.json();
  const parsed = ShippingAdminPutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const supabase = await createAdminClient();
  const {
    base_fee,
    free_shipping_threshold,
    shipping_pause_enabled,
    shipping_pause_from,
    shipping_pause_until,
    shipping_pause_message_th,
    shipping_pause_message_en,
  } = parsed.data;

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

  const pauseRows = [
    { key: SHIPPING_PAUSE_KEYS.enabled, value: shipping_pause_enabled ? "true" : "false" },
    { key: SHIPPING_PAUSE_KEYS.from, value: shipping_pause_from?.trim() ?? "" },
    { key: SHIPPING_PAUSE_KEYS.until, value: shipping_pause_until?.trim() ?? "" },
    { key: SHIPPING_PAUSE_KEYS.messageTh, value: shipping_pause_message_th?.trim() ?? "" },
    { key: SHIPPING_PAUSE_KEYS.messageEn, value: shipping_pause_message_en?.trim() ?? "" },
  ];

  const { error: pauseError } = await supabase
    .from("site_settings")
    .upsert(pauseRows, { onConflict: "key" });

  if (pauseError) {
    console.error("[shipping PUT pause]", pauseError);
    return NextResponse.json({ error: pauseError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
