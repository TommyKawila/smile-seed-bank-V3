"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Loader2,
  BookOpen,
  Search,
  Sparkles,
  Newspaper,
  BarChart2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DeleteMagazinePostButton } from "@/components/admin/magazine/DeleteMagazinePostButton";
import {
  setMagazineTrendingModeAction,
  setMagazinePostHighlightAction,
} from "@/app/admin/magazine/actions";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  is_highlight: boolean;
  view_count: number;
  manual_rank: number;
  category_id: number | null;
  category: { id: number; name: string; slug: string } | null;
};

type Category = { id: number; name: string; slug: string };

type TopPost = { id: number; title: string; slug: string; view_count: number };

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  } catch {
    return "—";
  }
}

export function MagazineAdminDashboard() {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [list, setList] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [trendingMode, setTrendingMode] = useState<"auto" | "manual">("auto");
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [highlightSaving, setHighlightSaving] = useState<number | null>(null);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [topLoading, setTopLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blog/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchTrendingSetting = useCallback(async () => {
    setTrendingLoading(true);
    try {
      const res = await fetch("/api/admin/magazine/settings");
      const data = await res.json();
      if (data.trending_mode === "manual") setTrendingMode("manual");
      else setTrendingMode("auto");
    } catch {
      setTrendingMode("auto");
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (categoryFilter !== "all") sp.set("categoryId", categoryFilter);
      if (statusFilter !== "all") sp.set("status", statusFilter);
      if (debouncedSearch) sp.set("q", debouncedSearch);
      const q = sp.toString();
      const res = await fetch(`/api/admin/blog${q ? `?${q}` : ""}`);
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
    fetchTrendingSetting();
  }, [fetchCategories, fetchTrendingSetting]);

  useEffect(() => {
    setTopLoading(true);
    fetch("/api/admin/magazine/top-posts")
      .then((r) => r.json())
      .then((d) => setTopPosts(Array.isArray(d) ? d : []))
      .catch(() => setTopPosts([]))
      .finally(() => setTopLoading(false));
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const patchTrendingMode = (mode: "auto" | "manual") => {
    startTransition(async () => {
      try {
        await setMagazineTrendingModeAction(mode);
        setTrendingMode(mode);
        toast({
          title: "Trending mode updated",
          description:
            mode === "auto" ? "By view count" : "By manual rank (blog_posts.manual_rank)",
        });
      } catch {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    });
  };

  const toggleHighlight = async (post: BlogPost, next: boolean) => {
    setHighlightSaving(post.id);
    try {
      await setMagazinePostHighlightAction(post.id, next);
      setList((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_highlight: next } : p))
      );
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setHighlightSaving(null);
    }
  };

  const highlightCount = useMemo(
    () => list.filter((p) => p.is_highlight).length,
    [list]
  );

  const maxTopViews = useMemo(
    () => Math.max(1, ...topPosts.map((p) => p.view_count)),
    [topPosts]
  );

  return (
    <div className="min-h-full bg-white font-sans text-zinc-900">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50">
              <Newspaper className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">
                Editorial
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-emerald-950">
                Smile Seed Blog CMS
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Posts, carousel highlights, trending — same pipeline as storefront (
                <code className="rounded bg-zinc-100 px-1 text-[11px] text-zinc-700">
                  lib/blog-service.ts
                </code>
                )
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/magazine/categories"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
            >
              <FolderOpen className="h-4 w-4 text-emerald-700" />
              Categories
            </Link>
            <Link
              href="/admin/magazine/new"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" />
              New article
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border border-zinc-200 bg-zinc-50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-950">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                Trending section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs leading-relaxed text-zinc-600">
                Storefront “Trending” order: Auto uses views; Manual uses{" "}
                <span className="font-medium text-zinc-800">manual_rank</span> (lower = higher).
              </p>
              {trendingLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Label className="text-xs text-zinc-700">Mode</Label>
                  <Select
                    value={trendingMode}
                    disabled={pending}
                    onValueChange={(v) => patchTrendingMode(v as "auto" | "manual")}
                  >
                    <SelectTrigger className="h-9 w-[220px] border-zinc-200 bg-white text-zinc-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-200 bg-white text-zinc-900">
                      <SelectItem value="auto">Auto (view count)</SelectItem>
                      <SelectItem value="manual">Manual (manual rank)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 bg-zinc-50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-950">
                Carousel (highlight)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-600">
                Toggle <span className="font-medium text-zinc-800">HL</span> below — published +
                highlight posts feed the hero carousel (
                <span className="font-mono tabular-nums text-emerald-700">
                  {highlightCount}
                </span>{" "}
                in current filter).
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-zinc-200 bg-zinc-50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-950">
              <BarChart2 className="h-4 w-4 text-emerald-700" />
              Top performing posts
            </CardTitle>
            <p className="text-xs text-zinc-600">
              Published articles by view count (storefront tracking).
            </p>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              </div>
            ) : topPosts.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">No published posts yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                {topPosts.map((p, i) => {
                  const pct = Math.round((p.view_count / maxTopViews) * 100);
                  return (
                    <li
                      key={p.id}
                      className={i % 2 === 0 ? "bg-white px-4 py-4" : "bg-zinc-50/80 px-4 py-4"}
                    >
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <span className="mt-0.5 w-5 shrink-0 tabular-nums text-zinc-500">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="line-clamp-2 font-medium text-zinc-900 transition hover:text-emerald-800"
                          >
                            {p.title}
                          </Link>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                            <div
                              className="h-full rounded-full bg-emerald-600 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="shrink-0 tabular-nums text-zinc-600">
                          {p.view_count.toLocaleString("th-TH")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 bg-zinc-50 shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-medium text-emerald-950">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              Posts
            </CardTitle>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Title…"
                    className="h-9 w-[min(100%,200px)] border-zinc-200 bg-white pl-8 text-sm text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Category
                </Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 w-[140px] border-zinc-200 bg-white text-zinc-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-200 bg-white text-zinc-900">
                    <SelectItem value="all">All</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[130px] border-zinc-200 bg-white text-zinc-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-200 bg-white text-zinc-900">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : list.length === 0 ? (
              <p className="py-16 text-center text-sm text-zinc-600">
                No posts match.{" "}
                <Link
                  href="/admin/magazine/new"
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Create one
                </Link>
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-200 bg-zinc-100/90 hover:bg-zinc-100/90">
                      <TableHead className="w-12 text-zinc-600">HL</TableHead>
                      <TableHead className="text-zinc-700">Title</TableHead>
                      <TableHead className="hidden text-zinc-700 sm:table-cell">
                        Category
                      </TableHead>
                      <TableHead className="text-zinc-700">Status</TableHead>
                      <TableHead className="hidden tabular-nums text-zinc-700 md:table-cell">
                        Views
                      </TableHead>
                      <TableHead className="hidden tabular-nums text-zinc-700 lg:table-cell">
                        Rank
                      </TableHead>
                      <TableHead className="hidden text-zinc-700 md:table-cell">
                        Published
                      </TableHead>
                      <TableHead className="text-right text-zinc-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((p, idx) => (
                      <TableRow
                        key={p.id}
                        className={`border-zinc-100 ${
                          idx % 2 === 0 ? "bg-white" : "bg-zinc-50/70"
                        } hover:bg-emerald-50/40`}
                      >
                        <TableCell>
                          <Switch
                            checked={p.is_highlight}
                            disabled={highlightSaving === p.id}
                            onCheckedChange={(v) => void toggleHighlight(p, v)}
                            aria-label="Carousel highlight"
                          />
                        </TableCell>
                        <TableCell className="max-w-[200px] font-medium text-zinc-900 sm:max-w-[280px]">
                          <span className="line-clamp-2">{p.title}</span>
                        </TableCell>
                        <TableCell className="hidden text-sm text-zinc-600 sm:table-cell">
                          {p.category?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={p.status === "PUBLISHED" ? "default" : "secondary"}
                            className="font-normal"
                          >
                            {p.status === "PUBLISHED" ? "Live" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden tabular-nums text-zinc-600 md:table-cell">
                          {p.view_count ?? 0}
                        </TableCell>
                        <TableCell className="hidden tabular-nums text-zinc-600 lg:table-cell">
                          {p.manual_rank ?? 0}
                        </TableCell>
                        <TableCell className="hidden text-sm text-zinc-600 md:table-cell">
                          {formatDate(p.published_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <Link href={`/admin/magazine/${p.id}/edit`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <DeleteMagazinePostButton
                              postId={String(p.id)}
                              onDeleted={fetchList}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
