"use client";

import { useEffect, useState } from "react";
import { Hexagon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/** Matches AIModel keys used by /api/admin/chat and lib/ai-provider. */
export type AdminAiModel = "gemini" | "gpt-4o";

export const ADMIN_AI_MODEL_STORAGE_KEY = "ssb_admin_ai_model";

type Props = {
  value: AdminAiModel;
  onChange: (model: AdminAiModel) => void;
};

/**
 * Floating Gemini / GPT-4o switcher for admin SSB Assistant.
 *
 * Pass activeAIModel to assistant API:
 * await fetch('/api/admin/chat', {
 *   method: 'POST',
 *   body: JSON.stringify({ message, model: activeAIModel, files }),
 * });
 */
export function AiModelSwitcher({ value, onChange }: Props) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Desktop starts expanded; mobile collapses until tapped.
    const mq = window.matchMedia("(min-width: 640px)");
    setExpanded(mq.matches);
    const onChangeMq = () => setExpanded(mq.matches);
    mq.addEventListener("change", onChangeMq);
    return () => mq.removeEventListener("change", onChangeMq);
  }, []);

  const select = (model: AdminAiModel) => {
    if (model === value) return;
    onChange(model);
    try {
      localStorage.setItem(ADMIN_AI_MODEL_STORAGE_KEY, model);
    } catch {
      /* ignore */
    }
    toast({
      title:
        model === "gemini"
          ? "Switched to Google Gemini"
          : "Switched to OpenAI GPT-4o",
    });
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white/90 shadow-lg backdrop-blur-md transition hover:bg-white"
        aria-label="Open AI model switcher"
      >
        <Sparkles className="h-5 w-5 text-emerald-600" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <div
        className="relative flex rounded-full border border-slate-200 bg-white/90 p-1 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80"
        role="group"
        aria-label="AI model"
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-emerald-600/15 transition-all duration-300",
            value === "gpt-4o" && "translate-x-full"
          )}
        />
        <button
          type="button"
          onClick={() => select("gemini")}
          className={cn(
            "relative z-10 flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors sm:px-4",
            value === "gemini" ? "text-emerald-800" : "text-slate-500"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Gemini
        </button>
        <button
          type="button"
          onClick={() => select("gpt-4o")}
          className={cn(
            "relative z-10 flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors sm:px-4",
            value === "gpt-4o" ? "text-emerald-800" : "text-slate-500"
          )}
        >
          <Hexagon className="h-3.5 w-3.5" aria-hidden />
          GPT-4o
        </button>
      </div>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/80 text-muted-foreground shadow backdrop-blur-md sm:hidden"
        onClick={() => setExpanded(false)}
        aria-label="Collapse model switcher"
      >
        ×
      </button>
    </div>
  );
}

export function readStoredAdminAiModel(): AdminAiModel {
  if (typeof window === "undefined") return "gemini";
  try {
    const v = localStorage.getItem(ADMIN_AI_MODEL_STORAGE_KEY);
    if (v === "gemini" || v === "gpt-4o") return v;
  } catch {
    /* ignore */
  }
  return "gemini";
}
