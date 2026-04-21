import { NextResponse } from "next/server";
import { verifyLineChannelWebhookSignature } from "@/lib/line-webhook-signature";
import {
  linkLineUserFromOrderChatMessage,
  type LinkOrderChatResult,
} from "@/lib/line-order-message-link";
import { buildOrderLineLinkSuccessFlex } from "@/lib/line-order-link-flex";
import {
  recordLineUserInteraction,
  shouldSuppressLineOrderLinkPrompt,
} from "@/lib/line-user-interaction";

type LineWebhookBody = {
  events?: Array<{
    type?: string;
    replyToken?: string;
    source?: { userId?: string };
    message?: { type?: string; text?: string };
  }>;
};

async function replyLineText(replyToken: string, text: string): Promise<void> {
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

async function replyLineFlex(
  replyToken: string,
  payload: ReturnType<typeof buildOrderLineLinkSuccessFlex>
): Promise<void> {
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
      messages: [
        {
          type: "flex",
          altText: payload.altText,
          contents: payload.contents,
        },
      ],
    }),
  });
}

function replyTextForOutcome(
  outcome: LinkOrderChatResult["outcome"],
  orderNumber?: string
): string {
  switch (outcome) {
    case "linked":
      return ""; // Flex only
    case "already_linked_you":
      return orderNumber
        ? `เชื่อมต่อออเดอร์ #${orderNumber} อยู่แล้ว — เราจะแจ้งเตือนคุณเมื่อพัสดุถูกจัดส่ง\n\nEN: Already linked; we will notify you when your order ships.`
        : "เชื่อมต่อออเดอร์นี้อยู่แล้ว\n\nEN: This order is already linked to your LINE.";
    case "already_linked_other":
      return "ออเดอร์นี้เชื่อมกับ LINE อื่นแล้ว หากเป็นของคุณจริง กรุณาติดต่อแอดมิน\n\nEN: This order is linked to another LINE account.";
    case "order_not_found":
      return "ไม่พบเลขออเดอร์นี้ กรุณาตรวจสอบแล้วส่งใหม่ เช่น Order #XXXXXX\n\nEN: Order not found. Send e.g. Order #YOUR_ORDER_NUMBER";
    case "no_token":
      return "";
    default:
      return "";
  }
}

export async function handleLineMessagingWebhookPost(req: Request): Promise<Response> {
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
    try {
      if (ev.type !== "message" || ev.message?.type !== "text") continue;
      const lineUserId = ev.source?.userId?.trim();
      const text = ev.message?.text ?? "";
      if (!lineUserId || !text.trim()) continue;

      const result = await linkLineUserFromOrderChatMessage(lineUserId, text);
      const rt = ev.replyToken;

      if (result.outcome === "no_token") {
        const suppress = await shouldSuppressLineOrderLinkPrompt(lineUserId);
        if (!suppress && rt) {
          await replyLineText(
            rt,
            "ส่งรูปแบบ เช่น Order #เลขออเดอร์ หรือ #SSB-12345 เพื่อเชื่อม LINE\nSend e.g. Order #YOUR_ORDER_NUMBER or #SSB-12345"
          );
        }
      } else if (result.outcome === "linked" && rt && result.orderNumber) {
        const flex = buildOrderLineLinkSuccessFlex(result.orderNumber);
        await replyLineFlex(rt, flex);
      } else if (rt) {
        const msg = replyTextForOutcome(result.outcome, result.orderNumber);
        if (msg) await replyLineText(rt, msg);
      }

      await recordLineUserInteraction(lineUserId);
    } catch (e) {
      console.error("[line webhook] event handler:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
