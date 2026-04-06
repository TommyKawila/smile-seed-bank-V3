import { NextRequest, NextResponse } from "next/server";
import {
  getMagazineTrendingMode,
  setMagazineTrendingMode,
  type TrendingMode,
} from "@/lib/blog-service";

export async function GET() {
  try {
    const mode = await getMagazineTrendingMode();
    return NextResponse.json({ trending_mode: mode });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = body.trending_mode ?? body.mode;
    const mode: TrendingMode = raw === "manual" ? "manual" : "auto";
    await setMagazineTrendingMode(mode);
    return NextResponse.json({ trending_mode: mode });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
