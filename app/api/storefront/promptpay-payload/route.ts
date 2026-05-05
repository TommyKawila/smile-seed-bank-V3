import { NextResponse, type NextRequest } from "next/server";
import { getSql } from "@/lib/db";
import { buildPromptPayPayload } from "@/lib/payment-utils";

export const revalidate = 0;

type PromptPayJson = { identifier?: string; isActive?: boolean; is_active?: boolean };

function explicitInactive(pp: PromptPayJson | null): boolean {
  return pp != null && (pp.isActive === false || pp.is_active === false);
}

async function getPromptPayMerchantIdFromSettings(): Promise<string | null> {
  try {
    const rows = await getSql()`
      SELECT prompt_pay
      FROM payment_settings
      WHERE id = 1
      LIMIT 1
    `;
    const raw = rows[0]?.prompt_pay as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const pp = raw as PromptPayJson;
    if (explicitInactive(pp)) return null;
    const id = pp.identifier?.trim();
    return id && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

/**
 * Returns EMV payload string for client-side QR rendering. Does not expose merchant ID in JSON.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("amount");
  const amount = raw == null ? NaN : Number(raw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 50_000_000) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }

  const fromDb = await getPromptPayMerchantIdFromSettings();
  const merchantId =
    fromDb ??
    process.env.PROMPTPAY_MERCHANT_ID?.trim() ??
    "";

  if (!merchantId) {
    return NextResponse.json({ payload: null }, { status: 200 });
  }

  const payload = buildPromptPayPayload(merchantId, amount);
  if (!payload) {
    return NextResponse.json({ payload: null }, { status: 200 });
  }

  return NextResponse.json({ payload }, { status: 200 });
}
