import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { CustomerTier, Prisma } from "@prisma/client";
import { searchCustomersOmni } from "@/lib/customer-omni-search";

export const dynamic = "force-dynamic";

const CustomerSchema = z.object({
  name: z.string().min(1, "ชื่อต้องไม่ว่าง"),
  phone: z.string().min(1, "เบอร์โทรต้องไม่ว่าง"),
  line_id: z.string().nullable().optional(),
  tier: z.enum(["Retail", "Wholesale", "VIP"]).default("Retail"),
  wholesale_discount_percent: z.number().int().min(0).max(99).optional(),
  preference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const qRaw = (searchParams.get("q") ?? "").trim();
    const mode = (searchParams.get("mode") ?? "").trim();
    const tier = searchParams.get("tier") ?? "";
    const limitRaw = Number(searchParams.get("limit") ?? 80);
    const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : 80;

    if (qRaw && mode === "omni") {
      const hits = await searchCustomersOmni(qRaw, limit);
      return NextResponse.json(bigintToJson(hits));
    }

    const where: Prisma.CustomerWhereInput = { is_active: true };
    if (tier && ["Retail", "Wholesale", "VIP"].includes(tier)) {
      where.tier = tier as CustomerTier;
    }
    if (qRaw) {
      where.OR = [
        { name: { contains: qRaw, mode: "insensitive" } },
        { phone: { contains: qRaw } },
        { line_id: { contains: qRaw, mode: "insensitive" } },
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      take: limit,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(bigintToJson(customers));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const existing = await prisma.customer.findFirst({
      where: { phone: parsed.data.phone.trim(), is_active: true },
    });
    if (existing) {
      return NextResponse.json({ error: "เบอร์โทรนี้มีในระบบแล้ว" }, { status: 409 });
    }

    const discount = parsed.data.tier === "Wholesale"
      ? (parsed.data.wholesale_discount_percent ?? 0)
      : 0;

    const created = await prisma.customer.create({
      data: {
        name: parsed.data.name.trim(),
        phone: parsed.data.phone.trim(),
        line_id: parsed.data.line_id?.trim() || null,
        tier: parsed.data.tier as CustomerTier,
        wholesale_discount_percent: discount,
        preference: parsed.data.preference?.trim() || null,
        notes: parsed.data.notes?.trim() || null,
        address: parsed.data.address?.trim() || null,
        is_active: true,
      },
    });

    return NextResponse.json(bigintToJson(created), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
