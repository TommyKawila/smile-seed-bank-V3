import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      <Icon
        className="mb-3 h-9 w-9 text-zinc-300"
        strokeWidth={1.5}
        aria-hidden
      />
      <h3 className="text-sm font-semibold tracking-tight text-zinc-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-zinc-500">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
