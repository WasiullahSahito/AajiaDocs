"use client";

import { useEffect, useRef, useState } from "react";

type Share = { id: string; email: string; name: string; role: "viewer" | "editor" };

async function call(url: string, init?: RequestInit): Promise<Share[]> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data.shares;
}

export function ShareDialog({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const base = `/api/documents/${documentId}/shares`;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    emailRef.current?.focus();
    call(base).then(setShares).catch((e) => setError(e.message));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [base]);

  async function run(action: () => Promise<Share[]>, success: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setShares(await action());
      setNotice(success);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="dialog-head">
          <h2 id="share-title">Share document</h2>
          <button type="button" className="button button-quiet" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <form
          className="share-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await run(() => call(base, json("POST", { email, role })), `Shared with ${email}.`);
            if (ok) setEmail("");
          }}
        >
          <input
            ref={emailRef}
            type="email"
            required
            placeholder="Email address"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select aria-label="Access level" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="editor">Can edit</option>
            <option value="viewer">Can view</option>
          </select>
          <button type="submit" className="button button-primary" disabled={busy || !email.trim()}>
            Share
          </button>
        </form>
        <p className="hint">Demo accounts: alice@ajaia.test, bob@ajaia.test, carol@ajaia.test</p>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}

        <h3 className="dialog-subhead">People with access</h3>
        {shares === null ? (
          <p className="muted">Loading…</p>
        ) : shares.length === 0 ? (
          <p className="muted">Only you can see this document.</p>
        ) : (
          <ul className="share-list">
            {shares.map((s) => (
              <li key={s.id}>
                <span className="avatar" aria-hidden="true">
                  {s.name.charAt(0)}
                </span>
                <span className="account-text">
                  <strong>{s.name}</strong>
                  <span className="muted">{s.email}</span>
                </span>
                <select
                  aria-label={`Access level for ${s.name}`}
                  value={s.role}
                  disabled={busy}
                  onChange={(e) =>
                    run(
                      () => call(base, json("POST", { email: s.email, role: e.target.value })),
                      `Updated access for ${s.name}.`,
                    )
                  }
                >
                  <option value="editor">Can edit</option>
                  <option value="viewer">Can view</option>
                </select>
                <button
                  type="button"
                  className="link-button danger"
                  disabled={busy}
                  onClick={() =>
                    run(() => call(`${base}/${s.id}`, { method: "DELETE" }), `Removed ${s.name}.`)
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
