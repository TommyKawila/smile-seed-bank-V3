import { NextRequest, NextResponse } from "next/server";
import { submitAdminClaimOnBehalf } from "@/lib/services/order-service";
import { approvePayment } from "@/services/orders-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const formData = await req.formData();
    const shipping_name = (formData.get("shipping_name") as string)?.trim() ?? "";
    const shipping_address = (formData.get("shipping_address") as string)?.trim() ?? "";
    const shipping_phone = (formData.get("shipping_phone") as string)?.trim() ?? "";
    const shipping_email = (formData.get("shipping_email") as string)?.trim() ?? "";
    const file = formData.get("file") as File | null;
    const approveRaw = formData.get("approve_immediately");
    const approveImmediately =
      approveRaw === "true" || approveRaw === "1" || approveRaw === "on";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "แนบรูปสลิปโอนเงิน" }, { status: 400 });
    }

    const { data, error } = await submitAdminClaimOnBehalf(orderId, {
      shipping_name,
      shipping_address,
      shipping_phone,
      shipping_email: shipping_email || undefined,
      file,
    });

    if (error || !data) {
      const status =
        error === "Order not found"
          ? 404
          : error?.includes("not awaiting") || error === "Slip already uploaded"
            ? 400
            : 400;
      return NextResponse.json({ error: error ?? "Failed" }, { status });
    }

    if (approveImmediately) {
      const { error: apprErr } = await approvePayment(orderId);
      if (apprErr) {
        return NextResponse.json({
          success: true,
          approved: false,
          warning: `บันทึกข้อมูลแล้ว แต่อนุมัติไม่สำเร็จ: ${apprErr}`,
          slip_url: data.slip_url,
          claim: data.claim,
        });
      }
      return NextResponse.json({
        success: true,
        approved: true,
        slip_url: data.slip_url,
        claim: data.claim,
      });
    }

    return NextResponse.json({
      success: true,
      approved: false,
      slip_url: data.slip_url,
      claim: data.claim,
    });
  } catch (err) {
    console.error("[claim-manual]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
