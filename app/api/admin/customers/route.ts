import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { CustomerTier, Prisma } from "@prisma/client";

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

type OmniRow = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  email: string | null;
};

function phoneDigits(s: string) {
  return s.replace(/\D/g, "");
}

function dedupeOmni(rows: OmniRow[]): OmniRow[] {
  const byKey = new Map<string, OmniRow>();
  for (const r of rows) {
    const d = phoneDigits(r.phone);
    const key = d.length >= 9 ? `d:${d}` : `n:${r.name.trim().toLowerCase()}|${r.phone}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...r });
      continue;
    }
    byKey.set(key, {
      id: prev.id,
      name: prev.name.length >= r.name.length ? prev.name : r.name,
      phone: phoneDigits(prev.phone).length >= phoneDigits(r.phone).length ? prev.phone : r.phone,
      address: prev.address?.trim() || r.address?.trim() || null,
      notes: prev.notes?.trim() || r.notes?.trim() || null,
      email: prev.email?.trim() || r.email?.trim() || null,
    });
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "th", { sensitivity: "base" })
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const qRaw = (searchParams.get("q") ?? "").trim();
    const tier = searchParams.get("tier") ?? "";
    const qNorm = qRaw.replace(/[\s\-().]/g, "");
    const qDigits = phoneDigits(qRaw);

    if (!qRaw) {
      const where: Prisma.CustomerWhereInput = { is_active: true };
      if (tier && ["Retail", "Wholesale", "VIP"].includes(tier)) {
        where.tier = tier as CustomerTier;
      }
      const customers = await prisma.customer.findMany({
        where,
        orderBy: { name: "asc" },
      });
      return NextResponse.json(bigintToJson(customers));
    }

    const wherePos: Prisma.CustomerWhereInput = { is_active: true };
    if (tier && ["Retail", "Wholesale", "VIP"].includes(tier)) {
      wherePos.tier = tier as CustomerTier;
    }
    const orPos: Prisma.CustomerWhereInput[] = [
      { name: { contains: qRaw, mode: "insensitive" } },
      { phone: { contains: qRaw, mode: "insensitive" } },
    ];
    if (qNorm && qNorm !== qRaw) {
      orPos.push({ phone: { contains: qNorm, mode: "insensitive" } });
    }
    if (qDigits.length >= 3) {
      orPos.push({ phone: { contains: qDigits, mode: "insensitive" } });
    }
    wherePos.OR = orPos;

    const orWeb: Prisma.customersWhereInput[] = [
      { full_name: { contains: qRaw, mode: "insensitive" } },
      { phone: { contains: qRaw, mode: "insensitive" } },
      { email: { contains: qRaw, mode: "insensitive" } },
      { address: { contains: qRaw, mode: "insensitive" } },
    ];
    if (qNorm && qNorm !== qRaw) {
      orWeb.push({ phone: { contains: qNorm, mode: "insensitive" } });
    }
    if (qDigits.length >= 3) {
      orWeb.push({ phone: { contains: qDigits, mode: "insensitive" } });
    }

    const [posList, webList, quoteRows] = await Promise.all([
      prisma.customer.findMany({
        where: wherePos,
        take: 80,
        orderBy: { name: "asc" },
      }),
      prisma.customers.findMany({
        where: { OR: orWeb },
        take: 80,
        select: { id: true, full_name: true, phone: true, email: true, address: true },
      }),
      prisma.$queryRaw<
        { name: string | null; phone: string | null; email: string | null; address: string | null; notes: string | null }[]
      >`
        WITH ranked AS (
          SELECT
            customer_name,
            customer_phone,
            customer_email,
            customer_address,
            customer_note,
            created_at,
            id,
            CASE
              WHEN length(regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g')) >= 9
              THEN regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g')
              ELSE ('id:' || id::text)
            END AS dedupe_key
          FROM public.quotations
          WHERE (
            COALESCE(TRIM(customer_name), '') <> ''
            OR COALESCE(TRIM(customer_phone), '') <> ''
          )
          AND (
            COALESCE(customer_name, '') ILIKE '%' || ${qRaw} || '%'
            OR COALESCE(customer_email, '') ILIKE '%' || ${qRaw} || '%'
            OR COALESCE(customer_address, '') ILIKE '%' || ${qRaw} || '%'
            OR COALESCE(customer_phone, '') ILIKE '%' || ${qRaw} || '%'
            OR (
              length(${qDigits}) >= 3
              AND regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') LIKE '%' || ${qDigits} || '%'
            )
          )
        ),
        picked AS (
          SELECT
            customer_name AS name,
            customer_phone AS phone,
            customer_email AS email,
            customer_address AS address,
            customer_note AS notes,
            ROW_NUMBER() OVER (PARTITION BY dedupe_key ORDER BY created_at DESC) AS rn
          FROM ranked
        )
        SELECT name, phone, email, address, notes FROM picked WHERE rn = 1
        LIMIT 80
      `,
    ]);

    const merged: OmniRow[] = [];

    for (const c of posList) {
      merged.push({
        id: `pos-${c.id}`,
        name: c.name,
        phone: c.phone,
        address: c.address ?? null,
        notes: c.notes ?? null,
        email: null,
      });
    }

    for (const c of webList) {
      merged.push({
        id: `web-${c.id}`,
        name: (c.full_name ?? "").trim() || (c.phone ?? "").trim() || "—",
        phone: c.phone ?? "",
        address: c.address ?? null,
        notes: null,
        email: c.email ?? null,
      });
    }

    let qi = 0;
    for (const r of quoteRows) {
      const phone = (r.phone ?? "").trim();
      const name = (r.name ?? "").trim() || phone || "—";
      merged.push({
        id: `qt-${qi++}`,
        name,
        phone,
        address: r.address ?? null,
        notes: r.notes ?? null,
        email: r.email ?? null,
      });
    }

    return NextResponse.json(bigintToJson(dedupeOmni(merged)));
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
      ? (parsed.data.wholesale_discount_percent ?? 20)
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
