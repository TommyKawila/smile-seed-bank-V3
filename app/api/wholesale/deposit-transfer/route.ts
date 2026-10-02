import { NextResponse } from "next/server";
import { gfAcceptsPublicDeposits } from "@/lib/green-future-approved-marketing";
import { submitDepositTransfer } from "@/services/wholesale-deposit-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!gfAcceptsPublicDeposits()) {
    return NextResponse.json(
      { error: "Customer deposits are not open" },
      { status: 403 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const reservationNumber = String(form.get("reservationNumber") ?? "").trim();
  const payerName = String(form.get("payerName") ?? "").trim();
  const amountRaw = String(form.get("transferAmountThb") ?? "").trim();
  const transferredAtRaw = String(form.get("transferredAt") ?? "").trim();
  const file = form.get("slip");

  if (!reservationNumber || !payerName) {
    return NextResponse.json(
      { error: "Reservation number and payer name are required" },
      { status: 400 }
    );
  }
  const transferAmountThb = Number(amountRaw);
  if (!Number.isFinite(transferAmountThb) || transferAmountThb <= 0) {
    return NextResponse.json({ error: "Invalid transfer amount" }, { status: 400 });
  }
  const transferredAt = transferredAtRaw ? new Date(transferredAtRaw) : new Date();
  if (Number.isNaN(transferredAt.getTime())) {
    return NextResponse.json({ error: "Invalid transfer datetime" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "Slip file is required" }, { status: 400 });
  }

  try {
    const result = await submitDepositTransfer({
      reservationNumber,
      transferAmountThb,
      transferredAt,
      payerName,
      file,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[api/wholesale/deposit-transfer]", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to submit transfer",
      },
      { status: 400 }
    );
  }
}
