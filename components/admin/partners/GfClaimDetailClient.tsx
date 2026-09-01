"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { GfClaimFileView, GfSeedClaimDetail } from "@/lib/gf-seed-claim-admin";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function FileList({ title, files }: { title: string; files: GfClaimFileView[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900">
        {title} ({files.length})
      </h3>
      {files.length === 0 ? (
        <p className="text-sm text-slate-500">ไม่มีไฟล์</p>
      ) : (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="text-sm">
              {f.href ? (
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline"
                >
                  {f.name}
                </a>
              ) : (
                <span>{f.name}</span>
              )}
              <span className="ml-2 text-xs text-slate-400">
                {f.storage}
                {f.sizeBytes ? ` · ${Math.round(f.sizeBytes / 1024)} KB` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GfClaimDetailClient({ id }: { id: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<GfSeedClaimDetail | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/claim/seeds/${id}`, { cache: "no-store" });
      const json = (await res.json()) as { claim?: GfSeedClaimDetail; error?: string };
      if (!res.ok) throw new Error(json.error ?? "load failed");
      setClaim(json.claim ?? null);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "โหลดรายละเอียดไม่สำเร็จ",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const copySummary = async () => {
    if (!claim) return;
    await navigator.clipboard.writeText(claim.forwardSummary);
    setCopied(true);
    toast({ title: "คัดลอกสรุปสำหรับส่งต่อ GF แล้ว" });
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด…
      </p>
    );
  }

  if (!claim) {
    return (
      <p className="text-sm text-slate-500">
        ไม่พบคำขอเคลมนี้ ·{" "}
        <Link href="/admin/partners/green-future/claims" className="text-emerald-700 hover:underline">
          กลับ inbox
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/partners/green-future/claims"
            className="text-sm text-emerald-700 hover:underline"
          >
            ← Inbox
          </Link>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Claim #{claim.id.slice(0, 8)}
          </h2>
          <p className="text-sm text-slate-500">{formatWhen(claim.createdAt)}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void copySummary()}>
          {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
          คัดลอกสรุปส่ง GF
        </Button>
      </div>

      <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
        {claim.forwardSummary}
      </pre>

      {claim.sections.map((section) => (
        <section key={section.title} className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {section.rows.map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {row.label}
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Evidence</h3>
        <FileList title="Packaging + lot" files={claim.files.packaging} />
        <FileList title="Claimed seeds" files={claim.files.claimedSeeds} />
        <FileList title="Process" files={claim.files.process} />
        {claim.extraMediaUrl ? (
          <p className="text-sm">
            Extra media:{" "}
            <a
              href={claim.extraMediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline"
            >
              {claim.extraMediaUrl}
            </a>
          </p>
        ) : null}
      </section>
    </div>
  );
}
