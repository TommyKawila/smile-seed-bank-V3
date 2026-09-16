/**
 * Links manual/claim orders to web `customers` (auth.users id) by email/phone without requiring login.
 */
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSql } from "@/lib/db";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  claimPatchForExistingCustomer,
  hasCustomerPiiPatch,
  type ClaimFormPii,
} from "@/lib/claim-customer-profile-merge";

function normEmail(e: string | undefined | null): string | null {
  const t = e?.trim().toLowerCase();
  return t && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null;
}

function normPhone(p: string | undefined | null): string | null {
  const digits = (p ?? "").replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  return digits;
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const sql = getSql();
  const rows = await sql<{ id: string }[]>`
    SELECT id::text AS id FROM auth.users WHERE lower(trim(email)) = lower(trim(${email})) LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

const CUSTOMER_PII_SELECT = {
  full_name: true,
  phone: true,
  address: true,
  email: true,
} as const;

async function fillExistingCustomerBlanks(customerId: string, claim: ClaimFormPii) {
  const existing = await prisma.customers.findUnique({
    where: { id: customerId },
    select: CUSTOMER_PII_SELECT,
  });
  if (!existing) return;
  const patch = claimPatchForExistingCustomer(existing, claim);
  if (!hasCustomerPiiPatch(patch)) return;
  await prisma.customers.update({ where: { id: customerId }, data: patch });
}

async function upsertCustomerFromClaim(customerId: string, claim: ClaimFormPii) {
  const existing = await prisma.customers.findUnique({
    where: { id: customerId },
    select: CUSTOMER_PII_SELECT,
  });
  if (!existing) {
    await prisma.customers.create({
      data: {
        id: customerId,
        email: claim.email,
        full_name: claim.fullName,
        phone: claim.phone ?? undefined,
        address: claim.address || undefined,
        role: "USER",
      },
    });
    return;
  }
  await fillExistingCustomerBlanks(customerId, claim);
}

export type ClaimAssociateResult = {
  linked: boolean;
  /** True when matched existing customers row (or existing auth+customer), not newly created */
  isExisting: boolean;
  displayName: string;
  /** New auth user created — user can set password via login → forgot password */
  showSetPasswordHint: boolean;
};

export async function linkOrderToCustomerAfterClaim(input: {
  orderId: bigint;
  fullName: string;
  address: string;
  phone: string;
  email: string | null;
}): Promise<ClaimAssociateResult> {
  const email = normEmail(input.email);
  const phone = normPhone(input.phone);
  const name = input.fullName.trim() || "Customer";
  const addr = input.address.trim();
  const claim: ClaimFormPii = { fullName: name, phone, address: addr, email };

  const order = await prisma.orders.findUnique({
    where: { id: input.orderId },
    select: { customer_id: true },
  });
  if (!order) {
    return {
      linked: false,
      isExisting: false,
      displayName: name,
      showSetPasswordHint: false,
    };
  }

  if (order.customer_id) {
    await fillExistingCustomerBlanks(order.customer_id, claim);
    const c = await prisma.customers.findUnique({
      where: { id: order.customer_id },
      select: { full_name: true },
    });
    return {
      linked: true,
      isExisting: true,
      displayName: c?.full_name?.trim() || name,
      showSetPasswordHint: false,
    };
  }

  if (!email && !phone) {
    return {
      linked: false,
      isExisting: false,
      displayName: name,
      showSetPasswordHint: false,
    };
  }

  let customer = email
    ? await prisma.customers.findFirst({ where: { email } })
    : null;

  if (!customer && phone) {
    const byPhone = await prisma.customers.findMany({
      where: { phone },
      take: 2,
    });
    if (byPhone.length === 1) customer = byPhone[0];
  }

  if (customer) {
    const matched = customer;
    const patch = claimPatchForExistingCustomer(matched, claim);
    await prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: input.orderId },
        data: { customer_id: matched.id },
      });
      if (hasCustomerPiiPatch(patch)) {
        await tx.customers.update({ where: { id: matched.id }, data: patch });
      }
    });
    return {
      linked: true,
      isExisting: true,
      displayName: matched.full_name?.trim() || name,
      showSetPasswordHint: false,
    };
  }

  if (!email) {
    return {
      linked: false,
      isExisting: false,
      displayName: name,
      showSetPasswordHint: false,
    };
  }

  const authIdExisting = await findAuthUserIdByEmail(email);
  if (authIdExisting) {
    await upsertCustomerFromClaim(authIdExisting, claim);
    await prisma.orders.update({
      where: { id: input.orderId },
      data: { customer_id: authIdExisting },
    });
    const row = await prisma.customers.findUnique({
      where: { id: authIdExisting },
      select: { full_name: true },
    });
    return {
      linked: true,
      isExisting: true,
      displayName: row?.full_name?.trim() || name,
      showSetPasswordHint: false,
    };
  }

  const supabase = createServiceRoleClient();
  const tempPassword = randomBytes(32).toString("base64url");
  const { data: created, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  let uid = created?.user?.id ?? null;
  if (authErr || !uid) {
    const fallback = await findAuthUserIdByEmail(email);
    if (fallback) {
      uid = fallback;
    } else {
      console.error("[claim-customer-associate] createUser:", authErr?.message);
      return {
        linked: false,
        isExisting: false,
        displayName: name,
        showSetPasswordHint: false,
      };
    }
  }

  if (!uid) {
    return {
      linked: false,
      isExisting: false,
      displayName: name,
      showSetPasswordHint: false,
    };
  }

  const createdNewAuth = !!created?.user?.id;

  await upsertCustomerFromClaim(uid, claim);

  await prisma.orders.update({
    where: { id: input.orderId },
    data: { customer_id: uid },
  });

  return {
    linked: true,
    isExisting: !createdNewAuth,
    displayName: name,
    showSetPasswordHint: createdNewAuth,
  };
}
