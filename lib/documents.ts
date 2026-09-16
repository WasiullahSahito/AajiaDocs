import { can, resolveRole, type Action, type Role } from "@/lib/access";
import { HttpError } from "@/lib/errors";
import { findDocument, type DocumentRecord } from "@/lib/repo";

/**
 * Loads a document and enforces `action` for `userId`.
 * Users with no access get 404 (we don't reveal that the document exists);
 * users who can see it but lack the permission get 403.
 */
export async function loadDocumentFor(
  documentId: string,
  userId: string,
  action: Action,
): Promise<{ doc: DocumentRecord; role: Role }> {
  const doc = await findDocument(documentId);
  const role = doc ? resolveRole(userId, doc) : null;
  if (!doc || !role) throw new HttpError(404, "Document not found.");
  if (!can(role, action)) {
    const verbs: Record<Action, string> = { read: "open", edit: "edit", share: "share", delete: "delete" };
    throw new HttpError(403, `You don't have permission to ${verbs[action]} this document.`);
  }
  return { doc, role };
}
