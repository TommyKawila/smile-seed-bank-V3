/**
 * Links manual/claim orders to web `customers` (auth.users id) by email/phone without requiring login.
 */
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSql } from "@/lib/db";
import { createServiceRoleClient } from "@/lib/supabase/server";

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
    await prisma.customers.update({
      where: { id: order.customer_id },
      data: {
        full_name: name,
        phone: phone ?? undefined,
        address: addr || undefined,
        ...(email ? { email } : {}),
      },
    });
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
    await prisma.$transaction([
      prisma.orders.update({
        where: { id: input.orderId },
        data: { customer_id: customer.id },
      }),
      prisma.customers.update({
        where: { id: customer.id },
        data: {
          full_name: name,
          phone: phone ?? customer.phone,
          address: addr || customer.address,
          ...(email ? { email } : {}),
        },
      }),
    ]);
    return {
      linked: true,
      isExisting: true,
      displayName: customer.full_name?.trim() || name,
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
    await prisma.customers.upsert({
      where: { id: authIdExisting },
      create: {
        id: authIdExisting,
        email,
        full_name: name,
        phone: phone ?? undefined,
        address: addr || undefined,
        role: "USER",
      },
      update: {
        full_name: name,
        phone: phone ?? undefined,
        address: addr || undefined,
      },
    });
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

  await prisma.customers.upsert({
    where: { id: uid },
    create: {
      id: uid,
      email,
      full_name: name,
      phone: phone ?? undefined,
      address: addr || undefined,
      role: "USER",
    },
    update: {
      full_name: name,
      phone: phone ?? undefined,
      address: addr || undefined,
    },
  });

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
