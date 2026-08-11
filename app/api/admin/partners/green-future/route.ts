import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import {
  GREEN_FUTURE_SLUG,
  getPartnerSupplierBySlug,
  listPartnerDocuments,
  listPartnerStrains,
} from "@/services/partner-catalog-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const { searchParams } = new URL(req.url);
    const supplier = await getPartnerSupplierBySlug(GREEN_FUTURE_SLUG);
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }
    const [documents, strainResult] = await Promise.all([
      listPartnerDocuments(GREEN_FUTURE_SLUG),
      listPartnerStrains(GREEN_FUTURE_SLUG, {
        q: searchParams.get("q") ?? undefined,
        seedFormat: (searchParams.get("format") as "AUTO_FEM" | "FEM" | "ALL" | null) ?? "ALL",
        stockStatus:
          (searchParams.get("stock") as "IN_STOCK" | "PRE_ORDER" | "ALL" | null) ?? "ALL",
        istaStatus:
          (searchParams.get("ista") as "CONFIRMED" | "NONE" | "ALL" | null) ?? "ALL",
        limit: Number(searchParams.get("limit") ?? 200),
        offset: Number(searchParams.get("offset") ?? 0),
      }),
    ]);
    return NextResponse.json({
      supplier,
      documents,
      strains: strainResult.strains,
      total: strainResult.total,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
