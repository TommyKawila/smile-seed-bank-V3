import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { PaymentSettingsSchema } from "@/lib/validations/payment-settings";

export async function GET() {
  const sql = getSql();
  try {
    const rows = await sql`
      SELECT bank_accounts, prompt_pay, crypto_wallets, line_id, messenger_url
      FROM payment_settings
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0] ?? null;
    return NextResponse.json({
      bankAccounts: (row?.bank_accounts as unknown[]) ?? [],
      promptPay: row?.prompt_pay ?? null,
      cryptoWallets: (row?.crypto_wallets as unknown[]) ?? [],
      lineId: row?.line_id ?? "",
      messengerUrl: row?.messenger_url ?? "",
    });
  } catch (err) {
    console.error("[payment GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = PaymentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { bankAccounts, promptPay, cryptoWallets, lineId, messengerUrl } = parsed.data;

  const cryptoNormalized = cryptoWallets.map((w) => ({
    network: w.network.trim(),
    address: w.address.trim(),
    qrUrl: (w.qrUrl ?? "").trim(),
    isActive: w.isActive,
  }));

  if (process.env.NODE_ENV !== "production") {
    console.log("[payment POST] crypto isActive (normalized):", cryptoNormalized.map((x) => x.isActive));
  }

  const sql = getSql();

  try {
    await sql`
      INSERT INTO payment_settings (id, bank_accounts, prompt_pay, crypto_wallets, line_id, messenger_url, updated_at)
      VALUES (
        1,
        ${sql.json(bankAccounts)},
        ${sql.json(promptPay ?? {})},
        ${sql.json(cryptoNormalized)},
        ${lineId ?? ""},
        ${messengerUrl ?? ""},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        bank_accounts  = EXCLUDED.bank_accounts,
        prompt_pay     = EXCLUDED.prompt_pay,
        crypto_wallets = EXCLUDED.crypto_wallets,
        line_id        = EXCLUDED.line_id,
        messenger_url  = EXCLUDED.messenger_url,
        updated_at     = NOW()
    `;

    const [row] = await sql`
      SELECT bank_accounts, prompt_pay, crypto_wallets, line_id, messenger_url
      FROM payment_settings
      WHERE id = 1
      LIMIT 1
    `;
    return NextResponse.json({
      ok: true,
      bankAccounts: (row?.bank_accounts as unknown[]) ?? [],
      promptPay: row?.prompt_pay ?? null,
      cryptoWallets: (row?.crypto_wallets as unknown[]) ?? [],
      lineId: row?.line_id ?? "",
      messengerUrl: row?.messenger_url ?? "",
    });
  } catch (err) {
    console.error("[payment POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
