import { BulkSeedsBookClient } from "@/components/admin/bulk-seeds/BulkSeedsBookClient";

export const metadata = {
  title: "Bulk seeds · Admin",
};

export default function AdminBulkSeedsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Bulk seeds — cost book
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          ต้นทุนผู้ผลิต (Green Future TH · Seeds Genetics NL) เทียบราคาขายต่อ
          ตามหลัก landed cost — หน้านี้สำหรับวางกลยุทธ์เท่านั้น
        </p>
      </header>
      <BulkSeedsBookClient />
    </div>
  );
}
