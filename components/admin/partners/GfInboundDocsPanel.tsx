import { ExternalLink, FileText } from "lucide-react";
import { GF_INBOUND_DOCS } from "@/lib/green-future-inbound-docs";

export function GfInboundDocsPanel() {
  return (
    <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        ต้นฉบับจาก Green Future — ใช้วางกลยุทธ์ (admin เท่านั้น)
      </h3>
      <p className="text-xs leading-relaxed text-slate-500">
        เก็บใน{" "}
        <code className="font-mono">data/partners/green-future/documents/</code>{" "}
        ไม่เสิร์ฟจาก /public
      </p>
      <ul className="space-y-3">
        {GF_INBOUND_DOCS.map((doc) => (
          <li key={doc.id} className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#12463e]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{doc.titleTh}</p>
              <p className="text-xs text-slate-500">
                {doc.refCode} · {doc.issuedAt}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                {doc.useTh}
              </p>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                เปิด PDF
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}