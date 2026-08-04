/**
 * Public wholesale RFQ — create B2B draft quote + notify team.
 */

import { saveB2BQuote } from "@/services/b2b-quote-service";
import { upsertBusinessContact } from "@/services/business-document-service";
import {
  gacpFeePerStrain,
  lineTotal as wholesaleLineTotal,
  unitPrice,
} from "@/lib/wholesale-public-pricing";
import { getWholesaleSettings } from "@/services/wholesale-catalog-service";
import {
  defaultValidUntil,
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
  requireGacp: boolean;
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
    "contact@smileseedbank.com";

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
  const settings = await getWholesaleSettings();
  const moq = settings.moq;
  const tiers = settings.tiers;
  const gacpFees = { thb: settings.gacpFeeThb, eur: settings.gacpFeeEur };

  const lines = input.lines
    .map((l) => ({
      strainName: l.strainName.trim(),
      quantity: Math.floor(l.quantity),
    }))
    .filter((l) => l.strainName && l.quantity >= moq);

  if (!lines.length) {
    throw new Error(`At least one strain with quantity ≥ ${moq} is required`);
  }

  const items: B2BQuoteLineItem[] = lines.map((l, i) => {
    const up = unitPrice(l.quantity, currency, tiers);
    return {
      id: `rfq-${i}`,
      strainName: l.strainName,
      quantity: l.quantity,
      unitPrice: up,
      lineTotal: wholesaleLineTotal(l.quantity, currency, tiers),
    };
  });

  if (input.requireGacp) {
    const fee = gacpFeePerStrain(currency, gacpFees);
    items.push({
      id: "rfq-gacp",
      strainName: "GACP Documentation Package (per strain)",
      quantity: lines.length,
      unitPrice: fee,
      lineTotal: fee * lines.length,
    });
  }

  const invoiceDate = new Date().toISOString().slice(0, 10);
  const paymentNotes = [
    `Payment: ${PAYMENT_LABEL[input.paymentMethod]}`,
    `Company: ${input.companyName.trim()}`,
    `Contact: ${input.contactName.trim()}`,
    `Phone: ${input.phone.trim()}`,
    input.requireGacp ? "GACP package: YES" : "GACP package: NO",
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
