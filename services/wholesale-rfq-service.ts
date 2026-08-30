/**
 * Public wholesale RFQ — create B2B draft quote + notify team.
 */

import { saveB2BQuote } from "@/services/b2b-quote-service";
import { upsertBusinessContact } from "@/services/business-document-service";
import { STORE_ENTITY } from "@/lib/company-legal-identity";
import { isGfPreGate } from "@/lib/green-future-approved-marketing";
import {
  isValidQty,
  resolveQuote,
  thbToEurDisplay,
  type CoaMode,
} from "@/lib/wholesale-bulk-pricing";
import { getBulkPricingConfig } from "@/services/wholesale-catalog-service";
import {
  defaultValidUntil,
  B2B_BREEDER_SGF,
  type B2BCurrency,
  type B2BQuoteLineItem,
} from "@/types/b2b-quote";

export type WholesaleRfqLineInput = {
  strainName: string;
  quantity: number;
};

export type WholesaleRfqInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: "THB_BANK" | "EUR_WIRE" | "USDT";
  coaMode: CoaMode;
  buyExtraCoa: boolean;
  coaPackageA: number;
  coaPackageB: number;
  message?: string;
  currency: B2BCurrency;
  lines: WholesaleRfqLineInput[];
};

const PAYMENT_LABEL: Record<WholesaleRfqInput["paymentMethod"], string> = {
  THB_BANK: "THB Bank Transfer",
  EUR_WIRE: "EUR Wire",
  USDT: "USDT",
};

function notifyTeamEmail(body: {
  quoteNumber: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  currency: string;
  totalAmount: number;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[wholesale-rfq] RESEND_API_KEY missing — skip team notify");
    return Promise.resolve();
  }
  const to =
    process.env.WHOLESALE_RFQ_NOTIFY_EMAIL?.trim() ||
    process.env.B2B_GMAIL_USER?.trim() ||
    STORE_ENTITY.contactEmail;

  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Smile Seed Bank <orders@smileseedbank.com>",
      to: [to],
      subject: `[Wholesale RFQ] ${body.quoteNumber} — ${body.companyName}`,
      text: [
        `New wholesale RFQ draft: ${body.quoteNumber}`,
        `Company: ${body.companyName}`,
        `Contact: ${body.contactName}`,
        `Email: ${body.email}`,
        `Phone: ${body.phone}`,
        `Currency: ${body.currency}`,
        `Estimated total: ${body.totalAmount}`,
        `Admin: /admin/documents/b2b-quote`,
      ].join("\n"),
    }),
  }).then(async (res) => {
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("[wholesale-rfq] notify failed", res.status, t);
    }
  });
}

