import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HeroBackgroundSettings } from "@/components/admin/HeroBackgroundSettings";

export default function AdminHeroSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div>
        <Link
          href="/admin/settings"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Brand Settings
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Hero Background</h1>
        <p className="mt-1 text-sm text-zinc-500">
          โหมดพื้นหลัง Hero บนหน้าแรก — บันทึกโหมดทันทีเมื่อสลับแท็บ; บันทึก SVG
          ด้วยปุ่มด้านล่าง
        </p>
      </div>
      <HeroBackgroundSettings />
    </div>
  );
}
