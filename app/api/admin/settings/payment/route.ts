import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { PaymentSettingsSchema } from "@/lib/validations/payment-settings";

export async function GET() {
  const supabase = await createAdminClient();
  const { data, error } = await (supabase as any)
    .from("payment_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = data ?? null;
  const payload = {
    bankAccounts: (row?.bank_accounts as unknown[]) ?? [],
    promptPay: row?.prompt_pay ?? null,
    cryptoWallets: (row?.crypto_wallets as unknown[]) ?? [],
    lineId: row?.line_id ?? "",
    messengerUrl: row?.messenger_url ?? "",
  };
  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = PaymentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { bankAccounts, promptPay, cryptoWallets, lineId, messengerUrl } = parsed.data;

  const supabase = await createAdminClient();
  const row = {
    id: 1,
    bank_accounts: bankAccounts,
    prompt_pay: promptPay ?? {},
    crypto_wallets: cryptoWallets,
    line_id: lineId ?? "",
    messenger_url: messengerUrl ?? "",
    updated_at: new Date().toISOString(),
  };

  const { error } = await (supabase as any)
    .from("payment_settings")
    .upsert(row, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
