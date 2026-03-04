import { NextRequest, NextResponse } from "next/server";
import { uploadSlip } from "@/lib/services/order-service";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const orderNumber = (formData.get("order_number") as string)?.trim();
    const file = formData.get("file") as File | null;

    if (!orderNumber || !file || file.size === 0) {
      return NextResponse.json(
        { error: "order_number and file are required" },
        { status: 400 }
      );
    }

    const { data, error } = await uploadSlip({ orderNumber, file });

    if (error || !data) {
      const status =
        error === "Order not found" ? 404
        : error === "Slip already uploaded" ? 400
        : error === "This order does not require slip upload" ? 400
        : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ success: true, slip_url: data.slip_url });
  } catch (err) {
    console.error("POST /api/storefront/orders/upload-slip error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
