import type { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * LINE Login → Supabase bridge.
 *
 * Source of truth is the Supabase `auth.users` row; we always return its id
 * (so the later magic-link step can actually sign the user in). We then
 * upsert/link the `customers` row to that auth id so the storefront — which
 * joins on `customers.id = auth user id` — sees them as a full member.
 */

const SYNTHETIC_EMAIL_DOMAIN = "line.smileseedbank.local";

function syntheticEmailFor(lineUserId: string): string {
  return `line_${lineUserId}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

type Admin = ReturnType<typeof createServiceRoleClient>;

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

async function syncLineUserToSupabase(params: {
  lineUserId: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}): Promise<{ supabaseUserId: string; email: string } | null> {
  const { lineUserId, name, email, picture } = params;
  const admin = createServiceRoleClient();
  const resolvedEmail = (email ?? syntheticEmailFor(lineUserId)).toLowerCase();

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
        console.error("[line-auth] admin.createUser failed", createErr);
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
      await admin
        .from("customers")
        .update({ line_user_id: null })
        .eq("id", oldByLine.id);
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
      console.error("[line-auth] customers upsert failed", upsertErr);
    }

    return { supabaseUserId, email: resolvedEmail };
  } catch (err) {
    console.error("[line-auth] syncLineUserToSupabase threw", err);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_LOGIN_CHANNEL_ID!,
      clientSecret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
      authorization: { params: { bot_prompt: "normal" } },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "line") return true;
      const sub =
        account.providerAccountId || (profile as { sub?: string } | null)?.sub;
      if (!sub) {
        console.error("[line-auth] signIn: missing sub");
        return false;
      }
      const synced = await syncLineUserToSupabase({
        lineUserId: sub,
        name: (profile as { name?: string } | null)?.name ?? null,
        email: (profile as { email?: string } | null)?.email ?? null,
        picture: (profile as { picture?: string } | null)?.picture ?? null,
      });
      if (!synced) {
        console.error("[line-auth] signIn: sync returned null, blocking login");
        return false;
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "line") {
        const sub =
          account.providerAccountId || (profile as { sub?: string } | null)?.sub;
        if (sub) {
          token.lineUserId = sub;
          const synced = await syncLineUserToSupabase({
            lineUserId: sub,
            name: (profile as { name?: string } | null)?.name ?? null,
            email: (profile as { email?: string } | null)?.email ?? null,
            picture: (profile as { picture?: string } | null)?.picture ?? null,
          });
          if (synced) {
            token.supabaseUserId = synced.supabaseUserId;
            token.supabaseEmail = synced.email;
            console.log(
              "[line-auth] jwt: stamped supabaseUserId",
              synced.supabaseUserId,
              "email",
              synced.email
            );
          } else {
            console.error("[line-auth] jwt: sync returned null");
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as {
          lineUserId?: string;
          supabaseUserId?: string;
          supabaseEmail?: string;
          customerId?: string;
        };
        u.lineUserId = (token as { lineUserId?: string }).lineUserId;
        u.supabaseUserId = (token as { supabaseUserId?: string }).supabaseUserId;
        u.supabaseEmail = (token as { supabaseEmail?: string }).supabaseEmail;
        u.customerId = (token as { supabaseUserId?: string }).supabaseUserId;
      }
      return session;
    },
  },
};
