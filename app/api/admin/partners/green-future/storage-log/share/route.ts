import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { rotateCabinetStorageShareToken } from "@/services/cabinet-storage-log-service";

export const dynamic = "force-dynamic";

function originFrom(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.smileseedbank.com"
  );
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const data = await rotateCabinetStorageShareToken(originFrom(req));
    return NextResponse.json(data);
  } catch (e) {
    console.error("[storage-log share rotate]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Rotate failed" },
      { status: 500 }
    );
  }
}
