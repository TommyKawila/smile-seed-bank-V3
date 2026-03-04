import { NextResponse } from "next/server";
import { getInventoryValue } from "@/services/dashboard-service";

export async function GET() {
  const { data, error } = await getInventoryValue();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}
