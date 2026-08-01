import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateB2BQuoteTotals, lineTotal } from "@/lib/b2b-quote-calc";
import { currentB2BQuoteYear, formatB2BQuoteNumber } from "@/lib/b2b-quote-number";
import {
  buildB2BQuoteEmailHtml,
  buildB2BQuotePlainText,
} from "@/lib/email-b2b-quote-html";
import type {
  B2BCurrency,
  B2BQuoteDispatchInput,
  B2BQuoteDraft,
  B2BQuoteLineItem,
  B2BQuoteRecord,
  B2BQuoteStatus,
} from "@/types/b2b-quote";

const RESEND_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Smile Seed Bank <orders@smileseedbank.com>";

type QuoteWithItems = {
  id: bigint;
  quote_number: string;
  client_name: string;
  client_email: string;
  shipping_address: string;
  invoice_date: string;
  valid_until: string;
  currency: string;
  subtotal: Prisma.Decimal;
  discount_amount: Prisma.Decimal;
  shipping_fee: Prisma.Decimal;
  total_amount: Prisma.Decimal;
  payment_notes: string | null;
  status: string;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
  items: {
    id: bigint;
    strain_name: string;
    quantity: number;
    unit_price: Prisma.Decimal;
    line_total: Prisma.Decimal;
    sort_order: number;
  }[];
};

function toNum(d: Prisma.Decimal | number): number {
  return typeof d === "number" ? d : Number(d);
}

function toRecord(row: QuoteWithItems): B2BQuoteRecord {
  return {
    id: String(row.id),
    quoteNumber: row.quote_number,
    clientName: row.client_name,
    clientEmail: row.client_email,
    shippingAddress: row.shipping_address,
    invoiceDate: row.invoice_date,
    validUntil: row.valid_until,
    currency: (row.currency === "THB" ? "THB" : "EUR") as B2BCurrency,
    discountAmount: toNum(row.discount_amount),
    shippingFee: toNum(row.shipping_fee),
    subtotal: toNum(row.subtotal),
    totalAmount: toNum(row.total_amount),
    paymentNotes: row.payment_notes,
    status: (row.status === "SENT" ? "SENT" : "DRAFT") as B2BQuoteStatus,
    sentAt: row.sent_at ? row.sent_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    items: row.items
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((it) => ({
        id: String(it.id),
        strainName: it.strain_name,
        quantity: it.quantity,
        unitPrice: toNum(it.unit_price),
        lineTotal: toNum(it.line_total),
      })),
  };
}

export async function nextB2BQuoteNumber(): Promise<string> {
  const year = currentB2BQuoteYear();
  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.b2b_quote_yearly_seq.findUnique({ where: { year } });
    if (!existing) {
      return tx.b2b_quote_yearly_seq.create({ data: { year, seq: 1 } });
    }
    return tx.b2b_quote_yearly_seq.update({
      where: { year },
      data: { seq: { increment: 1 } },
    });
  });
  return formatB2BQuoteNumber(year, row.seq);
}

export type SaveB2BQuoteInput = B2BQuoteDraft & {
  id?: string | null;
  quoteNumber?: string | null;
  status?: B2BQuoteStatus;
};

function normalizeItems(items: B2BQuoteLineItem[], currency: B2BCurrency) {
  return items
    .filter((it) => it.strainName.trim())
    .map((it, i) => ({
      strain_name: it.strainName.trim(),
      quantity: Math.max(0, Math.floor(it.quantity)),
      unit_price: new Prisma.Decimal(it.unitPrice),
      line_total: new Prisma.Decimal(lineTotal(it.quantity, it.unitPrice, currency)),
      sort_order: i,
    }));
}

