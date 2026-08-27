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
      <Field label="Species">
        <Input
          value={data.species}
          onChange={(e) => setField("species", e.target.value)}
        />
      </Field>
      <Field label="Strain name">
        <Input
          value={data.strainName}
          onChange={(e) => setField("strainName", e.target.value)}
          placeholder="e.g. AF99"
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Quantity">
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
        <Field label="Collected">
          <Input
            type="date"
            value={data.collectedDate}
            onChange={(e) => setField("collectedDate", e.target.value)}
          />
        </Field>
        <Field label="Tested">
          <Input
            type="date"
            value={data.testedDate}
            onChange={(e) => setField("testedDate", e.target.value)}
          />
        </Field>
        <Field label="Expiry">
          <Input
            type="date"
            value={data.expiryDate}
            onChange={(e) => setField("expiryDate", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Producer name">
        <Input
          value={data.producerName}
          onChange={(e) => setField("producerName", e.target.value)}
        />
      </Field>
      <Field label="Producer license ร.พ.2">
        <Input
          value={data.producerLicenseRP2}
          onChange={(e) => setField("producerLicenseRP2", e.target.value)}
        />
      </Field>
      <Field label="Distributor name">
        <Input
          value={data.distributorName}
          onChange={(e) => setField("distributorName", e.target.value)}
        />
      </Field>
      <Field label="Distributor license พ.พ.4">
        <Input
          value={data.distributorLicensePP4}
          onChange={(e) => setField("distributorLicensePP4", e.target.value)}
          placeholder="1011043900042568"
        />
      </Field>
      <Field label="Address">
        <Textarea
          rows={2}
          value={data.address}
          onChange={(e) => setField("address", e.target.value)}
        />
      </Field>
      <Field label="Storage instructions">
        <Textarea
          rows={3}
          value={data.storageInstructions}
          onChange={(e) => setField("storageInstructions", e.target.value)}
        />
      </Field>
    </div>
  );
}
