"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { UserNav } from "@/components/admin/user-nav";
import { Toaster } from "@/components/ui/toaster";
export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminLogin = pathname === "/admin/login" || pathname?.startsWith("/admin/login/");
  const isMobileDash = pathname === "/admin/m" || pathname?.startsWith("/admin/m/");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isAdminLogin) {
    return (
      <>
        <Toaster />
        {children}
      </>
    );
  }

  if (isMobileDash) {
    return (
      <div className="min-h-dvh min-h-screen bg-zinc-950 text-zinc-100">
        <Toaster />
        <div className="mx-auto w-full min-h-dvh min-h-screen max-w-[600px] border-x border-zinc-800/80">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950/90 px-3 py-2.5 backdrop-blur-md">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-tight text-zinc-100">Quick orders</h1>
              <p className="truncate text-[10px] text-zinc-500">/admin/m</p>
            </div>
            <UserNav
              triggerClassName="h-9 gap-2 rounded-full border border-zinc-600 bg-zinc-900 px-1.5 pr-2 text-zinc-100 hover:bg-zinc-800"
            />
          </header>
          <div className="px-2 pb-4 pt-1 sm:px-3">{children}</div>
          <p className="px-3 pb-6 text-center text-[10px] leading-relaxed text-zinc-600">
            <Link href="/admin/orders" className="text-emerald-500/90 underline-offset-2 hover:underline">
              Full admin → Orders
            </Link>
            <span className="mt-1 block text-zinc-500">
              Session refreshes in the background; you stay signed in on this device.
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Toaster />
      <div className="hidden lg:flex lg:shrink-0 print:hidden">
        <AdminSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 lg:hidden print:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800">Admin Panel</p>
          <UserNav />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
