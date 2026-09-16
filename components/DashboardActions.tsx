"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const ACCEPT = ".txt,.md,.docx";
const MAX_BYTES = 4 * 1024 * 1024;

export function DashboardActions() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"create" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createDocument() {
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create the document.");
      router.push(`/documents/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the document.");
      setBusy(null);
    }
  }

  async function importFile(file: File) {
    setError(null);
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPT.split(",").includes(ext)) {
      setError("Unsupported file type. Import a .txt, .md, or .docx file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("The file is larger than 4 MB.");
      return;
    }
    setBusy("import");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/documents/import", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      router.push(`/documents/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
      setBusy(null);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="dashboard-actions">
      <div className="dashboard-buttons">
        <button type="button" className="button button-primary" onClick={createDocument} disabled={busy !== null}>
          {busy === "create" ? "Creating…" : "New document"}
        </button>
        <button
          type="button"
          className="button"
          onClick={() => fileInput.current?.click()}
          disabled={busy !== null}
        >
          {busy === "import" ? "Importing…" : "Import file"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFile(file);
          }}
        />
      </div>
      <p className="hint">Import creates a new document from a .txt, .md, or .docx file (up to 4 MB).</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
