"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function LineLiffEntryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[line/entry]", error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-12">
      <Alert className="border-primary/20 bg-white shadow-sm">
        <AlertTitle>โหลดไม่สำเร็จ</AlertTitle>
        <AlertDescription>กรุณาลองใหม่ หรือเปิดร้านจากแชท LINE อีกครั้ง</AlertDescription>
        <Button className="mt-4" type="button" onClick={reset}>
          ลองใหม่
        </Button>
      </Alert>
    </div>
  );
}
