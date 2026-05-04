import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import type { Breeder } from "@/types/supabase";

export const dynamic = "force-dynamic";

const BreederSchema = z.object({
  name: z.string().min(2, "ชื่อ Breeder ต้องมีอย่างน้อย 2 ตัวอักษร"),
  logo_url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  summary_th: z.string().max(300).nullable().optional(),
  summary_en: z.string().max(300).nullable().optional(),
  highlight_origin_th: z.string().max(120).nullable().optional(),
  highlight_origin_en: z.string().max(120).nullable().optional(),
  highlight_specialty_th: z.string().max(120).nullable().optional(),
  highlight_specialty_en: z.string().max(120).nullable().optional(),
  highlight_reputation_th: z.string().max(120).nullable().optional(),
  highlight_reputation_en: z.string().max(120).nullable().optional(),
  highlight_focus_th: z.string().max(120).nullable().optional(),
  highlight_focus_en: z.string().max(120).nullable().optional(),
  is_active: z.boolean().default(true),
});
const BreederPatchSchema = BreederSchema.partial().extend({
  id: z.coerce.number().int().positive(),
});

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("breeders")
      .select("*")
      .order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data as Breeder[]);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BreederSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("breeders")
      .insert({
        name: parsed.data.name,
        logo_url: parsed.data.logo_url ?? null,
        description: parsed.data.description ?? null,
        description_en: parsed.data.description_en ?? null,
        summary_th: parsed.data.summary_th ?? null,
        summary_en: parsed.data.summary_en ?? null,
        highlight_origin_th: parsed.data.highlight_origin_th ?? null,
        highlight_origin_en: parsed.data.highlight_origin_en ?? null,
        highlight_specialty_th: parsed.data.highlight_specialty_th ?? null,
        highlight_specialty_en: parsed.data.highlight_specialty_en ?? null,
        highlight_reputation_th: parsed.data.highlight_reputation_th ?? null,
        highlight_reputation_en: parsed.data.highlight_reputation_en ?? null,
        highlight_focus_th: parsed.data.highlight_focus_th ?? null,
        highlight_focus_en: parsed.data.highlight_focus_en ?? null,
        is_active: parsed.data.is_active,
      })
      .select()
      .single();

    if (error) {
      console.error("[/api/admin/breeders] DB Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BreederPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    const { id, ...rest } = parsed.data;

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("breeders")
      .update(rest)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
