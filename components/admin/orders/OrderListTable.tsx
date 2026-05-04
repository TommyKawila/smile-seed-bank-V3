"use client";

import type { ReactNode } from "react";

export function OrderListTable({ children }: { children: ReactNode }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white lg:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-3">เลขออเดอร์</th>
            <th className="px-4 py-3">ลูกค้า</th>
            <th className="px-4 py-3">รายการ</th>
            <th className="px-4 py-3">ยอด</th>
            <th className="px-4 py-3">ช่องทาง</th>
            <th className="px-4 py-3">สถานะ</th>
            <th className="px-4 py-3">สลิป</th>
            <th className="px-4 py-3">จัดการ</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
