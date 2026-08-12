import type { SeedLabelData } from "@/types/label";

type Props = {
  data: SeedLabelData;
  className?: string;
};

/** Stateless B&W print-ready seed label */
export function LabelGraphic({ data, className }: Props) {
  return (
    <div
      className={
        className ??
        "box-border w-[280px] select-none bg-white text-black border border-black p-2.5 font-sans leading-tight"
      }
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="border-b border-black pb-1.5 mb-1.5 text-center">
        <p className="text-[9px] uppercase tracking-wide">Seed Label</p>
        <p className="text-sm font-bold leading-snug">{data.strainName || "—"}</p>
        <p className="text-[10px]">{data.species}</p>
      </div>

      <div className="grid grid-cols-3 gap-x-1 gap-y-0.5 text-[10px] mb-1.5">
        <div>
          <span className="opacity-60">Qty</span>
          <p className="font-semibold">{data.quantity}</p>
        </div>
        <div>
          <span className="opacity-60">Purity %</span>
          <p className="font-semibold">{data.purity}</p>
        </div>
        <div>
          <span className="opacity-60">Germ %</span>
          <p className="font-semibold">{data.germination}</p>
        </div>
      </div>

      <div className="space-y-0.5 text-[9px] mb-1.5 border-y border-black/40 py-1.5">
        <p>
          <span className="opacity-60">Collected: </span>
          {data.collectedDate || "—"}
        </p>
        <p>
          <span className="opacity-60">Tested: </span>
          {data.testedDate || "—"}
        </p>
        <p>
          <span className="opacity-60">Expiry: </span>
          {data.expiryDate || "—"}
        </p>
      </div>

      <div className="space-y-1 text-[9px] mb-1.5">
        <div>
          <p className="font-semibold">Producer</p>
          <p>{data.producerName || "—"}</p>
          <p className="opacity-70">ร.พ.2: {data.producerLicenseRP2 || "—"}</p>
        </div>
        <div>
          <p className="font-semibold">Distributor</p>
          <p>{data.distributorName || "—"}</p>
          <p className="opacity-70">พ.พ.3: {data.distributorLicensePP3 || "—"}</p>
        </div>
        <div>
          <p className="font-semibold">Address</p>
          <p className="whitespace-pre-wrap">{data.address || "—"}</p>
        </div>
      </div>

      <div className="border-t border-black pt-1.5 text-[8px] leading-snug">
        <p className="font-semibold mb-0.5">Storage</p>
        <p>{data.storageInstructions}</p>
      </div>
    </div>
  );
}
