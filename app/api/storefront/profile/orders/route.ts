import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileOrdersForCustomer } from "@/services/profile-orders-service";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const orders = await getProfileOrdersForCustomer(user.id);
    return NextResponse.json({ orders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[profile/orders] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
