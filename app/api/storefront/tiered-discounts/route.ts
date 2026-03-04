import { NextResponse } from "next/server";
import postgres from "postgres";

const FALLBACK: { min_spend: number; discount_percent: number }[] = [
  { min_spend: 2000, discount_percent: 10 },
  { min_spend: 4000, discount_percent: 15 },
  { min_spend: 6000, discount_percent: 20 },
];

let _sql: ReturnType<typeof postgres> | null = null;
function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!_sql) _sql = postgres(url, { max: 2 });
  return _sql;
}

export async function GET() {
  try {
    const sql = getSql();
    if (!sql) return NextResponse.json(FALLBACK);
    const rows = await sql`
      SELECT min_spend, discount_percent
      FROM public.tiered_discounts_v4
      ORDER BY min_spend
    `;
    if (rows.length > 0) return NextResponse.json(rows);
    return NextResponse.json(FALLBACK);
  } catch (e) {
    console.error("GET tiered_discounts_v4 - Postgres error:", e);
    return NextResponse.json(FALLBACK);
  }
}
