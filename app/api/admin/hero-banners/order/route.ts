import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { updateHeroBannerOrder } from "@/services/hero-banner-service";

const OrderSchema = z.object({
  heroBannerIds: z.array(z.string().regex(/^\d+$/)).min(1),
});

export async function PATCH(req: Request) {
  await assertAdmin();
  const { heroBannerIds } = OrderSchema.parse(await req.json());
  await updateHeroBannerOrder(heroBannerIds.map((id) => BigInt(id)));
  revalidatePath("/");
  revalidateTag("home-hero-banners");
  return NextResponse.json({ ok: true });
}
