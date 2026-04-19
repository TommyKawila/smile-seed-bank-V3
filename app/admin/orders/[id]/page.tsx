"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Opens the order detail drawer on the main orders list via ?openOrder= */
export default function AdminOrderDeepLinkPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const raw = params?.id;
    const id = raw != null ? String(raw) : "";
    if (!id || id === "undefined") {
      router.replace("/admin/orders");
      return;
    }
    router.replace(`/admin/orders?openOrder=${encodeURIComponent(id)}`);
  }, [params, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      กำลังเปิดออเดอร์…
    </div>
  );
}
