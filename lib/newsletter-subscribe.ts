import { prisma } from "@/lib/prisma";

/** Upsert subscriber email (lowercased). */
export async function upsertNewsletterEmail(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  await prisma.newsletter_subscribers.upsert({
    where: { email: normalized },
    create: { email: normalized, status: "active" },
    update: { status: "active" },
  });
}
