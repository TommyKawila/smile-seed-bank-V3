import { assertAdmin } from "@/lib/auth-utils";
import { BulkSeedsAdminClientLazy } from "@/components/admin/bulk-seeds/BulkSeedsAdminClientLazy";

export const dynamic = "force-dynamic";

export default async function AdminBulkSeedsPage() {
  await assertAdmin();
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 lg:px-6 dark:bg-zinc-950 dark:text-zinc-100">
      <BulkSeedsAdminClientLazy />
    </main>
  );
}
