"use client";

import dynamic from "next/dynamic";

export const BulkSeedsAdminClientLazy = dynamic(
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
