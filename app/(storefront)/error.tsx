"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function StorefrontError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-12">
      <Alert className="border-primary/20 bg-white shadow-sm">
        <AlertTitle>โหลดหน้านี้ไม่สำเร็จ / Page could not load</AlertTitle>
        <AlertDescription>
          ข้อมูลหลักของร้านยังปลอดภัย กรุณาลองโหลดส่วนนี้ใหม่อีกครั้ง
        </AlertDescription>
        <Button className="mt-4" onClick={reset}>
          ลองใหม่ / Try again
        </Button>
      </Alert>
    </div>
  );
}
