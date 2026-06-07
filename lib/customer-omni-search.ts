import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CustomerOmniHit = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  email: string | null;
  tier: "Retail" | "Wholesale" | "VIP";
  wholesale_discount_percent: number;
  points: number;
};

type InternalHit = CustomerOmniHit & { _prio: number };

export function phoneDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/** Match Thai mobiles typed with or without leading 0. */
export function phoneDigitPatterns(qRaw: string): string[] {
  const d = phoneDigits(qRaw);
  const out = new Set<string>();
  if (d.length >= 3) {
    out.add(d);
    if (d.length === 9 && /^[689]/.test(d)) out.add(`0${d}`);
    if (d.length === 10 && d.startsWith("0")) out.add(d.slice(1));
  }
  return [...out];
}

function sqlPhonePatterns(column: string, patterns: string[]): Prisma.Sql {
  if (patterns.length === 0) return Prisma.sql`FALSE`;
  return Prisma.join(
    patterns.map(
      (p) =>
        Prisma.sql`regexp_replace(COALESCE(${Prisma.raw(column)}, ''), '[^0-9]', '', 'g') LIKE ${`%${p}%`}`
    ),
    " OR "
  );
}

function dedupeOmniHits(rows: InternalHit[]): CustomerOmniHit[] {
  const byKey = new Map<string, InternalHit>();
  for (const r of rows) {
    const d = phoneDigits(r.phone);
    const key = d.length >= 9 ? `d:${d}` : `n:${r.name.trim().toLowerCase()}|${r.phone}`;
    const prev = byKey.get(key);
    if (!prev || r._prio > prev._prio) {
      byKey.set(key, { ...r });
      continue;
    }
    if (r._prio === prev._prio) {
      byKey.set(key, {
        ...prev,
        name: prev.name.length >= r.name.length ? prev.name : r.name,
        phone: phoneDigits(prev.phone).length >= phoneDigits(r.phone).length ? prev.phone : r.phone,
        address: prev.address?.trim() || r.address?.trim() || null,
        notes: prev.notes?.trim() || r.notes?.trim() || null,
        email: prev.email?.trim() || r.email?.trim() || null,
        wholesale_discount_percent: Math.max(prev.wholesale_discount_percent, r.wholesale_discount_percent),
        points: Math.max(prev.points, r.points),
      });
    }
  }
  return Array.from(byKey.values())
    .sort((a, b) => a.name.localeCompare(b.name, "th", { sensitivity: "base" }))
    .map(({ _prio: _, ...hit }) => hit);
}

function parseTier(raw: string | null | undefined): CustomerOmniHit["tier"] {
  if (raw === "Wholesale" || raw === "VIP") return raw;
  return "Retail";
}

