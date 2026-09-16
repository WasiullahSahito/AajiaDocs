import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { loadDocumentFor } from "@/lib/documents";
import { readJson, withErrors } from "@/lib/http";
import { deleteDocument, updateDocument } from "@/lib/repo";
import { sanitizeDocHtml } from "@/lib/sanitize";
import { updateDocumentSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const { doc, role } = await loadDocumentFor(id, user.id, "read");
  return NextResponse.json({
    document: { id: doc.id, title: doc.title, content: doc.content, ownerName: doc.ownerName, updatedAt: doc.updatedAt },
    role,
  });
});

export const PATCH = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const patch = updateDocumentSchema.parse(await readJson(req));
  await loadDocumentFor(id, user.id, "edit");

  const saved = await updateDocument(id, {
    title: patch.title,
    content: patch.content === undefined ? undefined : sanitizeDocHtml(patch.content) || "<p></p>",
  });
  return NextResponse.json({ document: { id, ...saved } });
});

export const DELETE = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  await loadDocumentFor(id, user.id, "delete");
  await deleteDocument(id);
  return new Response(null, { status: 204 });
});
