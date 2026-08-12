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
          Build a print-ready seed label, place it on a package photo, export
          PNG, or share a read-only link with the team.
        </p>
      </div>
      <MockupProvider>
        <MockupWorkspace />
      </MockupProvider>
    </div>
  );
}
