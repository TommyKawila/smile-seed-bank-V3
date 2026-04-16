import { NextRequest, NextResponse } from "next/server";
import {
  getOrderClaimPreview,
  submitOrderClaim,
} from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { data, error } = await getOrderClaimPreview(token);
    if (error || !data) {
      return NextResponse.json({ error: error ?? "Not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/storefront/orders/claim/[token]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const formData = await req.formData();
    const shipping_name = (formData.get("shipping_name") as string)?.trim() ?? "";
    const shipping_address = (formData.get("shipping_address") as string)?.trim() ?? "";
    const shipping_phone = (formData.get("shipping_phone") as string)?.trim() ?? "";
    const shipping_email = (formData.get("shipping_email") as string)?.trim() ?? "";
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Payment slip file is required" }, { status: 400 });
    }

    const { data, error } = await submitOrderClaim({
      token,
      shipping_name,
      shipping_address,
      shipping_phone,
      shipping_email: shipping_email || undefined,
      file,
    });

    if (error || !data) {
      const status =
        error === "Order not found" ? 404
        : error === "Order already processed" ? 400
        : error === "Slip already uploaded" ? 400
        : 400;
      return NextResponse.json({ error: error ?? "Failed" }, { status });
    }

    return NextResponse.json({
      success: true,
      slip_url: data.slip_url,
      claim: data.claim,
    });
  } catch (err) {
    console.error("POST /api/storefront/orders/claim/[token]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
