import { requireAdminUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminUserId = process.env.LINE_ADMIN_USER_ID;
  const configured = !!(token && adminUserId);
  return NextResponse.json({
    configured,
    hasToken: !!token,
    hasAdminUserId: !!adminUserId,
  });
}
