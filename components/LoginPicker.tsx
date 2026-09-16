"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@/lib/repo";

export function LoginPicker({ users }: { users: User[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (users.length === 0) {
    return <p className="error">No accounts found. Run `npm run db:setup` to seed demo users.</p>;
  }

  async function signIn(userId: string) {
    setPendingId(userId);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Sign-in failed.");
      router.push("/documents");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
      setPendingId(null);
    }
  }

  return (
    <>
      <ul className="account-list">
        {users.map((u) => (
          <li key={u.id}>
            <button type="button" className="account" onClick={() => signIn(u.id)} disabled={pendingId !== null}>
              <span className="avatar" aria-hidden="true">
                {u.name.charAt(0)}
              </span>
              <span className="account-text">
                <strong>{u.name}</strong>
                <span className="muted">{u.email}</span>
              </span>
              {pendingId === u.id && <span className="muted">Signing in…</span>}
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
