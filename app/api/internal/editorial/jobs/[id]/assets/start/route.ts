import { NextResponse } from "next/server";
import { withEditorialAuth } from "@/lib/editorial-auth";
import { parseEditorialJobId } from "@/lib/editorial-schema";
import { markGeneratingAssets } from "@/lib/editorial-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withEditorialAuth(request, async () => {
    const { id } = await params;
    const job = await markGeneratingAssets(parseEditorialJobId(id));
    return NextResponse.json({ ok: true, job });
  });
}
