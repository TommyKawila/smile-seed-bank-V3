"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Alert className="max-w-lg border-destructive/25 bg-card shadow-sm">
        <AlertTitle>เกิดข้อผิดพลาด / Something went wrong</AlertTitle>
        <AlertDescription>
          ระบบยังทำงานอยู่ ลองรีเฟรชส่วนนี้อีกครั้ง หากยังพบปัญหาโปรดติดต่อทีมงาน
        </AlertDescription>
        <Button className="mt-4" onClick={reset}>
          ลองใหม่ / Try again
        </Button>
      </Alert>
    </main>
  );
}
