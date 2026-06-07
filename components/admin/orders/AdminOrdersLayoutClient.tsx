"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, RefreshCw, FileText, Plus, List, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderFilters } from "@/components/admin/orders/OrderFilters";
import {
  ORDER_LIST_TABS,
  adminOrdersListHref,
  parseOrderListTab,
  type OrderListTabId,
} from "@/lib/admin-order-list-tabs";
import type { OrderListTabCounts } from "@/services/orders-service";

export function AdminOrdersLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreate = pathname === "/admin/orders/create";
  const listTab = parseOrderListTab(searchParams.get("tab"));
  const listHref = adminOrdersListHref(listTab);

  const [tabCounts, setTabCounts] = useState<OrderListTabCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);

  const fetchTabCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const res = await fetch("/api/admin/orders?includeTabCounts=1");
      const data = await res.json();
      if (res.ok && data.tabCounts) {
        setTabCounts(data.tabCounts as OrderListTabCounts);
      }
    } catch {
      setTabCounts(null);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTabCounts();
  }, [fetchTabCounts]);

  const onTabChange = (tab: OrderListTabId) => {
    router.push(adminOrdersListHref(tab));
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-zinc-900">ออเดอร์</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/quotations/new"
            className="flex items-center gap-1.5 rounded-lg border border-primary/25 bg-accent px-3 py-1.5 text-sm font-medium text-primary hover:bg-accent"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Convert Quote to Order</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              void fetchTabCounts();
              window.dispatchEvent(new Event("admin-orders-refetch"));
            }}
            disabled={countsLoading}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
          >
            <RefreshCw className={cn("h-4 w-4", countsLoading && "animate-spin")} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>
      </div>

      <OrderFilters
        tabs={ORDER_LIST_TABS}
        activeTab={listTab}
        counts={tabCounts ?? undefined}
        onTabChange={onTabChange}
      />

      <div className="flex gap-2 border-b border-zinc-200 pb-3">
        <Link
          href={listHref}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            !isCreate
              ? "bg-primary text-white shadow-sm"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          <List className="h-4 w-4" />
          รายการออเดอร์
        </Link>
        <Link
          href="/admin/orders/create"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isCreate
              ? "bg-primary text-white shadow-sm"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          <Plus className="h-4 w-4" />
          สร้างออเดอร์
        </Link>
      </div>

      {children}
    </div>
  );
}

export function AdminOrdersLayoutFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
