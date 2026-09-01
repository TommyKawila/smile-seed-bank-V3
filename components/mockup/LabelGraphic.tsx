import type { SeedLabelData } from "@/types/label";
import { labelFontPx } from "@/lib/mockup-dimensions";
import { DEFAULT_FONT_SCALE } from "@/types/label";

type Props = {
  data: SeedLabelData;
  className?: string;
};

function Row({
  th,
  en,
  value,
  fs,
  bold,
}: {
  th: string;
  en: string;
  value: string;
  fs: number;
  bold?: boolean;
}) {
  return (
    <p style={{ fontSize: labelFontPx(6.5, fs) }} className="leading-tight">
      <span className={bold ? "font-bold" : ""}>
        {th} / {en}:{" "}
      </span>
      <span className={bold ? "font-semibold" : ""}>{value || "—"}</span>
    </p>
  );
}

/** DOA-controlled seed label — bilingual TH+EN, 5.5×5.5 cm print target */
export function LabelGraphic({ data, className }: Props) {
  const fs = data.fontScale ?? DEFAULT_FONT_SCALE;
  const qtyLabel =
    data.quantity > 0
      ? `${data.quantity} เมล็ด / ${data.quantity} seeds`
      : "—";

  return (
    <div
      className={
        className ??
        "box-border w-[280px] select-none border border-black bg-white p-1.5 font-sans leading-none text-black"
      }
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <p
        className="border-b border-black pb-0.5 text-center font-bold uppercase"
        style={{ fontSize: labelFontPx(7.5, fs) }}
      >
        เมล็ดพันธุ์ควบคุม / CONTROLLED SEED
      </p>

      <div className="space-y-0.5 py-0.5">
        <Row
          th="ชนิดพืช"
          en="Plant species"
          value={data.species}
          fs={fs}
        />
        <Row
          th="ชื่อพันธุ์"
          en="Variety"
          value={data.strainName}
          fs={fs}
          bold
        />
        <Row
          th="เครื่องหมายการค้า"
          en="Trademark"
          value={data.trademark}
          fs={fs}
        />
        <Row
          th="เลข พ.พ."
          en="P.P. No."
          value={data.producerLicensePP}
          fs={fs}
        />
        <Row th="เลขล็อต" en="Lot No." value={data.lotNo} fs={fs} bold />
        <Row th="ปริมาณสุทธิ" en="Net Quantity" value={qtyLabel} fs={fs} />
        <div className="grid grid-cols-2 gap-x-1">
          <Row
            th="ความงอก"
            en="Germination"
            value={data.germination ? `${data.germination} %` : "—"}
            fs={fs}
          />
          <Row
            th="ความบริสุทธิ์"
            en="Purity"
            value={data.purity ? `${data.purity} %` : "—"}
            fs={fs}
          />
        </div>
        <Row
          th="วันที่ทดสอบ"
          en="Test Date"
          value={data.testedDate}
          fs={fs}
        />
        <Row
          th="วันที่รวบรวม/นำเข้า"
          en="Collection/Import"
          value={data.collectedDate}
          fs={fs}
        />
        <Row
          th="วันที่สิ้นอายุพันธุ์"
          en="Expiry Date"
          value={data.expiryDate}
          fs={fs}
        />
        <Row
          th="แหล่งรวบรวม"
          en="Collection Source"
          value={data.collectionSource}
          fs={fs}
        />
        <Row
          th="ผู้รวบรวม"
          en="Collector"
          value={data.producerName}
          fs={fs}
        />
        <p style={{ fontSize: labelFontPx(6, fs) }} className="leading-tight">
          <span className="font-bold">สถานที่รวบรวม / Collection Place: </span>
          {data.address || "—"}
        </p>
        {data.distributorName ? (
          <p style={{ fontSize: labelFontPx(5.5, fs) }} className="leading-tight opacity-80">
            ผู้ขาย / Seller: {data.distributorName}
            {data.distributorLicensePP4
              ? ` · พ.พ.4 ${data.distributorLicensePP4}`
              : ""}
          </p>
        ) : null}
      </div>

      <div
        className="border-t border-black pt-0.5"
        style={{ fontSize: labelFontPx(5.5, fs) }}
      >
        <p className="font-bold">การเก็บรักษา / Storage:</p>
        <p className="whitespace-pre-wrap leading-tight">
          {data.storageInstructions}
        </p>
      </div>
    </div>
  );
}
