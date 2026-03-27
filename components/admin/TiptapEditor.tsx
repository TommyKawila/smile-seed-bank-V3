"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect } from "react";

interface TiptapEditorProps {
  content?: object | string | null;
  onChange?: (json: object) => void;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({ content, onChange, placeholder, className }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content ?? "",
    editorProps: {
      attributes: {
        class: "min-h-[200px] px-3 py-2 focus:outline-none [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4",
      },
    },
  });

  const handleUpdate = useCallback(() => {
    if (editor) onChange?.(editor.getJSON());
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", handleUpdate);
    return () => editor.off("update", handleUpdate);
  }, [editor, handleUpdate]);

  if (!editor) return <div className="min-h-[200px] animate-pulse rounded border bg-zinc-50" />;

  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white ${className ?? ""}`}
      data-placeholder={placeholder}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
