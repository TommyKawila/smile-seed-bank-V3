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

let debugEnvLogged = false;
function logDebugEnvOnce(): void {
  if (debugEnvLogged) return;
  debugEnvLogged = true;
  console.log("DEBUG_ENV:", {
    url: process.env.NEXTAUTH_URL,
    hasSecret: !!(process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET),
    channelId:
      process.env.LINE_LOGIN_CHANNEL_ID ?? process.env.LINE_CLIENT_ID ?? null,
    hasLineSecret: !!(
      process.env.LINE_LOGIN_CHANNEL_SECRET ?? process.env.LINE_CLIENT_SECRET
    ),
    vercel: !!process.env.VERCEL,
    authTrustHost: process.env.AUTH_TRUST_HOST ?? null,
  });
}

const handler = NextAuth(authOptions);

export async function GET(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  logDebugEnvOnce();
  return handler(req, context);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  logDebugEnvOnce();
  return handler(req, context);
}
