import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Blog } from "@/types/supabase";
import { BlogListClient } from "@/components/storefront/BlogListClient";

export const metadata: Metadata = {
  title: "บทความ & ความรู้ — Smile Seed Bank",
  description:
    "แหล่งรวมบทความความรู้เรื่องเมล็ดพันธุ์ การปลูก และเทคนิคต่างๆ จากทีม Smile Seed Bank",
  openGraph: {
    title: "บทความ — Smile Seed Bank",
    description: "ความรู้เรื่องเมล็ดพันธุ์และการปลูก",
    type: "website",
  },
};

export const revalidate = 600;

async function getPublishedBlogs(): Promise<Blog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return (data as Blog[]) ?? [];
}

export default async function BlogListPage() {
  const blogs = await getPublishedBlogs();

  return (
    <div className="min-h-screen bg-white pb-20 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <BlogListClient blogs={blogs} />
      </div>
    </div>
  );
}
