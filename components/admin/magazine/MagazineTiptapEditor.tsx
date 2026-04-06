"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  Quote,
  Minus,
  ShoppingBag,
} from "lucide-react";
import { MagazineProductPickerDialog } from "./MagazineProductPickerDialog";

const defaultDoc = { type: "doc", content: [{ type: "paragraph" }] };

type Props = {
  content: object | null;
  onChange: (json: object) => void;
  placeholder?: string;
};

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-emerald-500/25 text-emerald-200"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

function MenuBar({
  editor,
  onInsertProduct,
}: {
  editor: Editor | null;
  onInsertProduct: () => void;
}) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-800 bg-zinc-900/80 px-2 py-2">
      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-zinc-700" aria-hidden />
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-zinc-700" aria-hidden />
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Horizontal rule"
        active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-zinc-700" aria-hidden />
      <ToolbarButton
        title="Insert Product Card"
        active={false}
        onClick={onInsertProduct}
      >
        <ShoppingBag className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function MagazineTiptapEditor({ content, onChange, placeholder }: Props) {
  const [productOpen, setProductOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const initialContent = useRef(content ?? defaultDoc);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: initialContent.current,
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] px-4 py-4 focus:outline-none prose prose-invert prose-sm max-w-none sm:prose-base [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_hr]:border-zinc-700",
      },
    },
    // Defer ProseMirror render until browser; avoids SSR/client HTML mismatch.
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON());
    },
  });

  if (!mounted || !editor) {
    return (
      <div className="min-h-[420px] animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50" />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <MenuBar editor={editor} onInsertProduct={() => setProductOpen(true)} />
      <EditorContent editor={editor} data-placeholder={placeholder} />
      <MagazineProductPickerDialog
        open={productOpen}
        onOpenChange={setProductOpen}
        title="Insert Product Card"
        onSelect={(p) => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "paragraph",
              content: [{ type: "text", text: `[PRODUCT_CARD:${p.id}]` }],
            })
            .run();
        }}
      />
    </div>
  );
}
