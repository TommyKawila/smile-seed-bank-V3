"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMagazinePost } from "@/app/admin/magazine/actions";
import { useToast } from "@/hooks/use-toast";

type Props = { postId: string; onDeleted?: () => void };

export function DeleteMagazinePostButton({ postId, onDeleted }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this article? This cannot be undone.")) return;
        startTransition(async () => {
          const r = await deleteMagazinePost(Number(postId));
          if (!r.ok) {
            toast({ title: "Delete failed", variant: "destructive" });
            return;
          }
          onDeleted?.();
          router.refresh();
        });
      }}
      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400/90 transition hover:bg-red-950/50 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
