import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function digits(s: string) {
  return s.replace(/\D/g, "");
}

export async function GET(req: NextRequest) {
  const d = digits(req.nextUrl.searchParams.get("phone") ?? "");
  if (d.length < 9) return NextResponse.json({ email: null, address: null });
  try {
    const rows = await prisma.$queryRaw<{ email: string | null; address: string | null }[]>`
      SELECT email, address FROM public.customers
      WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = ${d}
      LIMIT 1
    `;
    const row = rows[0];
    return NextResponse.json({
      email: row?.email ?? null,
      address: row?.address ?? null,
    });
  } catch {
    return NextResponse.json({ email: null, address: null });
  }
}
