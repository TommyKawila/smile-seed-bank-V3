import { NextResponse } from "next/server";
import { withTimeout } from "@/lib/timeout";
import { getStorefrontClearanceBreederBoxes } from "@/services/clearance-breeder-banner-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const boxes = await withTimeout(getStorefrontClearanceBreederBoxes(), 2000, []);
    return NextResponse.json({ boxes });
  } catch (err) {
    return NextResponse.json({ error: String(err), boxes: [] }, { status: 500 });
  }
}
