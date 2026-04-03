"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, Loader2, LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function initialFromUser(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const name =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    user.email ||
    "?";
  const letter = name.trim().charAt(0).toUpperCase();
  return letter || "?";
}

function avatarUrlFromUser(user: User): string | null {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const u = meta?.avatar_url;
  return typeof u === "string" && u.startsWith("http") ? u : null;
}

function roleFromUserMetadata(user: User): string {
  const r = user.user_metadata?.role;
  return typeof r === "string" && r.length > 0 ? r : "USER";
}

type UserNavProps = {
  /** e.g. dark sidebar: `text-zinc-100 hover:bg-zinc-800` */
  triggerClassName?: string;
};

export function UserNav({ triggerClassName }: UserNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("USER");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      await supabase.auth.refreshSession();

      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      const u = data.user;
      if (!u) {
        setUser(null);
        setRole("USER");
        return;
      }

      const userRole = roleFromUserMetadata(u);
      setUser(u);
      setRole(userRole);
    } catch (err) {
      console.error("Error loading user session:", err);
      setUser(null);
      setRole("USER");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className={cn("h-9 gap-1 px-2", triggerClassName)} disabled>
        <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("h-9", triggerClassName || "border-primary/30 text-primary")}
        asChild
      >
        <a href="/login">Sign in</a>
      </Button>
    );
  }

  const avatarUrl = avatarUrlFromUser(user);
  const initial = initialFromUser(user);
  const email = user.email ?? "—";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-9 gap-2 rounded-full px-1.5 pr-2 hover:bg-zinc-100", triggerClassName)}
          aria-label="Account menu"
        >
          <span
            className={cn(
              "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
              "bg-primary text-sm font-semibold text-white"
            )}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              initial
            )}
          </span>
          <ChevronDown className="hidden h-4 w-4 opacity-70 sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-xs text-zinc-500">Signed in as</p>
          <p className="truncate text-sm font-medium text-zinc-900">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-sm">
          <span className="text-zinc-500">Role </span>
          <span className="font-semibold text-primary">{role}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => void handleSignOut()}>
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
