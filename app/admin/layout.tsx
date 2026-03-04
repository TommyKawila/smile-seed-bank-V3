"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
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

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-zinc-800">Admin Panel</p>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
