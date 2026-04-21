import { handleLineMessagingWebhookPost } from "@/lib/line-inbound-webhook";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleLineMessagingWebhookPost(req);
}
