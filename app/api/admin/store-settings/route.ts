import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.store_settings.findUnique({
      where: { id: 1 },
    });
    return NextResponse.json({
      storeName: settings?.store_name ?? "Smile Seed Bank",
      contactEmail: settings?.contact_email ?? null,
      supportPhone: settings?.support_phone ?? null,
      address: settings?.address ?? null,
    });
  } catch (err) {
    console.error("[store-settings]", err);
    return NextResponse.json(
      { storeName: "Smile Seed Bank", contactEmail: null, supportPhone: null, address: null },
      { status: 200 }
    );
  }
}
