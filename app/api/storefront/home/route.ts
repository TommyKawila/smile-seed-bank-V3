import { NextResponse } from "next/server";
import { bigintToJson } from "@/lib/bigint-json";
import { getStorefrontHomePayload } from "@/services/storefront-home-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getStorefrontHomePayload();

    return NextResponse.json(
      bigintToJson(payload),
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
