import { generateJSON } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

const extensions = [StarterKit];

function toPlainJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (v === undefined ? null : v))
  ) as T;
}

/** Convert HTML fragment (from AI) to TipTap JSON matching MagazineTiptapEditor. */
export function htmlToTiptapDoc(html: string): JSONContent {
  const safe = html.trim() || "<p></p>";
  try {
    const doc = generateJSON(safe, extensions) as JSONContent;
    return toPlainJson(doc);
  } catch {
    return toPlainJson({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: html.replace(/<[^>]+>/g, " ").trim() || " " }],
        },
      ],
    });
  }
}
