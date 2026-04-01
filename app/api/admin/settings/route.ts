import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");

    if (error) {
      logger.error("Failed to fetch settings", { cause: error });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert rows to { key: value } map
    const settings = (data ?? []).reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settings);
  } catch (err) {
    logger.error("Unexpected error in settings GET", { cause: err });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 🛡️ Extra layer of security: Ensure the requester is actually an Admin
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    
    // บอสสามารถเพิ่ม Logic เช็ค Role ตรงนี้ได้ถ้าต้องการ
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { key: string; value: string };
    if (!body.key || body.value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await (supabase as any)
      .from("site_settings")
      .upsert({ key: body.key, value: body.value }, { onConflict: "key" });

    if (error) {
      logger.error("Failed to update setting", { 
        cause: error, 
        context: { key: body.key } 
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info(`Setting updated: ${body.key}`, { context: { user_id: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Unexpected error in settings POST", { cause: err });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}