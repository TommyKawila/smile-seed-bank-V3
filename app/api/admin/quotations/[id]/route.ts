import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { captureWebCustomerLeadFromQuotation } from "@/lib/quotation-capture-lead";
import { defaultQuotationShippingFee } from "@/lib/order-financials";
import { Prisma } from "@prisma/client";

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

const PatchSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "CONVERTED", "EXPIRED", "SHIPPED"]).optional(),
  customerName: z.string().optional().nullable(),
  customerEmail: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  customerNote: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  totalAmount: z.number().nonnegative().optional(),
  items: z.array(ItemSchema).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const qid = BigInt(id);
    const q = await prisma.quotations.findUnique({
      where: { id: qid },
      include: { quotationItems: true },
    });
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(
      bigintToJson({
        id: Number(q.id),
        quotationNumber: q.quotationNumber,
        customerName: q.customerName,
        customerEmail: q.customerEmail,
        customerPhone: q.customerPhone,
        customerAddress: q.customerAddress,
        customerNote: q.customerNote,
        status: q.status,
        totalAmount: Number(q.totalAmount),
        shippingCost: Number(q.shippingCost ?? 0),
        discountAmount: Number(q.discountAmount ?? 0),
        validUntil: q.validUntil ? q.validUntil.toISOString().slice(0, 10) : null,
        convertedOrderId: q.convertedOrderId ? Number(q.convertedOrderId) : null,
        createdAt: q.createdAt?.toISOString() ?? null,
        items: q.quotationItems.map((i) => ({
          productId: Number(i.productId),
          variantId: Number(i.variantId),
          productName: i.productName,
          unitLabel: i.unitLabel,
          breederName: i.breederName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          discount: Number(i.discount),
          lineTotal: Number(i.lineTotal),
        })),
      })
    );
  } catch (err) {
    console.error("[quotations/[id] GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const qid = BigInt(id);
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
    }
    const d = parsed.data;

    const existing = await prisma.quotations.findUnique({ where: { id: qid } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status === "CONVERTED" && d.items) {
      return NextResponse.json({ error: "แปลงเป็นออเดอร์แล้ว แก้รายการไม่ได้" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const data: Prisma.quotationsUpdateInput = {};
      if (d.status != null) data.status = d.status;
      if (d.customerName !== undefined) data.customerName = d.customerName;
      if (d.customerEmail !== undefined) data.customerEmail = d.customerEmail;
      if (d.customerPhone !== undefined) data.customerPhone = d.customerPhone;
      if (d.customerAddress !== undefined) data.customerAddress = d.customerAddress;
      if (d.customerNote !== undefined) data.customerNote = d.customerNote;
      if (d.totalAmount != null) data.totalAmount = new Prisma.Decimal(d.totalAmount);
      if (d.validUntil !== undefined) {
        data.validUntil = d.validUntil ? new Date(d.validUntil) : null;
      }

      if (d.items != null) {
        if (d.items.length === 0) {
          throw new Error("items cannot be empty");
        }
        await tx.quotation_items.deleteMany({ where: { quotationId: qid } });
        data.quotationItems = {
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
        };
        if (d.totalAmount == null) {
          data.totalAmount = new Prisma.Decimal(d.items.reduce((s, i) => s + i.lineTotal, 0));
        }
        const sub = d.items.reduce((s, i) => s + Number(i.lineTotal), 0);
        data.shippingCost = new Prisma.Decimal(defaultQuotationShippingFee(sub));
      }

      if (Object.keys(data).length > 0) {
        await tx.quotations.update({ where: { id: qid }, data });
      }
    });

    const merged = {
      name: d.customerName !== undefined ? d.customerName : existing.customerName,
      phone: d.customerPhone !== undefined ? d.customerPhone : existing.customerPhone,
      email: d.customerEmail !== undefined ? d.customerEmail : existing.customerEmail,
      address: d.customerAddress !== undefined ? d.customerAddress : existing.customerAddress,
    };
    await captureWebCustomerLeadFromQuotation(merged);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[quotations/[id] PATCH]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
