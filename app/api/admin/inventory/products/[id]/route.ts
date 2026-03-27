import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = BigInt((await params).id);
    const product = await prisma.products.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }
    await prisma.products.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
