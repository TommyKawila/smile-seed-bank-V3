import { NextResponse } from "next/server";
import { withEditorialAuth } from "@/lib/editorial-auth";
import {
  editorialAssetsCompleteSchema,
  parseEditorialBody,
  parseEditorialJobId,
} from "@/lib/editorial-schema";
import { markReadyToPublish } from "@/lib/editorial-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withEditorialAuth(request, async () => {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const input = parseEditorialBody(editorialAssetsCompleteSchema, body);
    const job = await markReadyToPublish(parseEditorialJobId(id), input);
    return NextResponse.json({ ok: true, job });
  });
}
