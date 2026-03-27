import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { captureWebCustomerLeadFromQuotation } from "@/lib/quotation-capture-lead";
import { defaultQuotationShippingFee } from "@/lib/order-financials";

const ItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive(),
  productName: z.string().min(1),
  unitLabel: z.string(),
  breederName: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  lineTotal: z.number().nonnegative(),
});

const PostSchema = z.object({
  quotationNumber: z.string().min(1),
  customerName: z.string().optional().nullable(),
  customerEmail: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  customerNote: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "CONVERTED", "EXPIRED", "SHIPPED"]).optional(),
  totalAmount: z.number().nonnegative(),
  items: z.array(ItemSchema).min(1),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") ?? "").trim();
    const status = searchParams.get("status") ?? "";
    const lifecycle = (searchParams.get("lifecycle") ?? "all").toLowerCase();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Prisma.quotationsWhereInput = {};
    if (lifecycle === "pending") where.convertedOrderId = null;
    else if (lifecycle === "converted") where.convertedOrderId = { not: null };
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ];
    }
    if (dateFrom || dateTo) {
      const ca: Prisma.DateTimeFilter = {};
      if (dateFrom) ca.gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) ca.lte = new Date(`${dateTo}T23:59:59.999Z`);
      where.createdAt = ca;
    }

    const rows = await prisma.quotations.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        quotationNumber: true,
        customerName: true,
        status: true,
        totalAmount: true,
        validUntil: true,
        convertedOrderId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      bigintToJson({
        quotations: rows.map((r) => ({
          id: Number(r.id),
          quotationNumber: r.quotationNumber,
          customerName: r.customerName,
          status: r.status,
          totalAmount: Number(r.totalAmount),
          validUntil: r.validUntil ? r.validUntil.toISOString().slice(0, 10) : null,
          convertedOrderId: r.convertedOrderId ? Number(r.convertedOrderId) : null,
          createdAt: r.createdAt?.toISOString() ?? null,
          updatedAt: r.updatedAt?.toISOString() ?? null,
        })),
      })
    );
  } catch (err) {
    console.error("[quotations GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
    }
    const d = parsed.data;
    const validUntil = d.validUntil ? new Date(d.validUntil) : null;
    const itemsSubtotal = d.items.reduce((s, i) => s + Number(i.lineTotal), 0);
    const shippingComputed = defaultQuotationShippingFee(itemsSubtotal);

    const q = await prisma.quotations.create({
      data: {
        quotationNumber: d.quotationNumber,
        customerName: d.customerName ?? null,
        customerEmail: d.customerEmail ?? null,
        customerPhone: d.customerPhone ?? null,
        customerAddress: d.customerAddress ?? null,
        customerNote: d.customerNote ?? null,
        status: d.status ?? "DRAFT",
        totalAmount: new Prisma.Decimal(d.totalAmount),
        shippingCost: new Prisma.Decimal(shippingComputed),
        discountAmount: new Prisma.Decimal(0),
        validUntil,
        quotationItems: {
          create: d.items.map((i) => ({
            productId: BigInt(i.productId),
            variantId: BigInt(i.variantId),
            productName: i.productName,
            unitLabel: i.unitLabel,
            breederName: i.breederName ?? null,
            quantity: i.quantity,
            unitPrice: new Prisma.Decimal(i.unitPrice),
            discount: new Prisma.Decimal(i.discount),
            lineTotal: new Prisma.Decimal(i.lineTotal),
          })),
        },
      },
    });

    await captureWebCustomerLeadFromQuotation({
      name: d.customerName,
      phone: d.customerPhone,
      email: d.customerEmail,
      address: d.customerAddress,
    });

    return NextResponse.json(bigintToJson({ id: Number(q.id) }), { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json({ error: "เลขที่ใบเสนอราคาซ้ำ" }, { status: 409 });
    }
    console.error("[quotations POST]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
