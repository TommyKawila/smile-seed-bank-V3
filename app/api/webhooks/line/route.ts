import { NextResponse } from "next/server";
import { verifyLineChannelWebhookSignature } from "@/lib/line-webhook-signature";
import { linkLineUserFromOrderChatMessage } from "@/lib/line-order-message-link";
import {
  recordLineUserInteraction,
  shouldSuppressLineOrderLinkPrompt,
} from "@/lib/line-user-interaction";

export const runtime = "nodejs";

type LineWebhookBody = {
  events?: Array<{
    type?: string;
    replyToken?: string;
    source?: { userId?: string };
    message?: { type?: string; text?: string };
  }>;
};

async function replyLineMessage(replyToken: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token || !replyToken) return;
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-line-signature");
  if (!verifyLineChannelWebhookSignature(raw, sig)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: LineWebhookBody;
  try {
    body = JSON.parse(raw) as LineWebhookBody;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const events = body.events ?? [];
  for (const ev of events) {
    if (ev.type !== "message" || ev.message?.type !== "text") continue;
    const lineUserId = ev.source?.userId?.trim();
    const text = ev.message?.text ?? "";
    if (!lineUserId || !text.trim()) continue;

    const result = await linkLineUserFromOrderChatMessage(lineUserId, text);

    if (result.ok && ev.replyToken) {
      await replyLineMessage(
        ev.replyToken,
        "ได้รับสลิปโอนเรียบร้อยแล้ว รอแอดมินตรวจสอบสักครู่\n\n" +
          "EN: Linked to this order; slip received — pending admin review."
      );
    } else if (!result.ok && result.reason === "no_order_token" && ev.replyToken) {
      const suppress = await shouldSuppressLineOrderLinkPrompt(lineUserId);
      if (!suppress) {
        await replyLineMessage(
          ev.replyToken,
          "ส่งรูปแบบ เช่น Order #เลขออเดอร์ เพื่อเชื่อม LINE\nSend e.g. Order #YOUR_ORDER_NUMBER"
        );
      }
    }

    await recordLineUserInteraction(lineUserId);
  }

  return NextResponse.json({ ok: true });
}
