export type B2BPaymentTermsCopy = {
  bankTransfer: string[];
  crypto: string[];
  notes: string[];
};

export function buildB2BPaymentTerms(opts?: {
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
}): B2BPaymentTermsCopy {
  const company = opts?.companyName?.trim() || "Smile Seed Bank";
  const email = opts?.companyEmail?.trim() || "orders@smileseedbank.com";
  const phone = opts?.companyPhone?.trim();
  const address = opts?.companyAddress?.trim();

  const bankTransfer = [
    `Bank Transfer (THB / EUR / USD) — payable to ${company}`,
    email ? `Contact for bank details: ${email}` : "Contact us for bank details",
  ];
  if (phone) bankTransfer.push(`Phone: ${phone}`);
  if (address) bankTransfer.push(address);

  return {
    bankTransfer,
    crypto: [
      "Cryptocurrency (USDT / Crypto Wallet)",
      "Request wallet address and network (TRC20 / ERC20) before transfer.",
    ],
    notes: [
      "Dispatch date is as stated in the order notes, or confirmed in writing after payment. Domestic shipping in Thailand is quoted separately.",
      "This quotation lists genetics and commercial terms only.",
      "This pro-forma is valid until the expiry date shown above.",
    ],
  };
}

export function b2bQuoteCustomNoteLines(paymentNotes?: string | null): string[] {
  if (!paymentNotes?.trim()) return [];
  return paymentNotes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function b2bQuoteAllNoteLines(
  terms: B2BPaymentTermsCopy,
  paymentNotes?: string | null
): string[] {
  return [...terms.notes, ...b2bQuoteCustomNoteLines(paymentNotes)];
}
