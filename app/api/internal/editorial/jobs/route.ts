import { NextResponse } from "next/server";
import { withEditorialAuth } from "@/lib/editorial-auth";
import { editorialCreateJobSchema, parseEditorialBody } from "@/lib/editorial-schema";
import { createEditorialJob } from "@/lib/editorial-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withEditorialAuth(request, async () => {
    const body = await request.json().catch(() => null);
    const input = parseEditorialBody(editorialCreateJobSchema, body);
    const job = await createEditorialJob(input);
    return NextResponse.json({ ok: true, ...job });
  });
}
