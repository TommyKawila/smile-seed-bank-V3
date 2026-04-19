import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** One consolidated row for admin LINE link picker — newest activity first. */
export type LineRecentUserDto = {
  line_user_id: string;
  display_name: string | null;
  last_active_at: string;
  type: "guest" | "customer";
};

function parseGuestStoredAt(value: string | null | undefined, fallback: Date): Date {
  if (!value?.trim()) return fallback;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET() {
  try {
    const [custRows, guestRows] = await Promise.all([
      prisma.customers.findMany({
        where: { line_user_id: { not: null } },
        orderBy: { last_interaction_at: "desc" },
        take: 120,
        select: {
          line_user_id: true,
          full_name: true,
          last_interaction_at: true,
          created_at: true,
        },
      }),
      prisma.site_settings.findMany({
        where: { key: { startsWith: "line_ia_guest:" } },
        orderBy: { updated_at: "desc" },
        take: 120,
        select: { key: true, value: true, updated_at: true },
      }),
    ]);

    const byId = new Map<string, LineRecentUserDto>();

    for (const r of custRows) {
      const id = r.line_user_id?.trim();
      if (!id) continue;
      const last =
        r.last_interaction_at ?? r.created_at ?? new Date(0);
      byId.set(id, {
        line_user_id: id,
        display_name: r.full_name?.trim() || null,
        last_active_at: last.toISOString(),
        type: "customer",
      });
    }

    for (const r of guestRows) {
      const id = r.key.replace(/^line_ia_guest:/, "").trim();
      if (!id || byId.has(id)) continue;
      const last = parseGuestStoredAt(r.value, r.updated_at);
      byId.set(id, {
        line_user_id: id,
        display_name: null,
        last_active_at: last.toISOString(),
        type: "guest",
      });
    }

    const sorted = [...byId.values()].sort(
      (a, b) =>
        new Date(b.last_active_at).getTime() -
        new Date(a.last_active_at).getTime()
    );

    return NextResponse.json({ users: sorted.slice(0, 40) });
  } catch (err) {
    console.error("[line-recent-users]", err);
    return NextResponse.json({ error: String(err), users: [] }, { status: 500 });
  }
}
