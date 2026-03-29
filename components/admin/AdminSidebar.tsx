"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Tag,
  Settings,
  Leaf,
  BookOpen,
  PlusSquare,
  Percent,
  X,
  Boxes,
  FolderTree,
  CreditCard,
  LayoutGrid,
  BarChart2,
  FileText,
  Camera,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { UserNav } from "@/components/admin/user-nav";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "สินค้า", icon: Package },
  { href: "/admin/inventory", label: "สต็อก / Inventory", icon: Boxes },
  { href: "/admin/inventory/dashboard", label: "Inventory Dashboard", icon: BarChart2 },
  { href: "/admin/inventory/manual", label: "Manual Grid", icon: LayoutGrid },
  { href: "/admin/inventory/ai-import", label: "AI Import", icon: Sparkles },
  { href: "/admin/inventory/snapshots", label: "Stock Audit", icon: Camera },
  { href: "/admin/breeders", label: "แบรนด์ / Breeders", icon: Leaf },
  { href: "/admin/categories", label: "หมวดหมู่ / Categories", icon: FolderTree },
  { href: "/admin/orders", label: "ออเดอร์", icon: ShoppingCart },
  { href: "/admin/quotations", label: "ใบเสนอราคา", icon: FileText },
  { href: "/admin/orders/create", label: "สร้างออเดอร์ (POS)", icon: PlusSquare },
  { href: "/admin/reports/daily", label: "รายงานยอดขาย", icon: FileText },
  { href: "/admin/customers", label: "ลูกค้า", icon: Users },
  { href: "/admin/promotions", label: "โปรโมชั่น", icon: Tag },
  { href: "/admin/discounts", label: "ส่วนลด / คูปอง", icon: Percent },
  { href: "/admin/blog", label: "บทความ", icon: BookOpen },
];

const bottomItems = [
  { href: "/admin/settings", label: "ตั้งค่าร้านค้า", icon: Settings },
  { href: "/admin/settings/payment", label: "ช่องทางชำระเงิน", icon: CreditCard },
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/inventory/low-stock?count=true", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLowStockCount(d?.count ?? 0))
      .catch(() => {});
  }, []);

  return (
    <aside className="flex h-full w-64 flex-col bg-zinc-900 text-zinc-100">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Smile Seed Bank</p>
            <p className="text-xs text-zinc-400">Admin Panel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 hover:bg-zinc-800 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Separator className="bg-zinc-800" />

      {/* Main Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const isInventory = item.href === "/admin/inventory";
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
              {isInventory && lowStockCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {lowStockCount > 99 ? "99+" : lowStockCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-zinc-800" />

      <div className="hidden border-t border-zinc-800 px-3 py-3 lg:block">
        <UserNav triggerClassName="w-full justify-start border-zinc-600 text-zinc-100 hover:bg-zinc-800 hover:text-white data-[state=open]:bg-zinc-800" />
      </div>

      {/* Bottom Nav */}
      <div className="space-y-0.5 px-3 py-3">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
