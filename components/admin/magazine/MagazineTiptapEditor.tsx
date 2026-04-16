"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Theme, type EmojiClickData } from "emoji-picker-react";
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
  Smile,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MagazineProductPickerDialog } from "./MagazineProductPickerDialog";

const EmojiPickerDynamic = dynamic(
  async () => (await import("emoji-picker-react")).default,
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[360px] w-[352px] items-center justify-center rounded-lg bg-zinc-50 text-xs text-zinc-500"
        aria-hidden
      >
        Loading…
      </div>
    ),
  }
);

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
          ? "bg-emerald-100 text-emerald-900"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

function EmojiInsertPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Insert emoji"
          className="rounded-md px-2 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Smile className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border-zinc-200 bg-white p-0 shadow-xl"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <EmojiPickerDynamic
          width={352}
          height={400}
          theme={Theme.LIGHT}
          onEmojiClick={(data: EmojiClickData) => {
            editor.chain().focus().insertContent(data.emoji).run();
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
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
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50/90 px-2 py-2">
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
      <EmojiInsertPopover editor={editor} />
      <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
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
      <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
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
      <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
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
          "min-h-[420px] bg-white px-4 py-4 text-zinc-900 focus:outline-none prose prose-zinc prose-sm max-w-none sm:prose-base [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-600/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-700 [&_hr]:border-zinc-200",
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
      <div className="min-h-[420px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-50" />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
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
