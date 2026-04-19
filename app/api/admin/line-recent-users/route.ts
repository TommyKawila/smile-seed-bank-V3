import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export type LineRecentUserRow = {
  lineUserId: string;
  label: string | null;
  source: "customer" | "guest";
};

/** Recent LINE user ids from webhook guests + customers with line_user_id. */
export async function GET() {
  try {
    const [custRows, guestRows] = await Promise.all([
      prisma.customers.findMany({
        where: { line_user_id: { not: null } },
        orderBy: { last_interaction_at: "desc" },
        take: 20,
        select: { line_user_id: true, full_name: true },
      }),
      prisma.site_settings.findMany({
        where: { key: { startsWith: "line_ia_guest:" } },
        orderBy: { updated_at: "desc" },
        take: 20,
        select: { key: true },
      }),
    ]);

    const out: LineRecentUserRow[] = [];
    const seen = new Set<string>();

    for (const r of custRows) {
      const id = r.line_user_id?.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({
        lineUserId: id,
        label: r.full_name?.trim() || null,
        source: "customer",
      });
    }

    for (const r of guestRows) {
      const id = r.key.replace(/^line_ia_guest:/, "").trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ lineUserId: id, label: null, source: "guest" });
    }

    return NextResponse.json({ users: out.slice(0, 25) });
  } catch (err) {
    console.error("[line-recent-users]", err);
    return NextResponse.json({ error: String(err), users: [] }, { status: 500 });
  }
}
