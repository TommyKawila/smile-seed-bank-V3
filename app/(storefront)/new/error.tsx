"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function NewSeedsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-12">
      <Alert className="border-violet-500/20 bg-card text-card-foreground shadow-sm">
        <AlertTitle>โหลด New Seeds ไม่สำเร็จ / New Seeds could not load</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          กรุณาลองใหม่อีกครั้ง / Please try again.
        </AlertDescription>
        <Button className="mt-4" onClick={reset}>
          ลองใหม่ / Try again
        </Button>
      </Alert>
    </div>
  );
}
