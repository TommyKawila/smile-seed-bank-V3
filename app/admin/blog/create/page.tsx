import { redirect } from "next/navigation";

export default function AdminBlogCreateRedirectPage() {
  redirect("/admin/magazine/new");
}
