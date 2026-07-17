"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ToolError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">โหลดเครื่องมือไม่สำเร็จ</p>
      <div className="mt-4 flex justify-center gap-2">
        <Button type="button" variant="outline" onClick={reset}>
          ลองใหม่
        </Button>
        <Button asChild>
          <Link href="/">กลับหน้าแรก</Link>
        </Button>
      </div>
    </div>
  );
}
