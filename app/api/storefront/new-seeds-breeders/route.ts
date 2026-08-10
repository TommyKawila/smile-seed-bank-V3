import { NextResponse } from "next/server";
import { withTimeout } from "@/lib/timeout";
import { getStorefrontNewSeedsBreederBoxes } from "@/services/new-seeds-breeder-banner-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const boxes = await withTimeout(getStorefrontNewSeedsBreederBoxes(), 8000, []);
    return NextResponse.json(
      { boxes },
      { headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err), boxes: [] }, { status: 500 });
  }
}
