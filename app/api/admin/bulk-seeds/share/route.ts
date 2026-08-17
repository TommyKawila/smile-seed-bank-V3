import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { mintBulkShareToken, type BulkSharePayload } from "@/lib/bulk-share-token";
import { DEFAULT_EUR_THB, type BulkSupplierSlug } from "@/lib/bulk-seeds-book";

export const dynamic = "force-dynamic";

const SLUGS = new Set<BulkSupplierSlug>(["green-future", "seeds-genetics"]);

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  let body: {
    title?: string;
    days?: number;
    suppliers?: string[];
    showStrains?: boolean;
    gmOverride?: number | null;
    landed?: Partial<Record<BulkSupplierSlug, number>>;
    eurThb?: number;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const suppliers = (body.suppliers ?? []).filter((s): s is BulkSupplierSlug =>
    SLUGS.has(s as BulkSupplierSlug)
  );
  if (suppliers.length === 0) {
    return NextResponse.json({ error: "Pick at least one supplier" }, { status: 400 });
  }

  const days = Math.min(90, Math.max(1, Number(body.days) || 14));
  const payload: BulkSharePayload = {
    v: 1,
    exp: Date.now() + days * 86_400_000,
    title: (body.title ?? "Bulk seed offer").trim().slice(0, 80) || "Bulk seed offer",
    suppliers,
    showStrains: Boolean(body.showStrains),
    gmOverride:
      body.gmOverride != null && Number.isFinite(body.gmOverride)
        ? Math.min(90, Math.max(0, body.gmOverride))
        : null,
    landed: body.landed ?? {},
    eurThb: Number(body.eurThb) > 0 ? Number(body.eurThb) : DEFAULT_EUR_THB,
  };

  try {
    const token = mintBulkShareToken(payload);
    return NextResponse.json({ token, path: `/share/bulk/${token}`, expiresAt: payload.exp });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
