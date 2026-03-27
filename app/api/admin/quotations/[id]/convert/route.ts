import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { orderNumberFromQuotationNumber } from "@/lib/pdf-filename";
import { createManualOrderFromItems } from "@/lib/services/manual-order-create";

export const dynamic = "force-dynamic";

async function resolveOrderCustomerLinks(q: {
  customerEmail: string | null;
  customerPhone: string | null;
}): Promise<{ customerId: string | null; customerProfileId: bigint | null }> {
  const email = q.customerEmail?.trim().toLowerCase() || null;
  const phone = q.customerPhone?.trim() || null;
  if (phone) {
    const pos = await prisma.customer.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (pos) return { customerId: null, customerProfileId: pos.id };
  }
  if (email) {
    const web = await prisma.customers.findUnique({
      where: { email },
      select: { id: true },
    });
    if (web) return { customerId: web.id, customerProfileId: null };
  }
  if (phone) {
    const web = await prisma.customers.findFirst({
      where: { phone },
      select: { id: true },
    });
    if (web) return { customerId: web.id, customerProfileId: null };
  }
  return { customerId: null, customerProfileId: null };
}

export async function POST(
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
    if (!q) return NextResponse.json({ error: "ไม่พบใบเสนอราคา" }, { status: 404 });
    if (q.status === "CONVERTED") {
      return NextResponse.json({ error: "แปลงเป็นออเดอร์แล้ว" }, { status: 400 });
    }
    if (!q.quotationItems.length) {
      return NextResponse.json({ error: "ไม่มีรายการสินค้า" }, { status: 400 });
    }

    const items = q.quotationItems.map((i) => {
      const qty = i.quantity;
      const lineTotal = Number(i.lineTotal);
      const unitPrice = qty > 0 ? lineTotal / qty : Number(i.unitPrice);
      return {
        variantId: Number(i.variantId),
        productId: Number(i.productId),
        productName: i.productName,
        unitLabel: i.unitLabel ?? "",
        quantity: qty,
        unitPrice,
      };
    });

    const itemsSubtotal = q.quotationItems.reduce((s, i) => s + Number(i.lineTotal), 0);
    // quotation.shippingCost (DB shipping_cost) → orders.shipping_fee (POST/PATCH ตั้งค่าแล้ว)
    const shipping_fee = Number(q.shippingCost ?? 0);
    // quotation.discountAmount (DB discount_amount) → orders.discount_amount
    const discount_amount = Number(q.discountAmount ?? 0);
    const total_amount = itemsSubtotal + shipping_fee - discount_amount;
    const { customerId, customerProfileId } = await resolveOrderCustomerLinks({
      customerEmail: q.customerEmail,
      customerPhone: q.customerPhone,
    });

    const derivedOrderNo = orderNumberFromQuotationNumber(q.quotationNumber);

    const { orderNumber, orderId } = await createManualOrderFromItems({
      items,
      total_amount,
      shipping_fee,
      discount_amount,
      order_number: derivedOrderNo ?? undefined,
      source_quotation_number: q.quotationNumber,
      customer: {
        full_name: q.customerName ?? undefined,
        phone: q.customerPhone ?? undefined,
        address: q.customerAddress ?? undefined,
        payment_method: "CASH",
        note: q.customerNote ?? undefined,
        customerId,
        customerProfileId,
      },
    });

    await prisma.quotations.update({
      where: { id: qid },
      data: {
        status: "CONVERTED",
        convertedOrderId: orderId,
      },
    });

    return NextResponse.json(
      bigintToJson({
        ok: true,
        orderNumber,
        orderId: Number(orderId),
      }),
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
