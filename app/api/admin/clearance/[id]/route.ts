import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { revalidateClearanceStorefront } from "@/lib/revalidate-clearance";
import {
  removeProductFromClearance,
  updateClearanceVariantPrices,
} from "@/services/clearance-admin-service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
  const productId = parseInt(params.id, 10);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const { error } = await removeProductFromClearance(productId);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  revalidateClearanceStorefront();
  return NextResponse.json({ ok: true });
}

/** Re-apply fixed 50% clearance prices for one product. */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
  const productId = parseInt(params.id, 10);
  if (!Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const { error } = await updateClearanceVariantPrices(productId, []);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    revalidateClearanceStorefront();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
