import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  full_name: z.string().min(2, "กรุณาระบุชื่อ-นามสกุล"),
  phone: z.string().min(9, "เบอร์โทรไม่ถูกต้อง"),
  address: z.string().min(10, "กรุณาระบุที่อยู่"),
});

export async function PATCH(req: NextRequest) {
  try {
    // Verify session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { full_name, phone, address } = parsed.data;
    const sql = getSql();

    await sql`
      INSERT INTO customers (id, full_name, phone, address, email)
      VALUES (${user.id}, ${full_name}, ${phone}, ${address}, ${user.email ?? null})
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone     = EXCLUDED.phone,
        address   = EXCLUDED.address
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[profile/update] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
