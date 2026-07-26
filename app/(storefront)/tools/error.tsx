"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ToolsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">โหลดเครื่องมือไม่สำเร็จ</h1>
      <p className="mt-2 text-sm text-muted-foreground">ลองใหม่อีกครั้ง</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" className="min-h-12" onClick={() => reset()}>
          ลองใหม่
        </Button>
        <Button asChild variant="outline" className="min-h-12">
          <Link href="/tools">กลับ AI ช่วยปลูก</Link>
        </Button>
      </div>
    </div>
  );
}
