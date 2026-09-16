"use client";

import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Role } from "@/lib/access";
import { ShareDialog } from "@/components/ShareDialog";
import { Toolbar } from "@/components/Toolbar";

type SaveState = "saved" | "unsaved" | "saving" | "error";
type Patch = { title?: string; content?: string };

const AUTOSAVE_DELAY_MS = 800;

interface Props {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  role: Role;
  ownerName: string;
}

export function DocumentEditor({ documentId, initialTitle, initialContent, role, ownerName }: Props) {
  const router = useRouter();
  const canEdit = role !== "viewer";
  const [title, setTitle] = useState(initialTitle);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Autosave state lives in refs so editor callbacks never see stale values.
  const pending = useRef<Patch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const lastSavedTitle = useRef(initialTitle);

  const hasPending = () => Object.keys(pending.current).length > 0;

  async function flush() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!hasPending()) return;
    if (inFlight.current) {
      // A save is running; try again shortly so requests never race.
      timer.current = setTimeout(() => flushRef.current(), AUTOSAVE_DELAY_MS);
      return;
    }

    const payload = pending.current;
    pending.current = {};
    inFlight.current = true;
    setSaveState("saving");

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status}).`);
      if (payload.title !== undefined) lastSavedTitle.current = data.document.title;
      setSaveError(null);
      setSaveState(hasPending() ? "unsaved" : "saved");
    } catch (e) {
      // Put the failed changes back, underneath anything typed since.
      pending.current = { ...payload, ...pending.current };
      setSaveError(e instanceof Error ? e.message : "Save failed.");
      setSaveState("error");
    } finally {
      inFlight.current = false;
      if (hasPending() && !timer.current) {
        timer.current = setTimeout(() => flushRef.current(), AUTOSAVE_DELAY_MS * 4);
      }
    }
  }
  const flushRef = useRef(flush);
  flushRef.current = flush;

  function queueSave(patch: Patch) {
    pending.current = { ...pending.current, ...patch };
    setSaveState("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flushRef.current(), AUTOSAVE_DELAY_MS);
  }

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), Underline],
    content: initialContent,
    editable: canEdit,
    immediatelyRender: false,
    editorProps: { attributes: { class: "doc-body", "aria-label": "Document content" } },
    onUpdate: ({ editor }) => queueSave({ content: editor.getHTML() }),
  });

  // Warn before closing the tab with unsaved changes; flush when navigating away in-app.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPending() || inFlight.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flushRef.current();
    };
  }, []);

  async function deleteDocument() {
    if (!window.confirm("Delete this document for everyone? This can't be undone.")) return;
    pending.current = {};
    if (timer.current) clearTimeout(timer.current);
    const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/documents");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setSaveError(data.error ?? "Couldn't delete the document.");
      setSaveState("error");
    }
  }

  const statusText: Record<SaveState, string> = {
    saved: "All changes saved",
    unsaved: "Unsaved changes",
    saving: "Saving…",
    error: saveError ?? "Save failed",
  };

  return (
    <div className="editor-page">
      <header className="editor-header">
        <Link href="/documents" className="back-link" onClick={() => void flush()}>
          ← Documents
        </Link>

        <input
          className="title-input"
          aria-label="Document title"
          value={title}
          maxLength={200}
          readOnly={!canEdit}
          onChange={(e) => {
            setTitle(e.target.value);
            const trimmed = e.target.value.trim();
            if (trimmed) queueSave({ title: trimmed });
          }}
          onBlur={() => {
            if (!title.trim()) setTitle(lastSavedTitle.current);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              editor?.commands.focus("start");
            }
          }}
        />

        <div className="editor-header-right">
          {canEdit ? (
            <span className={`save-status save-${saveState}`} role="status" aria-live="polite">
              {statusText[saveState]}
              {saveState === "error" && (
                <button type="button" className="link-button" onClick={() => void flush()}>
                  Retry
                </button>
              )}
            </span>
          ) : (
            <span className="tag">View only</span>
          )}
          {role === "owner" ? (
            <>
              <button type="button" className="button button-quiet" onClick={() => void deleteDocument()}>
                Delete
              </button>
              <button type="button" className="button button-primary" onClick={() => setShareOpen(true)}>
                Share
              </button>
            </>
          ) : (
            <span className="muted owner-note">Owned by {ownerName}</span>
          )}
        </div>
      </header>

      {canEdit && editor && <Toolbar editor={editor} />}

      <main className="desk">
        <article className="sheet">
          {editor ? <EditorContent editor={editor} /> : <div className="doc-body doc-loading">Loading document…</div>}
        </article>
      </main>

      {role === "owner" && shareOpen && <ShareDialog documentId={documentId} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
