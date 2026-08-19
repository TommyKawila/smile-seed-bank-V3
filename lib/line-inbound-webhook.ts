import { NextResponse } from "next/server";
import { verifyLineChannelWebhookSignature } from "@/lib/line-webhook-signature";
import {
  extractB2BRefFromLineMessage,
  linkLineUserFromOrderChatMessage,
  type LinkOrderChatResult,
} from "@/lib/line-order-message-link";
import { buildOrderLineLinkSuccessFlex } from "@/lib/line-order-link-flex";
import {
  LINE_OA_ALREADY_LINKED_OTHER,
  LINE_OA_ALREADY_LINKED_YOU_GENERIC,
  LINE_OA_GENERAL_ACK,
  LINE_OA_ORDER_NOT_FOUND,
  lineOaAlreadyLinkedYou,
  lineOaB2bAck,
} from "@/lib/line-oa-auto-reply";
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
      return "";
    case "already_linked_you":
      return orderNumber
        ? lineOaAlreadyLinkedYou(orderNumber)
        : LINE_OA_ALREADY_LINKED_YOU_GENERIC;
    case "already_linked_other":
      return LINE_OA_ALREADY_LINKED_OTHER;
    case "order_not_found":
      return LINE_OA_ORDER_NOT_FOUND;
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
    const { logSecurityEvent } = await import("@/lib/security-log");
    logSecurityEvent("webhook_reject", { source: "line" });
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

      const rt = ev.replyToken;
      const suppress = await shouldSuppressLineOrderLinkPrompt(lineUserId);

      const b2bRef = extractB2BRefFromLineMessage(text);
      if (b2bRef) {
        if (!suppress && rt) await replyLineText(rt, lineOaB2bAck(b2bRef));
        await recordLineUserInteraction(lineUserId);
        continue;
      }

      const result = await linkLineUserFromOrderChatMessage(lineUserId, text);

      if (result.outcome === "linked" && rt && result.orderNumber) {
        const flex = buildOrderLineLinkSuccessFlex(result.orderNumber);
        await replyLineFlex(rt, flex);
      } else if (result.outcome === "no_token") {
        if (!suppress && rt) await replyLineText(rt, LINE_OA_GENERAL_ACK);
      } else if (result.outcome === "order_not_found") {
        if (!suppress && rt) await replyLineText(rt, LINE_OA_ORDER_NOT_FOUND);
      } else if (rt) {
        const msg = replyTextForOutcome(result.outcome, result.orderNumber);
        const alwaysReply = result.outcome === "already_linked_other";
        if (msg && (alwaysReply || !suppress)) await replyLineText(rt, msg);
      }

      await recordLineUserInteraction(lineUserId);
    } catch (e) {
      console.error("[line webhook] event handler:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
