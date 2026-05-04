"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Alert className="max-w-xl border-destructive/25 bg-card shadow-sm">
        <AlertTitle>Admin section error</AlertTitle>
        <AlertDescription>
          ไม่สามารถโหลดข้อมูลส่วนนี้ได้ กรุณาลองใหม่โดยไม่กระทบหน้าส่วนอื่นของระบบ
        </AlertDescription>
        <Button className="mt-4" onClick={reset}>
          Retry
        </Button>
      </Alert>
    </div>
  );
}
