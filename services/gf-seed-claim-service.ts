import "server-only";

import { prisma } from "@/lib/prisma";
import type { GfSeedClaimPayload } from "@/lib/green-future-seed-claim";

export async function saveGfSeedClaimSubmission(
  payload: GfSeedClaimPayload
): Promise<{ id: string }> {
  const row = await prisma.gf_seed_claim_submissions.create({
    data: { payload },
  });
  return { id: row.id };
}
