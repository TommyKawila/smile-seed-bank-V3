import { prisma } from "@/lib/prisma";
import { getSiteOrigin } from "@/lib/get-url";
import {
  buildMagazineFieldNotesEmailHtml,
  buildMagazineResearchEmailHtml,
  resolveMagazineEmailImageUrl,
  type MagazineEmailTemplateId,
} from "@/lib/email-magazine-broadcast-html";

const RESEND_URL = "https://api.resend.com/emails";

function fromMagazine(): string {
  return (
    process.env.RESEND_FROM_MAGAZINE?.trim() ||
    "Smile Seed Bank <orders@smileseedbank.com>"
  );
}

function subjectFor(
  template: MagazineEmailTemplateId,
  title: string
): string {
  const t = title.slice(0, 120);
  if (template === "field_notes") {
    return `🌿 Field Notes: ${t} — Smile Seed Bank`;
  }
  return `📘 New guide: ${t} — Smile Seed Bank Magazine`;
}

export async function sendMagazineNewsletterBroadcast(opts: {
  template: MagazineEmailTemplateId;
  title: string;
  excerpt: string | null;
  slug: string;
  featured_image: string | null;
  creatorUrl?: string;
  highlights?: [string, string, string];
}): Promise<{ sent: number; error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: 0, error: "RESEND_API_KEY is not configured" };
  }

  const site = getSiteOrigin();
  const articleUrl = `${site}/blog/${encodeURIComponent(opts.slug)}`;
  const imageUrl = resolveMagazineEmailImageUrl(opts.featured_image);

  const html =
    opts.template === "field_notes" && opts.highlights && opts.creatorUrl
      ? buildMagazineFieldNotesEmailHtml({
          title: opts.title,
          excerpt: opts.excerpt,
          articleUrl,
          imageUrl,
          creatorUrl: opts.creatorUrl,
          highlights: opts.highlights,
        })
      : buildMagazineResearchEmailHtml({
          title: opts.title,
          excerpt: opts.excerpt,
          articleUrl,
          imageUrl,
        });

  const subject = subjectFor(opts.template, opts.title);

  const subscribers = await prisma.newsletter_subscribers.findMany({
    where: { status: "active" },
    select: { email: true },
  });

  if (subscribers.length === 0) {
    return { sent: 0, error: null };
  }

  let sent = 0;
  let lastErr: string | null = null;
  const from = fromMagazine();

  for (const { email } of subscribers) {
    try {
      const res = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        lastErr = `Resend ${res.status}: ${JSON.stringify(body)}`;
        continue;
      }
      sent += 1;
    } catch (e) {
      lastErr = String(e);
    }
  }

  return { sent, error: sent > 0 ? null : lastErr };
}
