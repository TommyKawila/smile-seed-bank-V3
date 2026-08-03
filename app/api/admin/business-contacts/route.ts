import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth-utils";
import { listBusinessContacts } from "@/services/business-document-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await assertAdmin();
    const contacts = await listBusinessContacts();
    return NextResponse.json({ contacts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
