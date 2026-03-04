import { NextRequest, NextResponse } from "next/server";
import { getFinancialSummary } from "@/services/dashboard-service";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const { data, error } = await getFinancialSummary({ from, to });
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}
