import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { getSiteSettingsRecordMap, upsertSiteSetting } from "@/services/setting-service";

export async function GET() {
  try {
    const settings = await getSiteSettingsRecordMap();
    return NextResponse.json(settings);
  } catch (err) {
    logger.error("Unexpected error in settings GET", { cause: err });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await assertAdmin();

    const body = await req.json() as { key: string; value: string };
    if (!body.key || body.value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    const result = await upsertSiteSetting(body.key, body.value);
    if (!result.ok) {
      logger.error("Failed to update setting", {
        context: { key: body.key, error: result.error },
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    logger.info(`Setting updated: ${body.key}`, { context: { user_id: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("Unexpected error in settings POST", { cause: err });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}