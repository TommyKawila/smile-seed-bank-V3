import { NextResponse } from "next/server";
import { runPaymentReminders } from "@/lib/services/payment-reminder";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPaymentReminders();
    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      sent: result.sent,
      autoCancelled: result.autoCancelled,
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
