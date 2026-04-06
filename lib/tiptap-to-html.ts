import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

export function tiptapJsonToHtml(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const o = doc as { type?: string };
  if (o.type !== "doc") return "";
  try {
    return generateHTML(doc as JSONContent, [StarterKit]);
  } catch {
    return "";
  }
}