export async function searchCustomersOmni(qRaw: string, limit: number): Promise<CustomerOmniHit[]> {
  const q = qRaw.trim();
  if (!q) return [];

  const qNorm = q.replace(/[\s\-().]/g, "");
  const patterns = phoneDigitPatterns(q);
  const phoneSql = sqlPhonePatterns("phone", patterns);
  const phoneSqlOrders = sqlPhonePatterns("customer_phone", patterns);
  const phoneSqlQuotes = sqlPhonePatterns("customer_phone", patterns);

  const [posRows, webRows, quoteRows, orderRows] = await Promise.all([
    prisma.$queryRaw<
      {
        id: bigint;
        name: string;
        phone: string;
        address: string | null;
        notes: string | null;
        tier: string;
        wholesale_discount_percent: number;
        points: number;
      }[]
    >`
      SELECT id, name, phone, address, notes, tier::text AS tier,
             wholesale_discount_percent, points
      FROM "Customer"
      WHERE is_active = true
        AND (
          name ILIKE ${`%${q}%`}
          OR phone ILIKE ${`%${q}%`}
          ${qNorm !== q ? Prisma.sql`OR phone ILIKE ${`%${qNorm}%`}` : Prisma.sql``}
          OR (${phoneSql})
        )
      ORDER BY name ASC
      LIMIT ${limit}
    `,
    prisma.$queryRaw<
      {
        id: string;
        full_name: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
        is_wholesale: boolean | null;
        wholesale_discount_percent: unknown;
      }[]
    >`
      SELECT id, full_name, phone, email, address, is_wholesale, wholesale_discount_percent
      FROM public.customers
      WHERE (
        COALESCE(full_name, '') ILIKE ${`%${q}%`}
        OR COALESCE(phone, '') ILIKE ${`%${q}%`}
        OR COALESCE(email, '') ILIKE ${`%${q}%`}
        OR COALESCE(address, '') ILIKE ${`%${q}%`}
        ${qNorm !== q ? Prisma.sql`OR COALESCE(phone, '') ILIKE ${`%${qNorm}%`}` : Prisma.sql``}
        OR (${sqlPhonePatterns("phone", patterns)})
      )
      ORDER BY full_name ASC NULLS LAST
      LIMIT ${limit}
    `,
    prisma.$queryRaw<
      { name: string | null; phone: string | null; email: string | null; address: string | null; notes: string | null }[]
    >`
      WITH ranked AS (
        SELECT
          customer_name,
          customer_phone,
          customer_email,
          customer_address,
          customer_note,
          created_at,
          id,
          CASE
            WHEN length(regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g')) >= 9
            THEN regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g')
            ELSE ('id:' || id::text)
          END AS dedupe_key
        FROM public.quotations
        WHERE (
          COALESCE(TRIM(customer_name), '') <> ''
          OR COALESCE(TRIM(customer_phone), '') <> ''
        )
        AND (
          COALESCE(customer_name, '') ILIKE ${`%${q}%`}
          OR COALESCE(customer_email, '') ILIKE ${`%${q}%`}
          OR COALESCE(customer_address, '') ILIKE ${`%${q}%`}
          OR COALESCE(customer_phone, '') ILIKE ${`%${q}%`}
          OR (${phoneSqlQuotes})
        )
      ),
      picked AS (
        SELECT
          customer_name AS name,
          customer_phone AS phone,
          customer_email AS email,
          customer_address AS address,
          customer_note AS notes,
          ROW_NUMBER() OVER (PARTITION BY dedupe_key ORDER BY created_at DESC) AS rn
        FROM ranked
      )
      SELECT name, phone, email, address, notes FROM picked WHERE rn = 1
      LIMIT ${limit}
    `,
    prisma.$queryRaw<
      { name: string | null; phone: string | null; address: string | null; note: string | null }[]
    >`
      WITH ranked AS (
        SELECT
          COALESCE(NULLIF(TRIM(customer_name), ''), NULLIF(TRIM(shipping_name), '')) AS name,
          COALESCE(NULLIF(TRIM(customer_phone), ''), NULLIF(TRIM(shipping_phone), '')) AS phone,
          shipping_address AS address,
          customer_note AS note,
          created_at,
          id,
          CASE
            WHEN length(
              regexp_replace(
                COALESCE(NULLIF(TRIM(customer_phone), ''), NULLIF(TRIM(shipping_phone), ''), ''),
                '[^0-9]', '', 'g'
              )
            ) >= 9
            THEN regexp_replace(
              COALESCE(NULLIF(TRIM(customer_phone), ''), NULLIF(TRIM(shipping_phone), ''), ''),
              '[^0-9]', '', 'g'
            )
            ELSE ('id:' || id::text)
          END AS dedupe_key
        FROM public.orders
        WHERE (
          COALESCE(TRIM(customer_name), '') <> ''
          OR COALESCE(TRIM(customer_phone), '') <> ''
          OR COALESCE(TRIM(shipping_name), '') <> ''
          OR COALESCE(TRIM(shipping_phone), '') <> ''
        )
        AND (
          COALESCE(customer_name, '') ILIKE ${`%${q}%`}
          OR COALESCE(shipping_name, '') ILIKE ${`%${q}%`}
          OR COALESCE(customer_phone, '') ILIKE ${`%${q}%`}
          OR COALESCE(shipping_phone, '') ILIKE ${`%${q}%`}
          OR COALESCE(shipping_address, '') ILIKE ${`%${q}%`}
          OR (${phoneSqlOrders})
        )
      ),
      picked AS (
        SELECT name, phone, address, note,
          ROW_NUMBER() OVER (PARTITION BY dedupe_key ORDER BY created_at DESC) AS rn
        FROM ranked
      )
      SELECT name, phone, address, note FROM picked WHERE rn = 1
      LIMIT ${limit}
    `,
  ]);

  const merged: InternalHit[] = [];

  for (const c of posRows) {
    merged.push({
      id: `pos-${c.id}`,
      name: c.name,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      email: null,
      tier: parseTier(c.tier),
      wholesale_discount_percent: Number(c.wholesale_discount_percent ?? 0),
      points: Number(c.points ?? 0),
      _prio: 4,
    });
  }

  for (const c of webRows) {
    const phone = (c.phone ?? "").trim();
    merged.push({
      id: `web-${c.id}`,
      name: (c.full_name ?? "").trim() || phone || "—",
      phone,
      address: c.address,
      notes: null,
      email: c.email,
      tier: c.is_wholesale ? "Wholesale" : "Retail",
      wholesale_discount_percent: Number(c.wholesale_discount_percent ?? 0),
      points: 0,
      _prio: 3,
    });
  }

  let oi = 0;
  for (const r of orderRows) {
    const phone = (r.phone ?? "").trim();
    const name = (r.name ?? "").trim() || phone || "—";
    if (!name && !phone) continue;
    merged.push({
      id: `ord-${oi++}`,
      name,
      phone,
      address: r.address,
      notes: r.note,
      email: null,
      tier: "Retail",
      wholesale_discount_percent: 0,
      points: 0,
      _prio: 2,
    });
  }

  let qi = 0;
  for (const r of quoteRows) {
    const phone = (r.phone ?? "").trim();
    const name = (r.name ?? "").trim() || phone || "—";
    merged.push({
      id: `qt-${qi++}`,
      name,
      phone,
      address: r.address,
      notes: r.notes,
      email: r.email,
      tier: "Retail",
      wholesale_discount_percent: 0,
      points: 0,
      _prio: 1,
    });
  }

  return dedupeOmniHits(merged).slice(0, limit);
}