export async function submitWholesaleRfq(input: WholesaleRfqInput): Promise<{
  quoteNumber: string;
  quoteId: string;
  totalAmount: number;
}> {
  const currency: B2BCurrency = input.currency === "THB" ? "THB" : "EUR";
  const config = await getBulkPricingConfig();

  const pilotMode = true;
  const lines = input.lines
    .map((l) => ({
      strainName: l.strainName.trim(),
      quantity: Math.floor(l.quantity),
    }))
    .filter((l) => l.strainName && isValidQty(l.quantity, config, pilotMode));

  if (!lines.length) {
    throw new Error(
      "At least one strain with a valid pilot pack quantity (50–200 seeds in 50-seed steps) is required"
    );
  }

  const quoteCalc = resolveQuote(
    lines.map((l, i) => ({
      strainId: `rfq-${i}`,
      name: l.strainName,
      quantity: l.quantity,
    })),
    config,
    {
      mode: input.coaMode,
      buyExtra: input.buyExtraCoa,
      packageACount: input.coaPackageA,
      packageBCount: input.coaPackageB,
      pilotMode,
    }
  );

  const toUnit = (thb: number) =>
    currency === "THB" ? thb : thbToEurDisplay(thb, config.eurThb);
  const toLine = (thb: number) =>
    currency === "THB" ? thb : thbToEurDisplay(thb, config.eurThb);

  const items: B2BQuoteLineItem[] = quoteCalc.lines.map((l, i) => ({
    id: `rfq-${i}`,
    strainName: l.name,
    breederName: B2B_BREEDER_SGF,
    quantity: l.quantity,
    unitPrice: toUnit(l.unitThb),
    lineTotal: toLine(l.lineTotalThb),
  }));

  if (input.coaMode === "with" && input.buyExtraCoa) {
    const a = Math.max(0, Math.floor(input.coaPackageA));
    const b = Math.max(0, Math.floor(input.coaPackageB));
    if (a > 0) {
      items.push({
        id: "rfq-coa-a",
        strainName: "COA Package A (Purity + Germination)",
        breederName: B2B_BREEDER_SGF,
        quantity: a,
        unitPrice: toUnit(config.coaPackageAThb),
        lineTotal: toLine(a * config.coaPackageAThb),
      });
    }
    if (b > 0) {
      items.push({
        id: "rfq-coa-b",
        strainName: "COA Package B (Purity + Germination + Moisture)",
        breederName: B2B_BREEDER_SGF,
        quantity: b,
        unitPrice: toUnit(config.coaPackageBThb),
        lineTotal: toLine(b * config.coaPackageBThb),
      });
    }
  }

  const invoiceDate = new Date().toISOString().slice(0, 10);
  const paymentNotes = [
    isGfPreGate()
      ? "Quotation request only — not a purchase order or deposit"
      : `Payment: ${PAYMENT_LABEL[input.paymentMethod]}`,
    `Company: ${input.companyName.trim()}`,
    `Contact: ${input.contactName.trim()}`,
    `Phone: ${input.phone.trim()}`,
    `COA mode: ${input.coaMode === "with" ? "With external lab COA" : "Seeds first (producer lot test)"}`,
    quoteCalc.freeCoaCount > 0
      ? `Free COA entitlement: ${quoteCalc.freeCoaCount}`
      : null,
    input.buyExtraCoa
      ? `Extra COA: A×${input.coaPackageA}, B×${input.coaPackageB}`
      : null,
    isGfPreGate()
      ? null
      : `Deposit 50%: ${quoteCalc.depositThb} THB`,
    isGfPreGate()
      ? null
      : `Balance 50%: ${quoteCalc.balanceThb} THB`,
    `ETA: ${
      input.coaMode === "with"
        ? "indicative after order confirmation — approx 35-40 days (incl. lab)"
        : "indicative after order confirmation — 3-7 business days"
    }`,
    input.message?.trim() ? `Message: ${input.message.trim()}` : null,
    "Source: /wholesale public RFQ",
  ]
    .filter(Boolean)
    .join("\n");

  const clientName = `${input.companyName.trim()} (${input.contactName.trim()})`;

  const quote = await saveB2BQuote({
    clientName,
    clientEmail: input.email.trim(),
    shippingAddress: input.address.trim(),
    invoiceDate,
    validUntil: defaultValidUntil(invoiceDate),
    currency,
    items,
    discountAmount: 0,
    shippingFee: 0,
    paymentNotes,
    status: "DRAFT",
  });

  await upsertBusinessContact({
    name: input.contactName.trim() || input.companyName.trim(),
    email: input.email.trim(),
    subject: `Wholesale RFQ ${quote.quoteNumber}`,
  }).catch((err) => console.error("[wholesale-rfq] contact upsert", err));

  void notifyTeamEmail({
    quoteNumber: quote.quoteNumber,
    companyName: input.companyName.trim(),
    contactName: input.contactName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    currency,
    totalAmount: quote.totalAmount,
  });

  return {
    quoteNumber: quote.quoteNumber,
    quoteId: quote.id,
    totalAmount: quote.totalAmount,
  };
}

export async function captureCoaLead(email: string, name?: string): Promise<void> {
  await upsertBusinessContact({
    name: (name ?? "").trim() || "COA Lead",
    email: email.trim(),
    subject: "Wholesale COA sample unlock",
  });
}

export type GacpInquiryInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  estimatedQty?: string;
  message?: string;
};

export async function captureGacpInquiry(input: GacpInquiryInput): Promise<void> {
  const companyName = input.companyName.trim();
  const contactName = input.contactName.trim();
  const email = input.email.trim();
  if (!companyName || !contactName || !email) {
    throw new Error("Company, contact, and email are required");
  }

  await upsertBusinessContact({
    name: contactName || companyName,
    email,
    subject: `GACP inquiry — ${companyName}${
      input.licenseNumber?.trim() ? ` · Lic ${input.licenseNumber.trim()}` : ""
    }`.slice(0, 300),
  });

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[gacp-inquiry] RESEND_API_KEY missing — skip team notify");
    return;
  }
  const to =
    process.env.WHOLESALE_RFQ_NOTIFY_EMAIL?.trim() ||
    process.env.B2B_GMAIL_USER?.trim() ||
    STORE_ENTITY.contactEmail;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Smile Seed Bank <orders@smileseedbank.com>",
      to: [to],
      subject: `[GACP Inquiry] ${companyName}`,
      text: [
        `New GACP document / consult inquiry`,
        `Company / Farm: ${companyName}`,
        `Contact: ${contactName}`,
        `Email: ${email}`,
        `Phone: ${input.phone?.trim() || "—"}`,
        `License: ${input.licenseNumber?.trim() || "—"}`,
        `Estimated qty: ${input.estimatedQty?.trim() || "—"}`,
        ``,
        `Message:`,
        input.message?.trim() || "—",
        ``,
        `Admin: /admin/partners/green-future`,
      ].join("\n"),
    }),
  });
}
