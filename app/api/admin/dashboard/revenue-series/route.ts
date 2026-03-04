import { NextRequest, NextResponse } from "next/server";
import { getRevenueSeries } from "@/services/dashboard-service";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const period = (searchParams.get("period") ?? "monthly") as "daily" | "monthly";

  const { data, error } = await getRevenueSeries(period, { from, to });
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data ?? []);
}
