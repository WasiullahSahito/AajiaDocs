/**
 * All SQL lives here. Routes and pages call these functions and never
 * build queries themselves.
 */
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type { ShareRole } from "@/lib/access";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  ownerName: string;
  updatedAt: Date;
  shares: { userId: string; role: ShareRole }[];
}

export interface DocumentSummary {
  id: string;
  title: string;
  updatedAt: Date;
}

export async function listUsers(): Promise<User[]> {
  const { rows } = await db().query<User>("SELECT id, email, name FROM users ORDER BY name");
  return rows;
}

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await db().query<User>("SELECT id, email, name FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await db().query<User>("SELECT id, email, name FROM users WHERE lower(email) = lower($1)", [email]);
  return rows[0] ?? null;
}

export async function findDocument(id: string): Promise<DocumentRecord | null> {
  const { rows } = await db().query(
    `SELECT d.id, d.title, d.content, d.owner_id, d.updated_at, u.name AS owner_name,
            COALESCE(json_agg(json_build_object('userId', s.user_id, 'role', s.role))
                     FILTER (WHERE s.user_id IS NOT NULL), '[]') AS shares
       FROM documents d
       JOIN users u ON u.id = d.owner_id
       LEFT JOIN document_shares s ON s.document_id = d.id
      WHERE d.id = $1
      GROUP BY d.id, u.name`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    updatedAt: r.updated_at,
    shares: r.shares,
  };
}

export async function listOwnedDocuments(userId: string): Promise<(DocumentSummary & { shareCount: number })[]> {
  const { rows } = await db().query(
    `SELECT d.id, d.title, d.updated_at, COUNT(s.user_id)::int AS share_count
       FROM documents d
       LEFT JOIN document_shares s ON s.document_id = d.id
      WHERE d.owner_id = $1
      GROUP BY d.id
      ORDER BY d.updated_at DESC`,
    [userId],
  );
  return rows.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updated_at, shareCount: r.share_count }));
}

export async function listSharedDocuments(
  userId: string,
): Promise<(DocumentSummary & { ownerName: string; role: ShareRole })[]> {
  const { rows } = await db().query(
    `SELECT d.id, d.title, d.updated_at, u.name AS owner_name, s.role
       FROM document_shares s
       JOIN documents d ON d.id = s.document_id
       JOIN users u ON u.id = d.owner_id
      WHERE s.user_id = $1
      ORDER BY d.updated_at DESC`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: r.updated_at,
    ownerName: r.owner_name,
    role: r.role,
  }));
}

export async function createDocument(input: { ownerId: string; title: string; content: string }): Promise<string> {
  const id = randomUUID();
  await db().query("INSERT INTO documents (id, title, content, owner_id) VALUES ($1, $2, $3, $4)", [
    id,
    input.title,
    input.content,
    input.ownerId,
  ]);
  return id;
}

export async function updateDocument(
  id: string,
  patch: { title?: string; content?: string },
): Promise<{ title: string; updatedAt: Date }> {
  const { rows } = await db().query(
    `UPDATE documents
        SET title = COALESCE($2, title),
            content = COALESCE($3, content),
            updated_at = now()
      WHERE id = $1
      RETURNING title, updated_at`,
    [id, patch.title ?? null, patch.content ?? null],
  );
  return { title: rows[0].title, updatedAt: rows[0].updated_at };
}

export async function deleteDocument(id: string): Promise<void> {
  await db().query("DELETE FROM documents WHERE id = $1", [id]);
}

export async function listShares(documentId: string): Promise<(User & { role: ShareRole })[]> {
  const { rows } = await db().query(
    `SELECT u.id, u.email, u.name, s.role
       FROM document_shares s JOIN users u ON u.id = s.user_id
      WHERE s.document_id = $1
      ORDER BY s.created_at`,
    [documentId],
  );
  return rows;
}

export async function upsertShare(documentId: string, userId: string, role: ShareRole): Promise<void> {
  await db().query(
    `INSERT INTO document_shares (document_id, user_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (document_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [documentId, userId, role],
  );
}

export async function removeShare(documentId: string, userId: string): Promise<void> {
  await db().query("DELETE FROM document_shares WHERE document_id = $1 AND user_id = $2", [documentId, userId]);
}
