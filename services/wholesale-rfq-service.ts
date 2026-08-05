/**
 * Public wholesale RFQ — create B2B draft quote + notify team.
 */

import { saveB2BQuote } from "@/services/b2b-quote-service";
import { upsertBusinessContact } from "@/services/business-document-service";
import { lineTotal as b2bLineTotal } from "@/lib/b2b-quote-calc";
import {
  eurUnitPriceFromThbLine,
  isValidQty,
  resolveQuote,
  type CoaMode,
} from "@/lib/wholesale-bulk-pricing";
import { getBulkPricingConfig } from "@/services/wholesale-catalog-service";
import {
  defaultValidUntil,
  type B2BCurrency,
  type B2BQuoteLineItem,
} from "@/types/b2b-quote";

/** Persist unit/line so B2B qty×unit totals match storefront EUR display. */
function toQuoteMoney(
  unitThb: number,
  lineTotalThb: number,
  quantity: number,
  currency: B2BCurrency,
  eurThb: number
): { unitPrice: number; lineTotal: number } {
  if (currency === "THB") {
    return { unitPrice: unitThb, lineTotal: lineTotalThb };
  }
  const unitPrice = eurUnitPriceFromThbLine(lineTotalThb, quantity, eurThb);
  return {
    unitPrice,
    lineTotal: b2bLineTotal(quantity, unitPrice, "EUR"),
  };
}

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
  const config = await getBulkPricingConfig();

  const lines = input.lines
    .map((l) => ({
      strainName: l.strainName.trim(),
      quantity: Math.floor(l.quantity),
    }))
    .filter((l) => l.strainName && isValidQty(l.quantity, config));

  if (!lines.length) {
    throw new Error(
      "At least one strain with qty 100 (SSB pack) or ≥ 500 is required"
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
    }
  );

  const items: B2BQuoteLineItem[] = quoteCalc.lines.map((l, i) => {
    const money = toQuoteMoney(
      l.unitThb,
      l.lineTotalThb,
      l.quantity,
      currency,
      config.eurThb
    );
    return {
      id: `rfq-${i}`,
      strainName: l.name,
      quantity: l.quantity,
      unitPrice: money.unitPrice,
      lineTotal: money.lineTotal,
    };
  });

  if (input.coaMode === "with" && input.buyExtraCoa) {
    const a = Math.max(0, Math.floor(input.coaPackageA));
    const b = Math.max(0, Math.floor(input.coaPackageB));
    if (a > 0) {
      const money = toQuoteMoney(
        config.coaPackageAThb,
        a * config.coaPackageAThb,
        a,
        currency,
        config.eurThb
      );
      items.push({
        id: "rfq-coa-a",
        strainName: "COA Package A (Purity + Germination)",
        quantity: a,
        unitPrice: money.unitPrice,
        lineTotal: money.lineTotal,
      });
    }
    if (b > 0) {
      const money = toQuoteMoney(
        config.coaPackageBThb,
        b * config.coaPackageBThb,
        b,
        currency,
        config.eurThb
      );
      items.push({
        id: "rfq-coa-b",
        strainName: "COA Package B (Purity + Germination + Moisture)",
        quantity: b,
        unitPrice: money.unitPrice,
        lineTotal: money.lineTotal,
      });
    }
  }

  const invoiceDate = new Date().toISOString().slice(0, 10);
  const paymentNotes = [
    `Payment: ${PAYMENT_LABEL[input.paymentMethod]}`,
    `Company: ${input.companyName.trim()}`,
    `Contact: ${input.contactName.trim()}`,
    `Phone: ${input.phone.trim()}`,
    `COA mode: ${input.coaMode === "with" ? "With COA" : "No COA"}`,
    quoteCalc.freeCoaCount > 0
      ? `Free COA entitlement: ${quoteCalc.freeCoaCount}`
      : null,
    input.buyExtraCoa
      ? `Extra COA: A×${input.coaPackageA}, B×${input.coaPackageB}`
      : null,
    `Deposit 50%: ${quoteCalc.depositThb} THB`,
    `Balance 50%: ${quoteCalc.balanceThb} THB`,
    `ETA: ${
      input.coaMode === "with"
        ? "approx 35-40 days (incl. lab)"
        : "3-7 business days"
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
