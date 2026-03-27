import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const TypeEnum = ["DISCOUNT", "BUY_X_GET_Y", "FREEBIES", "BUNDLE"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await prisma.promotion_rules.findUnique({
      where: { id: BigInt(id) },
    });
    if (!rule) return NextResponse.json({ error: "ไม่พบโปรโมชั่น" }, { status: 404 });
    return NextResponse.json(bigintToJson(rule));
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
    const body = await req.json();
    if (process.env.NODE_ENV === "development") {
      console.log("Check incoming payload:", body);
    }
    const { z } = await import("zod");
    const schema = z.object({
      name: z.string().min(1).optional(),
      type: z.enum(TypeEnum).optional(),
      description: z.string().nullable().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      is_active: z.boolean().optional(),
      conditions: z.record(z.string(), z.unknown()).nullable().optional(),
      discount_value: z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .transform((v) => {
          if (v === "" || v === undefined) return undefined;
          if (v === null) return null;
          const n = Number(v);
          return Number.isNaN(n) || n < 0 ? undefined : n;
        }),
      discount_type: z.string().optional(),
      min_spend: z.number().nonnegative().optional(),
      buy_qty: z.number().positive().optional(),
      get_qty: z.number().positive().optional(),
      target_breeder_id: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const data: Prisma.promotion_rulesUpdateInput = {};
    if (d.name != null) data.name = d.name.trim();
    if (d.type != null) data.type = d.type;
    if (d.description !== undefined) data.description = d.description?.trim() || null;
    if (d.start_date != null) {
      const sd = new Date(d.start_date);
      if (!Number.isNaN(sd.getTime())) data.start_date = sd;
    }
    if (d.end_date != null) {
      const ed = new Date(d.end_date);
      if (!Number.isNaN(ed.getTime())) data.end_date = ed;
    }
    if (d.is_active !== undefined) data.is_active = d.is_active;
    if (d.discount_value !== undefined) data.discount_value = d.discount_value != null ? new Prisma.Decimal(d.discount_value) : null;

    if (d.conditions !== undefined || d.discount_type !== undefined || d.min_spend !== undefined || d.buy_qty !== undefined || d.get_qty !== undefined || d.target_breeder_id !== undefined) {
      const baseCond = (d.conditions ?? {}) as Record<string, unknown>;
      const conditions: Prisma.JsonObject = {
        ...baseCond,
        ...(d.discount_type != null && { discount_type: d.discount_type }),
        ...(d.min_spend != null && { min_spend: d.min_spend }),
        ...(d.buy_qty != null && { buy_qty: d.buy_qty }),
        ...(d.get_qty != null && { get_qty: d.get_qty }),
        ...(d.target_breeder_id != null && { target_breeder_id: d.target_breeder_id }),
      };
      data.conditions = Object.keys(conditions).length > 0 ? conditions : Prisma.JsonNull;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[Promotions PATCH]", id, "update data:", JSON.stringify(data, null, 2));
    }

    const updated = await prisma.promotion_rules.update({
      where: { id: BigInt(id) },
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
    await prisma.promotion_rules.delete({
      where: { id: BigInt(id) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
