import Loader2 from "lucide-react/dist/esm/icons/loader-2";

export default function LineLiffEntryLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-800" aria-hidden />
      <p className="mt-4 text-sm font-medium text-zinc-700">กำลังโหลด…</p>
    </div>
  );
}
