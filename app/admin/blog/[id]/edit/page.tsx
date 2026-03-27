"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiptapEditor } from "@/components/admin/TiptapEditor";

export default function BlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<object | null>(null);
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title ?? "");
        setSlug(data.slug ?? "");
        setExcerpt(data.excerpt ?? "");
        setContent(data.content ?? null);
        setFeaturedImage(data.featured_image ?? "");
        setStatus(data.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
        setTags(Array.isArray(data.tags) ? data.tags.join(", ") : "");
      })
      .catch(() => setError("โหลดไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("กรุณากรอกหัวข้อ");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          content,
          featured_image: featuredImage.trim() || null,
          status,
          published_at: status === "PUBLISHED" ? new Date().toISOString() : null,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      router.push("/admin/blog");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">แก้ไขบทความ</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เนื้อหาบทความ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="space-y-2">
            <Label>หัวข้อ *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อบทความ" />
          </div>
          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-friendly-slug" />
          </div>
          <div className="space-y-2">
            <Label>สรุป (Excerpt)</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="สรุปสั้นๆ" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>เนื้อหา</Label>
            <TiptapEditor content={content} onChange={setContent} placeholder="เขียนเนื้อหาที่นี่..." />
          </div>
          <div className="space-y-2">
            <Label>รูปภาพหลัก (URL)</Label>
            <Input value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>สถานะ</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">ฉบับร่าง</SelectItem>
                <SelectItem value="PUBLISHED">เผยแพร่</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>แท็ก (คั่นด้วย comma)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="กัญชา, ปลูก, Indoor" />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              บันทึก
            </Button>
            <Link href="/admin/blog">
              <Button variant="outline">ยกเลิก</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
