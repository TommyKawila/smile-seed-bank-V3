import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Convert rows to { key: value } map
  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const body = await req.json() as { key: string; value: string };
  if (!body.key || body.value === undefined) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error } = await (supabase as any)
    .from("site_settings")
    .upsert({ key: body.key, value: body.value }, { onConflict: "key" });

  if (error) {
    console.error("[settings POST] supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
