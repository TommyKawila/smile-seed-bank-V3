import { generateJSON } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

const extensions = [StarterKit];

/** Convert HTML fragment (from AI) to TipTap JSON matching MagazineTiptapEditor. */
export function htmlToTiptapDoc(html: string): JSONContent {
  const safe = html.trim() || "<p></p>";
  try {
    return generateJSON(safe, extensions) as JSONContent;
  } catch {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: html.replace(/<[^>]+>/g, " ").trim() || " " }],
        },
      ],
    };
  }
}
