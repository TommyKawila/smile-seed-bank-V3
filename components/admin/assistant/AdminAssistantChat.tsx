"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AiModelSwitcher,
  readStoredAdminAiModel,
  type AdminAiModel,
} from "@/components/admin/assistant/AiModelSwitcher";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

type PendingFile = {
  id: string;
  fileName: string;
  mimeType: string;
  dataBase64: string;
  previewUrl?: string;
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,application/pdf";
const MAX_FILES = 3;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

function isAllowedMime(mime: string): boolean {
  return (
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/webp" ||
    mime === "application/pdf"
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function AdminAssistantChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [activeAIModel, setActiveAIModel] =
    useState<AdminAiModel>("gemini");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    setActiveAIModel(readStoredAdminAiModel());
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/chat?limit=40");
        if (!res.ok) throw new Error("Failed to load history");
        const data = (await res.json()) as { messages?: ChatMsg[] };
        if (!cancelled) setMessages(data.messages ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load chat"
          );
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  useEffect(() => {
    return () => {
      for (const p of pendingRef.current) {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      }
    };
  }, []);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const list = Array.from(fileList);
    if (!list.length) return;

    setError(null);
    const next: PendingFile[] = [];

    for (const file of list) {
      const mime = (file.type || "").toLowerCase();
      if (!isAllowedMime(mime)) {
        setError("รองรับเฉพาะ JPEG/PNG/WebP และ PDF");
        continue;
      }
      const max = mime === "application/pdf" ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
      if (file.size > max) {
        setError(
          mime === "application/pdf"
            ? "ไฟล์ PDF ใหญ่เกินไป (สูงสุด ~15MB)"
            : "ไฟล์รูปใหญ่เกินไป (สูงสุด ~10MB)"
        );
        continue;
      }
      try {
        const dataBase64 = await readFileAsBase64(file);
        next.push({
          id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: file.name,
          mimeType: mime,
          dataBase64,
          previewUrl: mime.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
        });
      } catch {
        setError("อ่านไฟล์ไม่สำเร็จ");
      }
    }

    if (!next.length) return;
    setPending((prev) => {
      const merged = [...prev, ...next].slice(0, MAX_FILES);
      if (prev.length + next.length > MAX_FILES) {
        setError(`แนบได้สูงสุด ${MAX_FILES} ไฟล์`);
      }
      return merged;
    });
  }, []);

  const removePending = (id: string) => {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !pending.length) || sending) return;

    if (activeAIModel === "gpt-4o" && pending.length > 0) {
      toast({
        title: "Attachments require Gemini",
        description: "File uploads are only supported with Google Gemini.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    const filesPayload = pending.map((p) => ({
      mimeType: p.mimeType,
      dataBase64: p.dataBase64,
      fileName: p.fileName,
    }));
    const labels = pending.map((p) =>
      p.mimeType === "application/pdf"
        ? `[PDF: ${p.fileName}]`
        : `[Image: ${p.fileName}]`
    );
    const optimistic =
      labels.length && text
        ? `${labels.join(" ")}\n${text}`
        : labels.length
          ? labels.join(" ")
          : text;

    setInput("");
    for (const p of pending) {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    }
    setPending([]);

    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: optimistic },
    ]);
    setSending(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          model: activeAIModel,
          files: filesPayload,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error || "Send failed");
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: body.reply || "(empty)",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragging(false);
    if (e.dataTransfer.files?.length) {
      void addFiles(e.dataTransfer.files);
    }
  };

  const canSend =
    !sending &&
    !loadingHistory &&
    (input.trim().length > 0 || pending.length > 0);

  return (
    <div
      className="relative flex h-[min(720px,calc(100vh-10rem))] flex-col rounded-xl border border-border bg-card shadow-sm"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {dragging ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50/90">
          <p className="text-sm font-semibold text-emerald-800">
            วางรูปหรือ PDF ที่นี่
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">
            SSB Assistant
          </h2>
          <p className="text-xs text-muted-foreground">
            Shared with Telegram Founder · session{" "}
            <code className="text-[10px]">tommy</code>
            {" · "}แนบรูป/PDF หรือลากวางได้ (Gemini)
          </p>
        </div>
        <AiModelSwitcher value={activeAIModel} onChange={setActiveAIModel} />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading history…
          </div>
        ) : messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No messages yet. Ask anything — or drop a screenshot.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-emerald-600 text-white"
                    : "rounded-bl-md bg-muted text-foreground"
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="border-t border-border px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {pending.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-border px-3 pt-3">
          {pending.map((p) => (
            <div
              key={p.id}
              className="relative flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-1.5 pr-8"
            >
              {p.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.previewUrl}
                  alt={p.fileName}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-background">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <span className="max-w-[120px] truncate text-xs text-foreground">
                {p.fileName}
              </span>
              <button
                type="button"
                className="absolute right-1 top-1 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                onClick={() => removePending(p.id)}
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-12 min-w-12 shrink-0"
            disabled={sending || loadingHistory || pending.length >= MAX_FILES}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="พิมพ์ข้อความ แนบรูป/PDF หรือลากวาง… (Enter ส่ง)"
            disabled={sending || loadingHistory}
            className="min-h-12 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <Button
            type="button"
            className="min-h-12 min-w-12 shrink-0"
            disabled={!canSend}
            onClick={() => void send()}
            aria-label="Send"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
