import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function AdminBlogEditRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/magazine/${id}/edit`);
}
