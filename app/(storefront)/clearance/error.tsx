"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ClearanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-12">
      <Alert className="border-emerald-500/20 bg-zinc-950 text-zinc-100 shadow-sm">
        <AlertTitle>โหลด Clearance ไม่สำเร็จ / Clearance could not load</AlertTitle>
        <AlertDescription className="text-zinc-400">
          กรุณาลองใหม่อีกครั้ง / Please try again.
        </AlertDescription>
        <Button className="mt-4" onClick={reset}>
          ลองใหม่ / Try again
        </Button>
      </Alert>
    </div>
  );
}
