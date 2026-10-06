import Link from "next/link";
import { listEditorialJobs } from "@/lib/editorial-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminMagazineEditorialPage() {
  const jobs = await listEditorialJobs();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Editorial Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Draft jobs stay off the public blog until an approved revision is published.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Revision</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-500">
                  No editorial jobs yet.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="max-w-sm font-medium text-zinc-900">
                    {job.topic}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.status}</Badge>
                  </TableCell>
                  <TableCell>{job.revision}</TableCell>
                  <TableCell>{job.approved_revision ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-600">
                    {formatWhen(job.updated_at)}
                  </TableCell>
                  <TableCell>
                    {job.status === "PUBLISHED" && job.slug ? (
                      <Link
                        href={`/blog/${job.slug}`}
                        className="text-emerald-800 underline-offset-2 hover:underline"
                      >
                        /blog/{job.slug}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
