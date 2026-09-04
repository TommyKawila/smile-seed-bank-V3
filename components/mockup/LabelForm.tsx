"use client";

import { useMockup } from "@/components/mockup/MockupContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-600">{label}</Label>
      {children}
    </div>
  );
}

export function LabelForm() {
  const { data, setField } = useMockup();

  return (
    <div className="space-y-3">
      <Field label="Plant species / ชนิดพืช">
        <Input
          value={data.species}
          onChange={(e) => setField("species", e.target.value)}
        />
      </Field>
      <Field label="Variety / ชื่อพันธุ์">
        <Input
          value={data.strainName}
          onChange={(e) => setField("strainName", e.target.value)}
          placeholder="AF99 – Bubba Kush Auto"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Lot No. / เลขล็อต">
          <Input
            value={data.lotNo}
            onChange={(e) => setField("lotNo", e.target.value)}
            placeholder="GF-AF99-2606-B01"
          />
        </Field>
        <Field label="Trademark / เครื่องหมายการค้า">
          <Input
            value={data.trademark}
            onChange={(e) => setField("trademark", e.target.value)}
            placeholder="SMILE"
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Net qty (seeds)">
          <Input
            type="number"
            min={0}
            value={data.quantity}
            onChange={(e) => setField("quantity", Number(e.target.value))}
          />
        </Field>
        <Field label="Purity %">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={data.purity}
            onChange={(e) => setField("purity", Number(e.target.value))}
          />
        </Field>
        <Field label="Germination %">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={data.germination}
            onChange={(e) => setField("germination", Number(e.target.value))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field label="Date of Collection / วันที่รวบรวม (MM/YYYY)">
          <Input
            value={data.collectedDate}
            onChange={(e) => setField("collectedDate", e.target.value)}
            placeholder="06/2026"
          />
        </Field>
        <Field label="Test date (DD/MM/YYYY)">
          <Input
            value={data.testedDate}
            onChange={(e) => setField("testedDate", e.target.value)}
            placeholder="DD/MM/YYYY"
          />
        </Field>
        <Field label="Expiry (MM/YYYY)">
          <Input
            value={data.expiryDate}
            onChange={(e) => setField("expiryDate", e.target.value)}
            placeholder="MM/YYYY"
          />
        </Field>
      </div>
      <Field label="Collection source / แหล่งรวบรวม">
        <Input
          value={data.collectionSource}
          onChange={(e) => setField("collectionSource", e.target.value)}
          placeholder="ประเทศไทย / Thailand"
        />
      </Field>
      <Field label="Collector / ผู้รวบรวม">
        <Input
          value={data.producerName}
          onChange={(e) => setField("producerName", e.target.value)}
        />
      </Field>
      <Field label="Collector P.P. No. / เลข พ.พ.3">
        <Input
          value={data.producerLicensePP}
          onChange={(e) => setField("producerLicensePP", e.target.value)}
          placeholder="102001102568"
        />
      </Field>
      <Field label="Collection place / สถานที่รวบรวม">
        <Textarea
          rows={2}
          value={data.address}
          onChange={(e) => setField("address", e.target.value)}
        />
      </Field>
      <Field label="Seller (optional) / ผู้ขาย">
        <Input
          value={data.distributorName}
          onChange={(e) => setField("distributorName", e.target.value)}
        />
      </Field>
      <Field label="Seller P.P.4 / พ.พ.4">
        <Input
          value={data.distributorLicensePP4}
          onChange={(e) => setField("distributorLicensePP4", e.target.value)}
          placeholder="1011043900042568"
        />
      </Field>
      <Field label="Storage / การเก็บรักษา (TH+EN)">
        <Textarea
          rows={3}
          value={data.storageInstructions}
          onChange={(e) => setField("storageInstructions", e.target.value)}
        />
      </Field>
    </div>
  );
}
