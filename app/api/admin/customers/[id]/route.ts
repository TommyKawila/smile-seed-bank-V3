import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { CustomerTier } from "@prisma/client";

export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  line_id: z.string().nullable().optional(),
  tier: z.enum(["Retail", "Wholesale", "VIP"]).optional(),
  wholesale_discount_percent: z.number().int().min(0).max(99).optional(),
  preference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

const CustomerIdParamSchema = z.object({
  id: z.coerce.bigint({ message: "ID ต้องเป็นตัวเลขเท่านั้น" }),
});

function parseCustomerIdParam(raw: string) {
  const result = CustomerIdParamSchema.safeParse({ id: raw });
  if (!result.success) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: result.error.format() }, { status: 400 }),
    };
  }
  return { ok: true as const, customerId: result.data.id };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idParsed = parseCustomerIdParam(id);
    if (!idParsed.ok) return idParsed.response;
    const { customerId } = idParsed;
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, is_active: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 });
    }
    return NextResponse.json(bigintToJson(customer));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idParsed = parseCustomerIdParam(id);
    if (!idParsed.ok) return idParsed.response;
    const { customerId } = idParsed;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (parsed.data.phone) {
      const existing = await prisma.customer.findFirst({
        where: { phone: parsed.data.phone.trim(), is_active: true, NOT: { id: customerId } },
      });
      if (existing) {
        return NextResponse.json({ error: "เบอร์โทรนี้มีในระบบแล้ว" }, { status: 409 });
      }
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name != null) data.name = parsed.data.name.trim();
    if (parsed.data.phone != null) data.phone = parsed.data.phone.trim();
    if (parsed.data.line_id !== undefined) data.line_id = parsed.data.line_id?.trim() || null;
    if (parsed.data.tier != null) data.tier = parsed.data.tier as CustomerTier;
    if (parsed.data.wholesale_discount_percent !== undefined) data.wholesale_discount_percent = parsed.data.wholesale_discount_percent;
    if (parsed.data.preference !== undefined) data.preference = parsed.data.preference?.trim() || null;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes?.trim() || null;
    if (parsed.data.address !== undefined) data.address = parsed.data.address?.trim() || null;

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data,
    });

    return NextResponse.json(bigintToJson(updated));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idParsed = parseCustomerIdParam(id);
    if (!idParsed.ok) return idParsed.response;
    const { customerId } = idParsed;
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { is_active: false },
    });
    return NextResponse.json(bigintToJson(updated));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
