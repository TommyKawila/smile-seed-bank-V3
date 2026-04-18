import { prisma } from "@/lib/prisma";

const GUEST_IA_KEY = (lineUserId: string) => `line_ia_guest:${lineUserId.trim()}`;

const MS_24H = 24 * 60 * 60 * 1000;

function parseStoredTimestamp(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Suppress “Order #…” OA hint: already linked to an order, or cooldown from last bot/human touch. */
export async function shouldSuppressLineOrderLinkPrompt(lineUserId: string): Promise<boolean> {
  const uid = lineUserId.trim();
  if (!uid) return true;

  const [customer, orderWithLine] = await Promise.all([
    prisma.customers.findFirst({
      where: { line_user_id: uid },
      select: { is_linked: true, last_interaction_at: true },
    }),
    prisma.orders.findFirst({
      where: { line_user_id: uid },
      select: { id: true },
    }),
  ]);

  if (customer?.is_linked || orderWithLine) return true;

  let lastAt: Date | null = customer?.last_interaction_at ?? null;
  if (!lastAt) {
    const row = await prisma.site_settings.findUnique({
      where: { key: GUEST_IA_KEY(uid) },
      select: { value: true },
    });
    lastAt = parseStoredTimestamp(row?.value ?? null);
  }

  if (!lastAt) return false;
  return Date.now() - lastAt.getTime() < MS_24H;
}

export async function recordLineUserInteraction(lineUserId: string): Promise<void> {
  const uid = lineUserId.trim();
  if (!uid) return;
  const now = new Date();
  const n = await prisma.customers.updateMany({
    where: { line_user_id: uid },
    data: { last_interaction_at: now },
  });
  if (n.count === 0) {
    await prisma.site_settings.upsert({
      where: { key: GUEST_IA_KEY(uid) },
      create: { key: GUEST_IA_KEY(uid), value: now.toISOString() },
      update: { value: now.toISOString() },
    });
  }
}
