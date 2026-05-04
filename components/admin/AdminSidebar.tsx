"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Tag,
  Settings,
  Leaf,
  PlusSquare,
  Percent,
  X,
  Boxes,
  FolderTree,
  CreditCard,
  Truck,
  LayoutGrid,
  LayoutTemplate,
  BarChart2,
  BarChart3,
  FileText,
  Camera,
  Sparkles,
  Newspaper,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { UserNav } from "@/components/admin/user-nav";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Executive analytics", icon: BarChart3 },
  { href: "/admin/products", label: "สินค้า", icon: Package },
  { href: "/admin/inventory", label: "สต็อก / Inventory", icon: Boxes },
  { href: "/admin/inventory/dashboard", label: "Inventory Dashboard", icon: BarChart2 },
  { href: "/admin/inventory/manual", label: "Manual Grid", icon: LayoutGrid },
  { href: "/admin/inventory/ai-import", label: "AI Import", icon: Sparkles },
  { href: "/admin/inventory/snapshots", label: "Stock Audit", icon: Camera },
  { href: "/admin/breeders", label: "แบรนด์ / Breeders", icon: Leaf },
  { href: "/admin/categories", label: "หมวดหมู่ / Categories", icon: FolderTree },
  { href: "/admin/orders", label: "ออเดอร์", icon: ShoppingCart },
  { href: "/admin/m", label: "Orders (Mobile)", icon: Smartphone },
  { href: "/admin/quotations", label: "ใบเสนอราคา", icon: FileText },
  { href: "/admin/orders/create", label: "สร้างออเดอร์ (POS)", icon: PlusSquare },
  { href: "/admin/reports/daily", label: "รายงานยอดขาย", icon: FileText },
  { href: "/admin/customers", label: "ลูกค้า", icon: Users },
  { href: "/admin/promotions", label: "โปรโมชั่น", icon: Tag },
  { href: "/admin/promotions/campaigns", label: "แคมเปญป๊อปอัพ", icon: Sparkles },
  { href: "/admin/banners", label: "แบนเนอร์หน้าแรก", icon: LayoutTemplate },
  { href: "/admin/discounts", label: "ส่วนลด / คูปอง", icon: Percent },
  { href: "/admin/magazine", label: "Smile Seed Blog", icon: Newspaper },
];

const bottomItems = [
  { href: "/admin/settings", label: "ตั้งค่าร้านค้า", icon: Settings },
  { href: "/admin/settings/homepage", label: "หน้าแรก (ลำดับ)", icon: LayoutTemplate },
  { href: "/admin/settings/shipping", label: "ค่าจัดส่ง", icon: Truck },
  { href: "/admin/settings/payment", label: "ช่องทางชำระเงิน", icon: CreditCard },
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/inventory/low-stock?count=true", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLowStockCount(d?.count ?? 0))
      .catch(() => {});
  }, []);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white text-zinc-800 shadow-sm">
      {/* Logo — full-color brand asset as storefront (`logo_main_url`) */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-100 px-5 py-5">
        <Link
          href="/admin/dashboard"
          className="flex min-w-0 flex-1 flex-col gap-1.5"
          onClick={onClose}
        >
          {settings.logo_main_url ? (
            <>
              <Image
                src={settings.logo_main_url}
                alt="Smile Seed Bank"
                width={280}
                height={96}
                className="h-10 w-auto max-w-[200px] object-contain object-left sm:h-12"
                unoptimized
              />
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Admin Panel
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold leading-tight text-zinc-900">
                  Smile Seed Bank
                </span>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Admin Panel
              </p>
            </>
          )}
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-zinc-600 hover:bg-zinc-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Separator className="bg-zinc-200" />

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
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
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

      <Separator className="bg-zinc-200" />

      <div className="hidden border-t border-zinc-100 px-3 py-3 lg:block">
        <UserNav triggerClassName="w-full justify-start border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 data-[state=open]:bg-zinc-50" />
      </div>

      {/* Bottom Nav */}
      <div className="space-y-0.5 border-t border-zinc-100 px-3 py-3">
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
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
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
