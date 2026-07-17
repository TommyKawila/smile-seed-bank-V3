import type { NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import { syncLineUserToSupabase } from "@/services/line-auth-service";

/** Align Vercel env names with LINE Developers / docs (some dashboards use LINE_CLIENT_*). */
const lineClientId =
  process.env.LINE_LOGIN_CHANNEL_ID ?? process.env.LINE_CLIENT_ID ?? "";
const lineClientSecret =
  process.env.LINE_LOGIN_CHANNEL_SECRET ?? process.env.LINE_CLIENT_SECRET ?? "";

/** trustHost: forwarded by Auth.js-based builds; safe to keep for future upgrades. Host trust on v4 also uses VERCEL / AUTH_TRUST_HOST (see next-auth/utils/detect-origin.js). */
export const authOptions: NextAuthOptions & { trustHost?: boolean } = {
  trustHost: true,
  providers: [
    LineProvider({
      clientId: lineClientId,
      clientSecret: lineClientSecret,
      authorization: { params: { bot_prompt: "normal" } },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
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
