"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type KnowledgeEntry = {
  id: string;
  title: string;
  preview: string;
  created_at: string;
  metadata?: {
    source?: string;
    filename?: string;
    chunkIndex?: number;
    chunkTotal?: number;
  };
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminKnowledgePanel() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/knowledge");
      const body = (await res.json().catch(() => ({}))) as {
        entries?: KnowledgeEntry[];
        error?: string;
      };
      if (!res.ok) throw new Error(body.error || "Failed to load");
      setEntries(body.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onFileChange = (list: FileList | null) => {
    const f = list?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    const name = f.name.toLowerCase();
    if (!name.endsWith(".txt") && !name.endsWith(".md") && !name.endsWith(".markdown")) {
      toast({
        title: "Invalid file",
        description: "Only .txt and .md are allowed.",
        variant: "destructive",
      });
      if (fileRef.current) fileRef.current.value = "";
      setFile(null);
      return;
    }
    setFile(f);
    if (!title.trim()) {
      setTitle(f.name.replace(/\.(txt|md|markdown)$/i, ""));
    }
  };

  const add = async () => {
    if (saving) return;
    const hasText = content.trim().length > 0;
    if (!hasText && !file) {
      toast({
        title: "Nothing to add",
        description: "Paste text or choose a .txt / .md file.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let res: Response;
      if (file && !hasText) {
        const form = new FormData();
        if (title.trim()) form.set("title", title.trim());
        form.set("file", file);
        res = await fetch("/api/admin/knowledge", {
          method: "POST",
          body: form,
        });
      } else if (file && hasText) {
        // Prefer pasted text; still attach file name as title hint only.
        res = await fetch("/api/admin/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || undefined,
            content: content.trim(),
          }),
        });
      } else {
        res = await fetch("/api/admin/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || undefined,
            content: content.trim(),
          }),
        });
      }

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        inserted?: number;
      };
      if (!res.ok) throw new Error(body.error || "Add failed");

      toast({
        title: "Added to Knowledge",
        description: `${body.inserted ?? 1} chunk(s) stored.`,
      });
      setContent("");
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setLoading(true);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Add failed";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Delete failed");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Deleted" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Knowledge Manager
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste text or upload .txt / .md — stored as chunked embeddings for
          future RAG retrieval.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Title (optional)
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Malikha deal notes"
            maxLength={200}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Content
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste knowledge here…"
            rows={8}
            className="min-h-[160px] resize-y"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.markdown,text/plain,text/markdown"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-11 gap-2"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden />
            {file ? file.name : "Upload .txt / .md"}
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-emerald-600 hover:bg-emerald-700"
            disabled={saving}
            onClick={() => void add()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding…
              </>
            ) : (
              "Add to Knowledge"
            )}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Entries ({entries.length})
        </h3>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No knowledge entries yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {e.title}
                    {typeof e.metadata?.chunkTotal === "number" &&
                    e.metadata.chunkTotal > 1 ? (
                      <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                        chunk{" "}
                        {(e.metadata.chunkIndex ?? 0) + 1}/
                        {e.metadata.chunkTotal}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {e.preview}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatWhen(e.created_at)}
                    {e.metadata?.source
                      ? ` · ${e.metadata.source}`
                      : null}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 shrink-0 text-destructive hover:text-destructive"
                  disabled={deletingId === e.id}
                  aria-label="Delete entry"
                  onClick={() => void remove(e.id)}
                >
                  {deletingId === e.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
