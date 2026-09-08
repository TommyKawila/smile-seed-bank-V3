import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { GreenFutureLetterView } from "@/components/admin/partners/GreenFutureLetterView";
import {
  GACP_CONSULT_CHECKLIST,
  GREEN_FUTURE_GACP_CONSULT_RAW,
  GREEN_FUTURE_GACP_CONSULT_SUBJECT,
} from "@/lib/green-future-gacp-consult-brief";

export const metadata = {
  title: "GACP consult brief · Green Future · Admin",
  description: GREEN_FUTURE_GACP_CONSULT_SUBJECT,
};

export default function GreenFutureGacpConsultPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-900">
          รายการพกไปหน่วยงาน — checklist
        </h3>
        <ul className="mt-2 space-y-2">
          {GACP_CONSULT_CHECKLIST.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm text-amber-950">
              <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{item.labelTh}</p>
                <p className="text-xs text-amber-800">{item.labelEn}</p>
                {item.note ? (
                  <p className="text-xs text-amber-700">{item.note}</p>
                ) : null}
                {item.href ? (
                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    เปิด
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <GreenFutureLetterView
        title="แฟ้มสอบถามหน่วยงาน GACP — เชียงใหม่"
        description="เอกสารภายใน — คำถามหลัก + ขอคำตอบเป็นลายลักษณ์อักษร · ส่งสำเนาให้ GF หลังได้รับ"
        raw={GREEN_FUTURE_GACP_CONSULT_RAW}
        internal
        lang="th"
      />
    </div>
  );
}
