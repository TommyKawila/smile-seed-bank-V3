import { NextResponse } from "next/server";
import { withEditorialAuth } from "@/lib/editorial-auth";
import {
  editorialPatchJobSchema,
  parseEditorialBody,
  parseEditorialJobId,
} from "@/lib/editorial-schema";
import { getEditorialJob, updateEditorialJob } from "@/lib/editorial-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withEditorialAuth(request, async () => {
    const { id } = await params;
    const job = await getEditorialJob(parseEditorialJobId(id));
    return NextResponse.json({ ok: true, ...job });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withEditorialAuth(request, async () => {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const input = parseEditorialBody(editorialPatchJobSchema, body);
    const job = await updateEditorialJob(parseEditorialJobId(id), input);
    return NextResponse.json({ ok: true, ...job });
  });
}
