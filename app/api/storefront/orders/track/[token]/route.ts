import { NextRequest, NextResponse } from "next/server";
import { getPublicOrderTrackByToken } from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { data, error } = await getPublicOrderTrackByToken(token);
    if (error || !data) {
      return NextResponse.json({ error: error ?? "Not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/storefront/orders/track/[token]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
