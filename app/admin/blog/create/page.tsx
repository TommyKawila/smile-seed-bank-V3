"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Sparkles, ImagePlus, Link2, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TiptapEditor } from "@/components/admin/TiptapEditor";

const schema = z.object({
  title: z.string().min(1, "กรุณากรอกหัวข้อ"),
  slug: z.string().min(1, "กรุณาระบุ slug"),
  excerpt: z.string().optional(),
  content: z.unknown().optional(),
  featured_image: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  tags: z.string().optional(),
  related_products: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof schema>;

function slugFromTitle(t: string) {
  return t
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ก-๙]+/g, "");
}

type ProductHit = {
  id: number;
  name: string;
  master_sku: string | null;
  brand: string;
  variants: { id: number; unit_label: string }[];
};

export default function BlogCreatePage() {
  const router = useRouter();
  const [editorKey, setEditorKey] = useState(0);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductHit[]>([]);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: null,
      featured_image: "",
      status: "DRAFT",
      tags: "",
      related_products: [],
    },
  });

  const title = form.watch("title");
  const slug = form.watch("slug");
  const excerpt = form.watch("excerpt");
  const relatedProducts = form.watch("related_products") ?? [];

  const slugTouched = useRef(false);
  useEffect(() => {
    if (title && !slugTouched.current) form.setValue("slug", slugFromTitle(title));
  }, [title, form]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setProductSearchOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!productSearch.trim() || productSearch.length < 2) {
      setProductResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/inventory/search?q=${encodeURIComponent(productSearch)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: ProductHit[]) => setProductResults(Array.isArray(data) ? data : []))
        .catch(() => setProductResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const handleAiSuggest = async () => {
    const topic = form.getValues("title")?.trim();
    if (!topic) {
      form.setError("title", { message: "กรุณากรอกหัวข้อก่อนกด AI Suggest" });
      return;
    }
    setAiLoading(true);
    form.clearErrors();
    try {
      const res = await fetch("/api/admin/blog/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      if (data.title) form.setValue("title", data.title);
      if (data.excerpt) form.setValue("excerpt", data.excerpt);
      if (data.slug) form.setValue("slug", data.slug ?? slugFromTitle(data.title));
      if (data.sections?.length) {
        const nodes: object[] = [];
        for (const s of data.sections as { heading: string; points: string[] }[]) {
          nodes.push({
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: s.heading || "" }],
          });
          if (s.points?.length) {
            nodes.push({
              type: "bulletList",
              content: s.points.map((p: string) => ({
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: p }] }],
              })),
            });
          }
        }
        form.setValue("content", { type: "doc", content: nodes });
        setEditorKey((k) => k + 1);
      }
    } catch (e) {
      form.setError("root", { message: String(e) });
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    const t = form.getValues("title")?.trim();
    if (!t) {
      form.setError("title", { message: "กรุณากรอกหัวข้อก่อน" });
      return;
    }
    setImageLoading(true);
    form.clearErrors("featured_image");
    try {
      const res = await fetch("/api/admin/blog/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "สร้างรูปไม่สำเร็จ");
      if (data.url) form.setValue("featured_image", data.url);
    } catch (e) {
      form.setError("featured_image", { message: String(e) });
    } finally {
      setImageLoading(false);
    }
  };

  const addRelatedProduct = (variantId: number, label: string) => {
    const current = form.getValues("related_products") ?? [];
    if (current.includes(variantId)) return;
    form.setValue("related_products", [...current, variantId]);
    setLinkedLabels((m) => new Map(m).set(variantId, label));
  };

  const removeRelatedProduct = (variantId: number) => {
    form.setValue(
      "related_products",
      (form.getValues("related_products") ?? []).filter((id) => id !== variantId)
    );
    setLinkedLabels((m) => {
      const next = new Map(m);
      next.delete(variantId);
      return next;
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title.trim(),
          slug: values.slug.trim(),
          excerpt: values.excerpt?.trim() || null,
          content: values.content,
          featured_image: values.featured_image?.trim() || null,
          status: values.status,
          published_at: values.status === "PUBLISHED" ? new Date().toISOString() : null,
          tags: (values.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
          related_products: values.related_products ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      router.push("/admin/blog");
    } catch (e) {
      form.setError("root", { message: String(e) });
    }
  });

  const [linkedLabels, setLinkedLabels] = useState<Map<number, string>>(new Map());

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              กลับ
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900">สร้างบทความ</h1>
        </div>
        <Button
          onClick={onSubmit}
          disabled={form.formState.isSubmitting}
          className="bg-primary hover:bg-primary/90"
        >
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          บันทึก
        </Button>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4">
        {form.formState.errors.root && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label>หัวข้อ *</Label>
              <div className="flex gap-2">
                <Input
                  {...form.register("title")}
                  placeholder="ชื่อบทความ"
                  className={form.formState.errors.title ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  title="AI สร้างโครงร่าง"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Suggest
                </Button>
              </div>
              {form.formState.errors.title && (
                <p className="text-xs text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input
              {...form.register("slug")}
              placeholder="url-friendly-slug"
              onFocus={() => { slugTouched.current = true; }}
              className={form.formState.errors.slug ? "border-red-500" : ""}
            />
            {form.formState.errors.slug && (
              <p className="text-xs text-red-600">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>สรุป (Excerpt)</Label>
            <Textarea
              {...form.register("excerpt")}
              placeholder="สรุปสั้นๆ"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>เนื้อหา</Label>
            <Controller
              name="content"
              control={form.control}
              render={({ field }) => (
                <TiptapEditor
                  key={editorKey}
                  content={field.value as object | null}
                  onChange={field.onChange}
                  placeholder="เขียนเนื้อหาที่นี่..."
                  className="min-h-[300px]"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>รูปภาพหลัก (URL)</Label>
            <div className="flex gap-2">
              <Input
                {...form.register("featured_image")}
                placeholder="https://..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateImage}
                disabled={imageLoading}
                title="สร้างรูปด้วย AI"
              >
                {imageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Generate with AI
              </Button>
            </div>
            {form.formState.errors.featured_image && (
              <p className="text-xs text-red-600">{form.formState.errors.featured_image.message}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">ฉบับร่าง</SelectItem>
                      <SelectItem value="PUBLISHED">เผยแพร่</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex-1 space-y-2 min-w-[200px]">
              <Label>แท็ก (คั่นด้วย comma)</Label>
              <Input {...form.register("tags")} placeholder="กัญชา, ปลูก, Indoor" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>สินค้าที่เกี่ยวข้อง</Label>
            <Button type="button" variant="outline" onClick={() => setLinkModalOpen(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              Link Products
            </Button>
            {relatedProducts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {relatedProducts.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-sm"
                  >
                    {linkedLabels.get(id) ?? `Variant #${id}`}
                    <button
                      type="button"
                      onClick={() => removeRelatedProduct(id)}
                      className="rounded p-0.5 hover:bg-zinc-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Card className="border-zinc-200 bg-white">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-zinc-500">SEO Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 py-2">
              <p className="truncate text-lg text-blue-700 hover:underline">
                {title || "ชื่อบทความ"} | Smile Seed Bank
              </p>
              <p className="text-sm text-green-700">
                {(process.env.NEXT_PUBLIC_BASE_URL || "https://smileseedbank.com")}/blog/{slug || "slug"}
              </p>
              <p className="line-clamp-2 text-sm text-zinc-600">
                {excerpt || "สรุปบทความจะแสดงที่นี่..."}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Link Products</DialogTitle>
          </DialogHeader>
          <div ref={productSearchRef} className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <Input
              placeholder="ค้นหาสินค้า..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setProductSearchOpen(true);
              }}
              onFocus={() => setProductSearchOpen(true)}
            />
            <div className="flex-1 overflow-auto min-h-0">
              {productSearchOpen && productResults.length > 0 && (
                <div className="space-y-1">
                  {productResults.map((prod) =>
                    prod.variants?.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm hover:bg-zinc-50"
                        onClick={() => {
                          addRelatedProduct(v.id, `${prod.name} — ${v.unit_label}`);
                          setProductSearch("");
                          setProductSearchOpen(false);
                        }}
                      >
                        <span>{prod.name} — {v.unit_label}</span>
                        {relatedProducts.includes(v.id) && (
                          <span className="text-xs text-primary">✓ เลือกแล้ว</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
