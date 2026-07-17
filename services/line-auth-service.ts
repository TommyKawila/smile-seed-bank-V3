import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/server";

const SYNTHETIC_EMAIL_DOMAIN = "line.smileseedbank.local";

type Admin = ReturnType<typeof createServiceRoleClient>;

export function syntheticEmailForLineUser(lineUserId: string): string {
  return `line_${lineUserId}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

async function findAuthUserByEmail(admin: Admin, email: string) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (!data?.users?.length || data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

export async function syncLineUserToSupabase(params: {
  lineUserId: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}): Promise<{ supabaseUserId: string; email: string } | null> {
  const { lineUserId, name, email, picture } = params;
  const admin = createServiceRoleClient();
  const resolvedEmail = (email ?? syntheticEmailForLineUser(lineUserId)).toLowerCase();

  try {
    let authUser = await findAuthUserByEmail(admin, resolvedEmail);

    if (!authUser) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: resolvedEmail,
        email_confirm: true,
        user_metadata: {
          full_name: name ?? undefined,
          avatar_url: picture ?? undefined,
          provider: "line",
          line_user_id: lineUserId,
        },
      });
      if (createErr || !created?.user) {
        console.error("[line-auth] admin.createUser failed");
        return null;
      }
      authUser = created.user;
    }

    const supabaseUserId = authUser.id;

    const { data: oldByLine } = await admin
      .from("customers")
      .select("id")
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    if (oldByLine?.id && oldByLine.id !== supabaseUserId) {
      await admin.from("customers").update({ line_user_id: null }).eq("id", oldByLine.id);
    }

    const { error: upsertErr } = await admin.from("customers").upsert(
      {
        id: supabaseUserId,
        email: resolvedEmail,
        full_name: name ?? null,
        line_user_id: lineUserId,
        is_linked: true,
        role: "USER",
      },
      { onConflict: "id" }
    );
    if (upsertErr) {
      console.error("[line-auth] customers upsert failed");
    }

    return { supabaseUserId, email: resolvedEmail };
  } catch {
    console.error("[line-auth] syncLineUserToSupabase threw");
    return null;
  }
}
