import { NextResponse } from "next/server";
import { migrateCategoryIds } from "@/lib/migrate-category-id";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const updated = await migrateCategoryIds();
    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
