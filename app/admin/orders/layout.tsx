import { Suspense } from "react";
import {
  AdminOrdersLayoutClient,
  AdminOrdersLayoutFallback,
} from "@/components/admin/orders/AdminOrdersLayoutClient";

export const dynamic = "force-dynamic";

export default function AdminOrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminOrdersLayoutFallback />}>
      <AdminOrdersLayoutClient>{children}</AdminOrdersLayoutClient>
    </Suspense>
  );
}
