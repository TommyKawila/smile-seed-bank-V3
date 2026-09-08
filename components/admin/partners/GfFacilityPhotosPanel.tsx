import { ExternalLink } from "lucide-react";
import {
  GF_PHOTO_PICKS,
  GF_PHOTO_RECEIVED_AT,
  gfPhotoFileUrl,
} from "@/lib/green-future-photo-request";

export function GfFacilityPhotosPanel() {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          รูปโรงงาน / มาตรฐานผลิตและเก็บรักษา — Green Future
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          รับ {GF_PHOTO_RECEIVED_AT} · ลายน้ำ GF ทับแล้ว · admin เท่านั้น ·
          ใช้การตลาด/แฟ้ม GACP ได้ตามที่อนุมัติรายภาพเท่านั้น
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GF_PHOTO_PICKS.map((photo) => {
          const href = gfPhotoFileUrl(photo.fileName);
          return (
            <li key={photo.id} className="overflow-hidden rounded-lg border border-slate-200">
              <a href={href} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={href}
                  alt={`${photo.listItem}. ${photo.wantTh}`}
                  className="aspect-[4/3] w-full object-cover bg-slate-100"
                />
              </a>
              <div className="space-y-1 p-2.5">
                <p className="text-sm font-medium text-slate-900">
                  {photo.listItem}. {photo.wantTh}
                </p>
                <p className="text-xs text-slate-500">{photo.wantEn}</p>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden />
                  เปิดต้นฉบับ
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
