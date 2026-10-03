/**
 * SGF /wholesale deposit reservations — separate from shop cart orders.
 * Does not issue a GF PO or transfer funds upstream.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendAdminNotification } from "@/lib/admin-notification";
import { createAdminClient } from "@/lib/supabase/server";
import { gfAcceptsPublicDeposits } from "@/lib/green-future-approved-marketing";
import type { FulfillmentTier } from "@/lib/wholesale-fulfillment";
import type { CoaMode } from "@/lib/wholesale-bulk-pricing";
import { quoteWholesaleDeposit } from "@/lib/wholesale-deposit-quote";
import { getBulkPricingConfig } from "@/services/wholesale-catalog-service";
import { upsertBusinessContact } from "@/services/business-document-service";

const SLIP_BUCKET = "payment-slips";
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export type WholesaleDepositStatus =
  | "PENDING_TRANSFER"
  | "AWAITING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export type DepositLineInput = {
  varietyCode: string;
  strainName: string;
  quantity: number;
};

export type CreateDepositOrderInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  licenseStatus?: "active" | "pending";
  licenseNumber?: string;
  message?: string;
  coaMode: CoaMode;
  buyExtraCoa: boolean;
  coaPackageA: number;
  coaPackageB: number;
  lines: DepositLineInput[];
};

export type DepositOrderPublic = {
  reservationNumber: string;
  depositThb: number;
  grandTotalThb: number;
  balanceThb: number;
  status: WholesaleDepositStatus;
  hasDocsReady: boolean;
  hasDocsPending: boolean;
};

export type DepositOrderAdminItem = {
  varietyCode: string;
  strainName: string;
  fulfillmentTier: FulfillmentTier;
  quantity: number;
  lineTotalThb: number;
};

export type DepositOrderAdmin = DepositOrderPublic & {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  seedTotalThb: number;
  extraCoaThb: number;
  slipUrl: string | null;
  transferAmountThb: number | null;
  transferredAt: string | null;
  payerName: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  items: DepositOrderAdminItem[];
};

function formatReservationNumber(year: string, seq: number): string {
  return `SSB-WD-${year}-${String(Math.max(1, seq)).padStart(3, "0")}`;
}

async function nextReservationNumber(): Promise<string> {
  const year = String(new Date().getFullYear());
  return prisma.$transaction(async (tx) => {
    const existing = await tx.wholesale_deposit_yearly_seq.findUnique({
      where: { year },
    });
    const row = existing
      ? await tx.wholesale_deposit_yearly_seq.update({
          where: { year },
          data: { seq: { increment: 1 } },
        })
      : await tx.wholesale_deposit_yearly_seq.create({
          data: { year, seq: 1 },
        });
    return formatReservationNumber(year, row.seq);
  });
}

function asStatus(raw: string): WholesaleDepositStatus {
  if (
    raw === "PENDING_TRANSFER" ||
    raw === "AWAITING_VERIFICATION" ||
    raw === "VERIFIED" ||
    raw === "REJECTED"
  ) {
    return raw;
  }
  return "PENDING_TRANSFER";
}

export async function createWholesaleDepositOrder(
  input: CreateDepositOrderInput
): Promise<DepositOrderPublic> {
  if (!gfAcceptsPublicDeposits()) {
    throw new Error("Customer deposits are not open");
  }

  const config = await getBulkPricingConfig();
  const priced = quoteWholesaleDeposit({
    lines: input.lines,
    config,
    coaMode: input.coaMode,
    buyExtraCoa: input.buyExtraCoa,
    coaPackageA: input.coaPackageA,
    coaPackageB: input.coaPackageB,
  });
  const { lines, quote, packageA, packageB } = priced;

  if (!lines.length || !quote.allValid) {
    throw new Error(
      "At least one strain with a valid 50-seed pouch quantity is required"
    );
  }

  const reservationNumber = await nextReservationNumber();

  const created = await prisma.wholesale_deposit_orders.create({
    data: {
      reservation_number: reservationNumber,
      company_name: input.companyName.trim(),
      contact_name: input.contactName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      license_status: input.licenseStatus ?? null,
      license_number: input.licenseNumber?.trim() || null,
      message: input.message?.trim() || null,
      currency: "THB",
      seed_total_thb: new Prisma.Decimal(quote.seedTotalThb),
      extra_coa_thb: new Prisma.Decimal(quote.extraCoaThb),
      grand_total_thb: new Prisma.Decimal(quote.grandTotalThb),
      deposit_thb: new Prisma.Decimal(quote.depositThb),
      balance_thb: new Prisma.Decimal(quote.balanceThb),
      coa_mode: input.coaMode,
      package_a_count: packageA,
      package_b_count: packageB,
      status: "PENDING_TRANSFER",
      items: {
        create: quote.lines.map((l, i) => {
          const src = lines[i];
          return {
            variety_code: src?.varietyCode ?? l.strainId,
            strain_name: src?.strainName ?? l.name,
            fulfillment_tier: src?.fulfillmentTier ?? "docs_pending",
            quantity: l.quantity,
            unit_thb: new Prisma.Decimal(l.unitThb),
            line_total_thb: new Prisma.Decimal(l.lineTotalThb),
            sort_order: i,
          };
        }),
      },
    },
    include: { items: true },
  });

  await upsertBusinessContact({
    name: input.contactName.trim() || input.companyName.trim(),
    email: input.email.trim(),
    subject: `Wholesale deposit ${reservationNumber}`,
  }).catch((err) => console.error("[wholesale-deposit] contact upsert", err));

  const hasDocsReady = created.items.some(
    (i) => i.fulfillment_tier === "docs_ready"
  );
  const hasDocsPending = created.items.some(
    (i) => i.fulfillment_tier === "docs_pending"
  );

  void sendAdminNotification(
    [
      `SGF deposit reservation ${reservationNumber}`,
      `${input.companyName.trim()} · ${input.contactName.trim()}`,
      `Deposit 50%: ${quote.depositThb.toLocaleString("en-US")} THB`,
      `Total: ${quote.grandTotalThb.toLocaleString("en-US")} THB`,
      hasDocsReady ? "Includes documented (3-day) lines" : null,
      hasDocsPending ? "Includes lines outside the 5-code pilot list" : null,
      `Admin: /admin/wholesale`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return {
    reservationNumber,
    depositThb: quote.depositThb,
    grandTotalThb: quote.grandTotalThb,
    balanceThb: quote.balanceThb,
    status: "PENDING_TRANSFER",
    hasDocsReady,
    hasDocsPending,
  };
}

export async function getDepositOrderPublic(
  reservationNumber: string
): Promise<DepositOrderPublic | null> {
  const row = await prisma.wholesale_deposit_orders.findUnique({
    where: { reservation_number: reservationNumber.trim().toUpperCase() },
    include: { items: true },
  });
  if (!row) return null;
  return {
    reservationNumber: row.reservation_number,
    depositThb: Number(row.deposit_thb),
    grandTotalThb: Number(row.grand_total_thb),
    balanceThb: Number(row.balance_thb),
    status: asStatus(row.status),
    hasDocsReady: row.items.some((i) => i.fulfillment_tier === "docs_ready"),
    hasDocsPending: row.items.some((i) => i.fulfillment_tier === "docs_pending"),
  };
}

export async function submitDepositTransfer(input: {
  reservationNumber: string;
  transferAmountThb: number;
  transferredAt: Date;
  payerName: string;
  file: File;
}): Promise<{ slipUrl: string; status: WholesaleDepositStatus }> {
  const number = input.reservationNumber.trim().toUpperCase();
  const order = await prisma.wholesale_deposit_orders.findUnique({
    where: { reservation_number: number },
  });
  if (!order) throw new Error("Reservation not found");
  if (order.status === "VERIFIED") {
    throw new Error("Deposit already verified");
  }
  if (order.slip_url && order.status === "AWAITING_VERIFICATION") {
    throw new Error("Slip already uploaded");
  }

  const ext = input.file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error("Allowed file types: jpg, png, webp, pdf");
  }
  if (input.file.size > MAX_FILE_SIZE) {
    throw new Error("File too large (max 5MB)");
  }

  const path = `wholesale-deposits/${number}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const contentType =
    input.file.type || (ext === "pdf" ? "application/pdf" : "image/jpeg");

  const supabase = await createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(SLIP_BUCKET)
    .upload(path, buffer, { cacheControl: "3600", upsert: true, contentType });
  if (uploadError) {
    throw new Error(uploadError.message);
  }
  const { data } = supabase.storage.from(SLIP_BUCKET).getPublicUrl(path);
  const slipUrl = data.publicUrl;

  await prisma.wholesale_deposit_orders.update({
    where: { id: order.id },
    data: {
      slip_url: slipUrl,
      slip_path: path,
      transfer_amount_thb: new Prisma.Decimal(
        Math.max(0, Math.round(input.transferAmountThb))
      ),
      transferred_at: input.transferredAt,
      payer_name: input.payerName.trim().slice(0, 200),
      status: "AWAITING_VERIFICATION",
    },
  });

  void sendAdminNotification(
    [
      `SGF deposit slip ${number}`,
      `Payer: ${input.payerName.trim()}`,
      `Transferred: ${Math.round(input.transferAmountThb).toLocaleString("en-US")} THB`,
      `Due deposit: ${Number(order.deposit_thb).toLocaleString("en-US")} THB`,
      `Please verify in Admin → Wholesale.`,
    ].join("\n")
  );

  return { slipUrl, status: "AWAITING_VERIFICATION" };
}

function toAdmin(row: {
  id: bigint;
  reservation_number: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  seed_total_thb: Prisma.Decimal;
  extra_coa_thb: Prisma.Decimal;
  grand_total_thb: Prisma.Decimal;
  deposit_thb: Prisma.Decimal;
  balance_thb: Prisma.Decimal;
  status: string;
  slip_url: string | null;
  transfer_amount_thb: Prisma.Decimal | null;
  transferred_at: Date | null;
  payer_name: string | null;
  admin_note: string | null;
  created_at: Date;
  updated_at: Date;
  items: Array<{
    variety_code: string;
    strain_name: string;
    fulfillment_tier: string;
    quantity: number;
    line_total_thb: Prisma.Decimal;
  }>;
}): DepositOrderAdmin {
  const items: DepositOrderAdminItem[] = row.items.map((i) => ({
    varietyCode: i.variety_code,
    strainName: i.strain_name,
    fulfillmentTier:
      i.fulfillment_tier === "docs_ready" ? "docs_ready" : "docs_pending",
    quantity: i.quantity,
    lineTotalThb: Number(i.line_total_thb),
  }));
  return {
    id: String(row.id),
    reservationNumber: row.reservation_number,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    seedTotalThb: Number(row.seed_total_thb),
    extraCoaThb: Number(row.extra_coa_thb),
    grandTotalThb: Number(row.grand_total_thb),
    depositThb: Number(row.deposit_thb),
    balanceThb: Number(row.balance_thb),
    status: asStatus(row.status),
    hasDocsReady: items.some((i) => i.fulfillmentTier === "docs_ready"),
    hasDocsPending: items.some((i) => i.fulfillmentTier === "docs_pending"),
    slipUrl: row.slip_url,
    transferAmountThb:
      row.transfer_amount_thb == null ? null : Number(row.transfer_amount_thb),
    transferredAt: row.transferred_at?.toISOString() ?? null,
    payerName: row.payer_name,
    adminNote: row.admin_note,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    items,
  };
}

export async function listWholesaleDeposits(
  limit = 60
): Promise<DepositOrderAdmin[]> {
  const rows = await prisma.wholesale_deposit_orders.findMany({
    include: { items: { orderBy: { sort_order: "asc" } } },
    orderBy: { updated_at: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  return rows.map(toAdmin);
}

export async function updateWholesaleDepositStatus(input: {
  id: string;
  status: "VERIFIED" | "REJECTED";
  adminNote?: string;
}): Promise<DepositOrderAdmin | null> {
  try {
    const row = await prisma.wholesale_deposit_orders.update({
      where: { id: BigInt(input.id) },
      data: {
        status: input.status,
        admin_note: input.adminNote?.trim() || null,
        verified_at: input.status === "VERIFIED" ? new Date() : null,
      },
      include: { items: { orderBy: { sort_order: "asc" } } },
    });
    return toAdmin(row);
  } catch {
    return null;
  }
}
