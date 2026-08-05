import { AdminAssistantChat } from "@/components/admin/assistant/AdminAssistantChat";
import { AdminKnowledgePanel } from "@/components/admin/assistant/AdminKnowledgePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default function AdminAssistantPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          SSB Assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bidirectional chat with your private AI secretary (same persona as
          Telegram).
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid h-11 w-full max-w-xs grid-cols-2">
          <TabsTrigger value="chat" className="min-h-9">
            Chat
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="min-h-9">
            Knowledge
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-4">
          <AdminAssistantChat />
        </TabsContent>
        <TabsContent value="knowledge" className="mt-4">
          <AdminKnowledgePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
