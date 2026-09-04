import { MockupProvider } from "@/components/mockup/MockupContext";
import { MockupWorkspace } from "@/components/mockup/MockupWorkspace";

export const metadata = {
  title: "Label Mockup · Green Future · Admin",
};

export default function GreenFutureMockupPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900">Label Mockup</h2>
        <p className="max-w-2xl text-sm text-slate-500">
          DOA-controlled seed label V.2.1 — bilingual TH+EN on 5.5 × 5.5 cm
          rear sticker. Date of Collection only (no import). Export PNG/PDF or
          share a read-only link with Green Future.
        </p>
      </div>
      <MockupProvider>
        <MockupWorkspace />
      </MockupProvider>
    </div>
  );
}
