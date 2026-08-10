import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateNewSeedsStorefront } from "@/lib/revalidate-new-seeds";
import {
  addProductToNewSeeds,
  addProductsToNewSeeds,
  listAdminNewSeedsProducts,
  listNewSeedsBreederSummary,
  removeProductsFromNewSeeds,
  reorderNewSeedsProducts,
  setNewSeedsPriority,
} from "@/services/new-seeds-admin-service";

export const dynamic = "force-dynamic";

const BodySchema = z.union([
  z.object({
    action: z.literal("remove"),
    productIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
  }),
  z.object({
    action: z.literal("reorder"),
    productIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
  }),
  z.object({
    action: z.literal("priority"),
    productId: z.coerce.number().int().positive(),
    priority: z.coerce.number().int().min(0).max(9999),
  }),
  z.object({ productId: z.coerce.number().int().positive() }),
  z.object({
    productIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
  }),
]);

export async function GET() {
  try {
    const [products, breederSummary] = await Promise.all([
      listAdminNewSeedsProducts(),
      listNewSeedsBreederSummary(),
    ]);
    return NextResponse.json({ products, breederSummary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if ("action" in data && data.action === "remove") {
      const { error, removed } = await removeProductsFromNewSeeds(data.productIds);
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateNewSeedsStorefront();
      return NextResponse.json({ ok: true, removed });
    }

    if ("action" in data && data.action === "reorder") {
      const { error } = await reorderNewSeedsProducts(data.productIds);
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateNewSeedsStorefront();
      return NextResponse.json({ ok: true });
    }

    if ("action" in data && data.action === "priority") {
      const { error } = await setNewSeedsPriority(data.productId, data.priority);
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateNewSeedsStorefront();
      return NextResponse.json({ ok: true });
    }

    if ("productIds" in data) {
      const { error, added } = await addProductsToNewSeeds(data.productIds);
      if (error) return NextResponse.json({ error }, { status: 500 });
      revalidateNewSeedsStorefront();
      return NextResponse.json({ ok: true, added });
    }

    const { error } = await addProductToNewSeeds(data.productId);
    if (error) return NextResponse.json({ error }, { status: 500 });
    revalidateNewSeedsStorefront();
    return NextResponse.json({ ok: true, productId: data.productId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
