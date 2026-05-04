"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function InventoryGridTable({
  title = "Inventory Grid",
  actions,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium text-zinc-700">{title}</span>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}
