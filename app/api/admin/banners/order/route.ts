import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { updateBannerOrder } from "@/services/banner-service";

const OrderSchema = z.object({
  bannerIds: z.array(z.string().regex(/^\d+$/)).min(1),
});

export async function PATCH(req: Request) {
  await assertAdmin();
  const { bannerIds } = OrderSchema.parse(await req.json());
  await updateBannerOrder(bannerIds.map((id) => BigInt(id)));
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
