import { NextResponse } from "next/server";
import { withEditorialAuth } from "@/lib/editorial-auth";
import { parseEditorialJobId } from "@/lib/editorial-schema";
import { publishEditorialJob } from "@/lib/editorial-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withEditorialAuth(request, async () => {
    const { id } = await params;
    const result = await publishEditorialJob(parseEditorialJobId(id));
    return NextResponse.json(result);
  });
}
