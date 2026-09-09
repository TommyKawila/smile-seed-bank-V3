import { GfStorageLogClient } from "@/components/admin/partners/GfStorageLogClient";

export const metadata = {
  title: "Storage log · Green Future · Admin",
  description: "Daily seed cabinet temp/RH log with GF share link",
};

export default function GfStorageLogPage() {
  return (
    <div className="space-y-2">
      <p className="max-w-2xl text-sm text-slate-500">
        บันทึกรายวัน +5°C · RH ≤50% · รูป Hygrometer — แชร์ลิงก์ให้ Green Future ตรวจได้ตลอด
      </p>
      <GfStorageLogClient />
    </div>
  );
}
