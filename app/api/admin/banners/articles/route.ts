import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import {
  createArticleBanner,
  getAdminArticleBanners,
} from "@/services/article-banner-service";

const CreateArticleBannerSchema = z.object({
  desktopImageUrl: z.string().trim().optional().nullable(),
  mobileImageUrl: z.string().trim().optional().nullable(),
  titleAlt: z.string().trim().min(1, "Title / alt is required"),
  destinationUrl: z.string().trim().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    await assertAdmin();
    const banners = await getAdminArticleBanners();
    return NextResponse.json({ banners: Array.isArray(banners) ? banners : [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load article banners";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await assertAdmin();
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = CreateArticleBannerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors.join("; ") || "Invalid payload" },
        { status: 400 }
      );
    }
    const banner = await createArticleBanner({
      ...parsed.data,
      destinationUrl: parsed.data.destinationUrl?.trim() || "/",
    });
    revalidatePath("/blog");
    return NextResponse.json({ banner });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create article banner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
