import { NextResponse } from "next/server";
import { pushTextToAdmin } from "@/services/line-messaging";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await pushTextToAdmin(
      "🔔 [Test] LINE Alert เชื่อมต่อสำเร็จ! Smile Seed Bank — ระบบแจ้งเตือนพร้อมใช้งาน"
    );
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "ส่งไม่สำเร็จ" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, message: "ส่งข้อความทดสอบสำเร็จ" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
