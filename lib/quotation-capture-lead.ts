import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

function phoneDigits(s: string) {
  return s.replace(/\D/g, "");
}

export async function captureWebCustomerLeadFromQuotation(args: {
  name: string | null | undefined;
  phone: string | null | undefined;
  email: string | null | undefined;
  address: string | null | undefined;
}) {
  const raw = args.phone?.replace(/[\s\-().]/g, "").trim() ?? "";
  if (!raw) return;
  const d = phoneDigits(raw);
  if (d.length < 9) return;

  const found = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM public.customers
    WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = ${d}
    LIMIT 1
  `;
  if (found.length > 0) return;

  const name = args.name?.trim() || null;
  const address = args.address?.trim() || null;
  let email = args.email?.trim() || null;

  try {
    await prisma.customers.create({
      data: {
        id: randomUUID(),
        full_name: name,
        phone: raw,
        email,
        address,
      },
    });
  } catch (e) {
    if (!String(e).includes("Unique")) return;
    await prisma.customers.create({
      data: {
        id: randomUUID(),
        full_name: name,
        phone: raw,
        email: null,
        address,
      },
    });
  }
}
