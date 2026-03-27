import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const TypeEnum = ["DISCOUNT", "BUY_X_GET_Y", "FREEBIES", "BUNDLE"] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const now = new Date();
    const where: { is_active?: boolean; start_date?: { lte: Date }; end_date?: { gte: Date } } = {};
    if (status === "active") {
      where.is_active = true;
      where.start_date = { lte: now };
      where.end_date = { gte: now };
    }

    const list = await prisma.promotion_rules.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { start_date: "desc" },
    });
    return NextResponse.json(bigintToJson(list));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (process.env.NODE_ENV === "development") {
      console.log("Check incoming payload:", body);
    }
    const { z } = await import("zod");
    const schema = z.object({
      name: z.string().min(1, "ชื่อต้องไม่ว่าง"),
      type: z.enum(TypeEnum),
      description: z.string().nullable().optional(),
      start_date: z.string(),
      end_date: z.string(),
      is_active: z.boolean().optional().default(true),
      conditions: z.record(z.string(), z.unknown()).nullable().optional(),
      discount_value: z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .transform((v) => {
          if (v === "" || v == null) return undefined;
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
    const baseCond = (d.conditions ?? {}) as Record<string, unknown>;
    const conditions: Prisma.JsonObject = {
      ...baseCond,
      ...(d.discount_type != null && { discount_type: d.discount_type }),
      ...(d.min_spend != null && { min_spend: d.min_spend }),
      ...(d.buy_qty != null && { buy_qty: d.buy_qty }),
      ...(d.get_qty != null && { get_qty: d.get_qty }),
      ...(d.target_breeder_id != null && { target_breeder_id: d.target_breeder_id }),
    };
    const startDate = d.start_date ? new Date(d.start_date) : null;
    const endDate = d.end_date ? new Date(d.end_date) : null;
    if (!startDate || Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "start_date ไม่ถูกต้อง" }, { status: 400 });
    }
    if (!endDate || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "end_date ไม่ถูกต้อง" }, { status: 400 });
    }
    const prismaData = {
      name: d.name.trim(),
      type: d.type as "DISCOUNT" | "BUY_X_GET_Y" | "FREEBIES" | "BUNDLE",
      description: d.description?.trim() || null,
      start_date: startDate,
      end_date: endDate,
      is_active: Boolean(d.is_active ?? true),
      conditions: Object.keys(conditions).length > 0 ? conditions : Prisma.JsonNull,
      discount_value: d.discount_value != null ? new Prisma.Decimal(d.discount_value) : null,
    };
    if (process.env.NODE_ENV === "development") {
      console.log("[Promotions POST] Prisma create data:", JSON.stringify(prismaData, null, 2));
    }
    const created = await prisma.promotion_rules.create({
      data: prismaData,
    });
    return NextResponse.json(bigintToJson(created), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
