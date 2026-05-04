import { NextResponse } from "next/server";
import { bigintToJson } from "@/lib/bigint-json";
import { getStorefrontHomePayload } from "@/services/storefront-home-service";

export const dynamic = "force-dynamic";

const DATA_TIMEOUT_MS = 2000;

export async function GET() {
  try {
    const payload = await getStorefrontHomePayload(DATA_TIMEOUT_MS);

    return NextResponse.json(
      bigintToJson(payload),
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
