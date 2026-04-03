"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function BlogListPage() {
  const [list, setList] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">บทความ</h1>
          <p className="text-sm text-zinc-500">จัดการบทความบล็อก</p>
        </div>
        <Link href="/admin/blog/create">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            สร้างบทความ
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            รายการบทความ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">ยังไม่มีบทความ</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หัวข้อ</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>เผยแพร่</TableHead>
                  <TableHead className="w-24">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-zinc-500">{p.slug}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"}>
                        {p.status === "PUBLISHED" ? "เผยแพร่" : "ฉบับร่าง"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500">{formatDate(p.published_at)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/blog/${p.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
