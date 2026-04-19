import { prisma } from "@/lib/prisma";

/** Upsert subscriber email (lowercased). Sends welcome email only for new rows or reactivation from non-active. */
export async function upsertNewsletterEmail(
  email: string
): Promise<{ shouldSendWelcome: boolean }> {
  const normalized = email.toLowerCase().trim();
  const existing = await prisma.newsletter_subscribers.findUnique({
    where: { email: normalized },
    select: { status: true },
  });
  const shouldSendWelcome = !existing || existing.status !== "active";
  await prisma.newsletter_subscribers.upsert({
    where: { email: normalized },
    create: { email: normalized, status: "active" },
    update: { status: "active" },
  });
  return { shouldSendWelcome };
}
