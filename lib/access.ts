/**
 * Single source of truth for document permissions.
 * Pure functions (no DB, no framework) so they are trivially unit-testable
 * and every API route + page goes through the same rules.
 */
export type ShareRole = "viewer" | "editor";
export type Role = "owner" | ShareRole;
export type Action = "read" | "edit" | "share" | "delete";

export interface AccessSubject {
  ownerId: string;
  shares: { userId: string; role: ShareRole }[];
}

const PERMISSIONS: Record<Role, readonly Action[]> = {
  owner: ["read", "edit", "share", "delete"],
  editor: ["read", "edit"],
  viewer: ["read"],
};

export function resolveRole(userId: string | null | undefined, doc: AccessSubject): Role | null {
  if (!userId) return null;
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares.find((s) => s.userId === userId);
  return share ? share.role : null;
}

export function can(role: Role | null, action: Action): boolean {
  return role !== null && PERMISSIONS[role].includes(action);
}
