import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAdminClient();
  const [tiersRes, settingsRes] = await Promise.all([
    supabase.from("discount_tiers").select("*").order("min_amount", { ascending: true }),
    supabase.from("site_settings").select("key, value").eq("key", "tiered_discount_enabled").single(),
  ]);

  if (tiersRes.error) return NextResponse.json({ error: tiersRes.error.message }, { status: 500 });
  const enabled = settingsRes.data?.value === "true";

  return NextResponse.json({ tiers: tiersRes.data ?? [], tiered_discount_enabled: enabled });
}

const TierSchema = z.object({
  id: z.number().int().optional(),
  min_amount: z.number().min(0),
  discount_percentage: z.number().min(0).max(100),
  is_active: z.boolean().optional().default(true),
});

const PutTiersSchema = z.object({
  tiered_discount_enabled: z.boolean().optional(),
  tiers: z.array(TierSchema).optional(),
});

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = PutTiersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  if (parsed.data.tiered_discount_enabled !== undefined) {
    await supabase.from("site_settings").upsert(
      { key: "tiered_discount_enabled", value: parsed.data.tiered_discount_enabled ? "true" : "false" },
      { onConflict: "key" }
    );
  }

  if (parsed.data.tiers && parsed.data.tiers.length > 0) {
    for (const t of parsed.data.tiers) {
      if (t.id != null) {
        await supabase
          .from("discount_tiers")
          .update({ min_amount: t.min_amount, discount_percentage: t.discount_percentage, is_active: t.is_active ?? true })
          .eq("id", t.id);
      } else {
        await supabase.from("discount_tiers").insert({
          min_amount: t.min_amount,
          discount_percentage: t.discount_percentage,
          is_active: t.is_active ?? true,
        });
      }
    }
  }

  const [tiersRes, settingsRes] = await Promise.all([
    supabase.from("discount_tiers").select("*").order("min_amount", { ascending: true }),
    supabase.from("site_settings").select("key, value").eq("key", "tiered_discount_enabled").single(),
  ]);
  const enabled = settingsRes.data?.value === "true";
  return NextResponse.json({ tiers: tiersRes.data ?? [], tiered_discount_enabled: enabled });
}
