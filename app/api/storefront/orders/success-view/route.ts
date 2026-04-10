import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrderForSuccessView } from "@/lib/services/order-service";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("order")?.trim();
  if (!orderNumber || orderNumber.length < 4 || orderNumber.length > 20) {
    return NextResponse.json({ error: "Invalid order number" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await getOrderForSuccessView(orderNumber, user?.id ?? null);

  if (error === "not_found") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (error === "login_required") {
    return NextResponse.json(
      { error: "Login required", code: "LOGIN_REQUIRED" },
      { status: 401 }
    );
  }
  if (error === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (error === "server" || !data) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  return NextResponse.json(data);
}
