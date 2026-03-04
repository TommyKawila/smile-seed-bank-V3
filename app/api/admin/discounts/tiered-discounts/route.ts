import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import postgres from "postgres";

const RuleSchema = z.object({
  min_spend: z.number().min(0),
  discount_percent: z.number().min(0).max(100),
});

const PostSchema = z.object({
  rules: z.array(RuleSchema),
});

let _sql: ReturnType<typeof postgres> | null = null;
function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL not configured. Add it from Supabase → Project Settings → Database → Connection string (URI)");
  }
  if (!_sql) _sql = postgres(url, { max: 2 });
  return _sql;
}

export async function GET() {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT min_spend, discount_percent
      FROM public.tiered_discounts_v4
      ORDER BY min_spend
    `;
    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET tiered_discounts_v4 - Postgres driver error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const payload = parsed.data.rules.map((r, i) => ({
      min_spend: r.min_spend,
      discount_percent: r.discount_percent,
      sort_order: i + 1,
    }));

    const sql = getSql();
    await sql.begin(async (tx) => {
      await tx`DELETE FROM public.tiered_discounts_v4`;
      if (payload.length > 0) {
        await tx`
          INSERT INTO public.tiered_discounts_v4 (min_spend, discount_percent, sort_order)
          VALUES ${tx(payload.map((p) => [p.min_spend, p.discount_percent, p.sort_order]))}
        `;
      }
    });

    const sorted = [...payload].sort((a, b) => a.min_spend - b.min_spend);
    return NextResponse.json(sorted.map((p) => ({ min_spend: p.min_spend, discount_percent: p.discount_percent })));
  } catch (e) {
    console.error("POST tiered_discounts_v4 - Postgres driver error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
