import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const result = await prisma.$queryRaw<{ seq: bigint }[]>`
      INSERT INTO public.quotation_daily_seq (date, seq) VALUES (${today}, 1)
      ON CONFLICT (date) DO UPDATE SET seq = quotation_daily_seq.seq + 1
      RETURNING seq
    `;
    const seq = Number(result[0]?.seq ?? 1);
    return NextResponse.json({ number: `SSB-QT-${today}-${String(seq).padStart(3, "0")}` });
  } catch (err) {
    console.error("[quotations/number]", err);
    const fallback = `SSB-QT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-3)}`;
    return NextResponse.json({ number: fallback });
  }
}