export async function listB2BQuotes(limit = 40): Promise<B2BQuoteRecord[]> {
  const rows = await prisma.b2b_quotes.findMany({
    orderBy: { updated_at: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
    include: { items: true },
  });
  return rows.map(toRecord);
}

export async function getB2BQuote(id: string): Promise<B2BQuoteRecord | null> {
  const row = await prisma.b2b_quotes.findUnique({
    where: { id: BigInt(id) },
    include: { items: true },
  });
  return row ? toRecord(row) : null;
}

export async function saveB2BQuote(input: SaveB2BQuoteInput): Promise<B2BQuoteRecord> {
  const currency = input.currency === "THB" ? "THB" : "EUR";
  const totals = calculateB2BQuoteTotals(
    input.items,
    input.discountAmount,
    input.shippingFee,
    currency
  );
  const itemRows = normalizeItems(input.items, currency);
  const status = input.status ?? "DRAFT";

  if (input.id) {
    const id = BigInt(input.id);
    await prisma.b2b_quote_items.deleteMany({ where: { quote_id: id } });
    const row = await prisma.b2b_quotes.update({
      where: { id },
      data: {
        client_name: input.clientName.trim(),
        client_email: input.clientEmail.trim(),
        shipping_address: input.shippingAddress.trim(),
        invoice_date: input.invoiceDate,
        valid_until: input.validUntil,
        currency,
        subtotal: new Prisma.Decimal(totals.subtotal),
        discount_amount: new Prisma.Decimal(totals.discountAmount),
        shipping_fee: new Prisma.Decimal(totals.shippingFee),
        total_amount: new Prisma.Decimal(totals.totalAmount),
        payment_notes: input.paymentNotes?.trim() || null,
        status,
        ...(status === "SENT" ? { sent_at: new Date() } : {}),
        items: { create: itemRows },
      },
      include: { items: true },
    });
    return toRecord(row);
  }

  const quoteNumber = input.quoteNumber?.trim() || (await nextB2BQuoteNumber());
  const row = await prisma.b2b_quotes.create({
    data: {
      quote_number: quoteNumber,
      client_name: input.clientName.trim(),
      client_email: input.clientEmail.trim(),
      shipping_address: input.shippingAddress.trim(),
      invoice_date: input.invoiceDate,
      valid_until: input.validUntil,
      currency,
      subtotal: new Prisma.Decimal(totals.subtotal),
      discount_amount: new Prisma.Decimal(totals.discountAmount),
      shipping_fee: new Prisma.Decimal(totals.shippingFee),
      total_amount: new Prisma.Decimal(totals.totalAmount),
      payment_notes: input.paymentNotes?.trim() || null,
      status,
      ...(status === "SENT" ? { sent_at: new Date() } : {}),
      items: { create: itemRows },
    },
    include: { items: true },
  });
  return toRecord(row);
}

export async function deleteB2BQuote(id: string): Promise<void> {
  await prisma.b2b_quotes.delete({ where: { id: BigInt(id) } });
}

async function fetchCompanyAndLogo(): Promise<{
  logoUrl: string | null;
  companyName: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
}> {
  const keys = [
    "logo_main_url",
    "company_name",
    "company_email",
    "company_phone",
    "company_address",
  ];
  const rows = await prisma.site_settings.findMany({ where: { key: { in: keys } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    logoUrl: map.logo_main_url?.trim() || null,
    companyName: map.company_name?.trim() || null,
    companyEmail: map.company_email?.trim() || null,
    companyPhone: map.company_phone?.trim() || null,
    companyAddress: map.company_address?.trim() || null,
  };
}

export async function sendB2BQuoteEmail(input: B2BQuoteDispatchInput): Promise<{
  success: boolean;
  error: string | null;
  quoteId?: string;
  quoteNumber?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "RESEND_API_KEY is not configured" };

  const to = input.clientEmail.trim();
  if (!to) return { success: false, error: "Client email is required" };
  if (!input.clientName.trim()) return { success: false, error: "Client name is required" };
  if (!input.items.some((it) => it.strainName.trim() && it.quantity > 0)) {
    return { success: false, error: "At least one line item is required" };
  }

  try {
    const saved = await saveB2BQuote({
      ...input,
      id: input.quoteId ?? null,
      quoteNumber: input.quoteNumber?.trim() || null,
      status: "SENT",
    });
    const quoteNumber = saved.quoteNumber;

    const site = await fetchCompanyAndLogo();
    const html = buildB2BQuoteEmailHtml(input, quoteNumber, site.logoUrl, site);
    const text = buildB2BQuotePlainText(input, quoteNumber);

    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `Pro-Forma Invoice ${quoteNumber} — Smile Seed Bank`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
    }

    return { success: true, error: null, quoteId: saved.id, quoteNumber };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
