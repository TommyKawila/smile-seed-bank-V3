"use client";

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
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "สินค้า", icon: Package },
  { href: "/admin/inventory", label: "สต็อก / Inventory", icon: Boxes },
  { href: "/admin/breeders", label: "แบรนด์ / Breeders", icon: Leaf },
  { href: "/admin/orders", label: "ออเดอร์", icon: ShoppingCart },
  { href: "/admin/orders/create", label: "สร้างออเดอร์ (POS)", icon: PlusSquare },
  { href: "/admin/customers", label: "ลูกค้า", icon: Users },
  { href: "/admin/promotions", label: "โปรโมชั่น", icon: Tag },
  { href: "/admin/discounts", label: "ส่วนลด / คูปอง", icon: Percent },
  { href: "/admin/blogs", label: "บทความ", icon: BookOpen },
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
      </nav>

      <Separator className="bg-zinc-800" />

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
