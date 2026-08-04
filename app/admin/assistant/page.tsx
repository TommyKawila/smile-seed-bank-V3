import { AdminAssistantChat } from "@/components/admin/assistant/AdminAssistantChat";

export const dynamic = "force-dynamic";

export default function AdminAssistantPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          SSB Assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bidirectional chat with your private AI secretary (same persona as Telegram).
        </p>
      </div>
      <AdminAssistantChat />
    </div>
  );
}
