"use client";

import type { Editor } from "@tiptap/react";

type BlockStyle = "paragraph" | "h1" | "h2" | "h3";

function currentBlock(editor: Editor): BlockStyle {
  for (const level of [1, 2, 3] as const) {
    if (editor.isActive("heading", { level })) return `h${level}`;
  }
  return "paragraph";
}

function ToolButton(props: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`tool${props.active ? " is-active" : ""}`}
      aria-label={props.label}
      aria-pressed={props.active}
      title={props.label}
      disabled={props.disabled}
      // Keep focus (and the selection) inside the editor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export function Toolbar({ editor }: { editor: Editor }) {
  const chain = () => editor.chain().focus();

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <select
        className="tool-select"
        aria-label="Text style"
        value={currentBlock(editor)}
        onChange={(e) => {
          const v = e.target.value as BlockStyle;
          if (v === "paragraph") chain().setParagraph().run();
          else chain().setHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
        }}
      >
        <option value="paragraph">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <span className="tool-divider" aria-hidden="true" />

      <ToolButton label="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}>
        <strong>B</strong>
      </ToolButton>
      <ToolButton label="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}>
        <em>I</em>
      </ToolButton>
      <ToolButton
        label="Underline (Ctrl+U)"
        active={editor.isActive("underline")}
        onClick={() => chain().toggleUnderline().run()}
      >
        <u>U</u>
      </ToolButton>

      <span className="tool-divider" aria-hidden="true" />

      <ToolButton
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => chain().toggleBulletList().run()}
      >
        • List
      </ToolButton>
      <ToolButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => chain().toggleOrderedList().run()}
      >
        1. List
      </ToolButton>

      <span className="tool-divider" aria-hidden="true" />

      <ToolButton label="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}>
        Undo
      </ToolButton>
      <ToolButton label="Redo (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}>
        Redo
      </ToolButton>
    </div>
  );
}
