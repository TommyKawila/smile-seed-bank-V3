import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/next-auth-options";

/**
 * next-auth uses `detect-origin`: when `VERCEL` or `AUTH_TRUST_HOST` is set, the
 * request Host header drives the origin (fixes apex vs www vs preview URLs).
 * If `NEXTAUTH_URL` is unset, derive it from `VERCEL_URL` (HTTPS).
 */
function bootstrapNextAuthEnv(): void {
  if (process.env.VERCEL) {
    process.env.AUTH_TRUST_HOST ??= "true";
  }
  if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, "");
    process.env.NEXTAUTH_URL = `https://${host}`;
  }
}

bootstrapNextAuthEnv();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
