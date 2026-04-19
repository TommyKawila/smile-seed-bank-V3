import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { rateLimitIp } from "@/lib/rate-limit-ip";
import { upsertNewsletterEmail } from "@/lib/newsletter-subscribe";
import { sendNewsletterWelcomeEmail } from "@/services/email-service";

const BodySchema = z.object({
  email: z.string().trim().email().max(320),
  locale: z.enum(["th", "en"]).optional(),
});

function clientIp(): string {
  const h = headers();
  const xf = h.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  return h.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const ip = clientIp();
  const limited = rateLimitIp(`newsletter:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const locale = parsed.data.locale === "en" ? "en" : "th";

  try {
    const { shouldSendWelcome } = await upsertNewsletterEmail(email);
    let welcomeEmailSent = false;
    if (shouldSendWelcome) {
      const sent = await sendNewsletterWelcomeEmail({ toEmail: email, locale });
      welcomeEmailSent = sent.success;
      if (!sent.success) {
        console.error("[newsletter welcome email]", sent.error);
      }
    }

    return NextResponse.json({
      ok: true,
      welcomeEmailSent,
      alreadyActive: !shouldSendWelcome,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save" }, { status: 500 });
  }
}
