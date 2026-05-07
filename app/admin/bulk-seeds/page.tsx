import nextDynamic from "next/dynamic";
import { assertAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const BulkSeedsAdminClient = nextDynamic(
  () =>
    import("@/components/admin/bulk-seeds/BulkSeedsAdminClient").then((m) => ({
      default: m.BulkSeedsAdminClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
        Loading bulk seeds…
      </div>
    ),
  }
);

export default async function AdminBulkSeedsPage() {
  await assertAdmin();
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 lg:px-6 dark:bg-zinc-950 dark:text-zinc-100">
      <BulkSeedsAdminClient />
    </main>
  );
}
