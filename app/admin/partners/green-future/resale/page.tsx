import { GreenFutureResaleClient } from "@/components/admin/partners/GreenFutureResaleClient";

export const metadata = {
  title: "Resale pricing · Green Future · Admin",
};

export default function GreenFutureResalePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900">Resale pricing</h2>
        <p className="max-w-2xl text-sm text-slate-500">
          Recommended B2B and retail sell prices from Green Future cost. Does not
          change the public wholesale calculator.
        </p>
      </div>
      <GreenFutureResaleClient />
    </div>
  );
}
